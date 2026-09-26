const labels = new Map();
const resolution = 4;
export function clearPencilLabels() { labels.clear(); }

function random(seed) {
  let value = seed >>> 0;
  return () => {
    value += 0x6d2b79f5;
    let t = Math.imul(value ^ value >>> 15, value | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

export const mapHandwriting = '"HanziPen SC","Hannotate SC","Kaiti SC","STKaiti","Trip Map Hand",cursive';
export const latinHandwriting = '"Noteworthy","Bradley Hand","Segoe Print","HanziPen SC",cursive';

export const letteringPresets = [
  {id:'soft', name:'轻描', code:'A', variation:.42, breaks:.14, outline:.48, fill:.78, grain:.38},
  {id:'balanced', name:'均衡', code:'B', variation:.64, breaks:.28, outline:.68, fill:.62, grain:.55},
  {id:'traced', name:'重描', code:'C', variation:.52, breaks:.18, outline:.96, fill:.34, grain:.45},
  {id:'dry', name:'干笔', code:'D', variation:.8, breaks:.48, outline:.7, fill:.65, grain:.78},
];
export const letteringKeys = ['variation','breaks','outline','fill','grain'];

export function letteringSettings(input = {}) {
  const defaults = letteringPresets[1];
  return Object.fromEntries(letteringKeys.map(key => [key, Number.isFinite(input[key]) ? Math.max(0,Math.min(1,input[key])) : defaults[key]]));
}

function hash(x, y, seed) {
  let n = Math.imul(x ^ seed, 374761393) ^ Math.imul(y, 668265263);
  n = Math.imul(n ^ n >>> 13, 1274126177);
  return ((n ^ n >>> 16) >>> 0) / 4294967296;
}

function field(x, y, seed) {
  const ix = Math.floor(x), iy = Math.floor(y), fx = x - ix, fy = y - iy;
  const sx = fx * fx * (3 - 2 * fx), sy = fy * fy * (3 - 2 * fy);
  return (hash(ix, iy, seed) * (1 - sx) + hash(ix + 1, iy, seed) * sx) * (1 - sy)
    + (hash(ix, iy + 1, seed) * (1 - sx) + hash(ix + 1, iy + 1, seed) * sx) * sy;
}

// Signed distances distinguish a traced edge from the lighter pigment inside a glyph.
function distanceTo(mask, width, height, inside) {
  const distance = new Float32Array(width * height);
  for (let i = 0; i < distance.length; i++) distance[i] = (mask[i * 4 + 3] > 100) === inside ? 0 : 1000;
  const relax = (i, neighbor, cost) => {distance[i] = Math.min(distance[i], distance[neighbor] + cost);};
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
    const i = y * width + x;
    if (x) relax(i, i - 1, 1);
    if (y) {relax(i, i - width, 1);if (x) relax(i, i - width - 1, 1.414);if (x + 1 < width) relax(i, i - width + 1, 1.414);}
  }
  for (let y = height - 1; y >= 0; y--) for (let x = width - 1; x >= 0; x--) {
    const i = y * width + x;
    if (x + 1 < width) relax(i, i + 1, 1);
    if (y + 1 < height) {relax(i, i + width, 1);if (x) relax(i, i + width - 1, 1.414);if (x + 1 < width) relax(i, i + width + 1, 1.414);}
  }
  return distance;
}

export function pencilLabel(text, {size = 19, family = mapHandwriting, color, paper, seed = 1, settings}) {
  const params = letteringSettings(settings);
  const key = JSON.stringify([text, size, family, color, paper, seed, params]);
  if (labels.has(key)) return labels.get(key);
  const mask = document.createElement('canvas');
  const measure = mask.getContext('2d');
  measure.fillStyle = color;
  measure.fillRect(0, 0, 1, 1);
  const rgb = measure.getImageData(0, 0, 1, 1).data;
  const font = `400 ${size}px ${family}`;
  measure.font = font;
  const characters = Array.from(text);
  const widths = characters.map(char => measure.measureText(char).width);
  const advance = Math.ceil(widths.reduce((sum, width) => sum + width, 0));
  const padding = 5, ascent = Math.ceil(size * 1.1), descent = Math.ceil(size * .35);
  const width = advance + padding * 2, height = ascent + descent + padding * 2;
  mask.width = width * resolution;mask.height = height * resolution;
  const ctx = mask.getContext('2d', {willReadFrequently:true});
  ctx.scale(resolution, resolution);ctx.font = font;ctx.fillStyle = color;ctx.strokeStyle = color;ctx.lineWidth = size >= 16 ? .48 : .24;
  const rng = random(seed);
  let x = padding;
  // Character placement stays fixed across redraws; no kerning is added to the font.
  characters.forEach((character, i) => {
    const center = x + widths[i] / 2, baseline = padding + ascent + (rng() - .5) * .55;
    ctx.save();ctx.translate(center, baseline);ctx.rotate((rng() - .5) * .035);
    ctx.globalAlpha = 1;
    ctx.fillText(character, -widths[i] / 2, 0);
    ctx.strokeText(character, -widths[i] / 2, 0);
    ctx.restore();x += widths[i];
  });
  const image = ctx.getImageData(0, 0, mask.width, mask.height);
  const shape = new Uint8ClampedArray(image.data);
  const outside = distanceTo(shape, mask.width, mask.height, true);
  const inside = distanceTo(shape, mask.width, mask.height, false);
  const clamp = n => Math.max(0, Math.min(1, n));
  const cuts = [];
  for (let char = 0; char < characters.length; char++) {
    const left = padding + widths.slice(0, char).reduce((a, b) => a + b, 0);
    // Each letter gets a few short, oriented skips, never an evenly spaced dash pattern.
    for (let attempt = 0, found = 0; attempt < 80 && found < 2; attempt++) {
      const cx = left + rng() * widths[char], cy = padding + ascent - size + rng() * size;
      const i = Math.floor(cy * resolution) * mask.width + Math.floor(cx * resolution);
      if (shape[i * 4 + 3] < 130) continue;
      const angle = rng() * Math.PI;
      cuts.push({x:cx,y:cy,c:Math.cos(angle),s:Math.sin(angle),long:1.1+rng()*.7,short:.22+rng()*.2});found++;
    }
  }
  // Only nearby pen lifts can affect a column; distant cuts have contact = 1.
  const columnCuts = Array.from({ length: mask.width }, (_, x) => cuts.filter(cut =>
    Math.abs(x / resolution - cut.x) <= Math.hypot(cut.c * cut.long, cut.s * cut.short) * 1.55));
  // Variation is in screen-pixel-sized patches so it survives normal-size rendering.
  for (let y = 0; y < mask.height; y++) {
    for (let x = 0; x < mask.width; x++) {
      const i = (y * mask.width + x) * 4;
      const pixel = y * mask.width + x;
      if (outside[pixel] > resolution * 1.1) {image.data[i + 3] = 0;continue;}
      const px = x / resolution, py = y / resolution;
      const force = field(px / 2.7, py / 2.4, seed + 31);
      const pressure = 1 - params.variation * .94 * (1 - clamp((force - .23) / .46) ** .85);
      const paperTooth = field(px * 2.3, py * 2.1, seed + 113);
      const tooth = 1 - params.grain * .76 * (1 - clamp((paperTooth - .2) / .53));
      let contact = 1;
      for (const cut of columnCuts[x]) {
        const dx = px - cut.x, dy = py - cut.y;
        const radius = Math.hypot((dx * cut.c + dy * cut.s) / cut.long, (-dx * cut.s + dy * cut.c) / cut.short);
        contact = Math.min(contact, clamp((radius - .85) / .7));
      }
      const distance = shape[i + 3] > 100 ? -(inside[pixel] - .5) / resolution : (outside[pixel] - .5) / resolution;
      const edgeWidth = .34 + params.outline * .5;
      const edgeWobble = (field(px * .9, py * .9, seed + 209) - .5) * .32 * params.outline;
      const rim = clamp(1 - Math.abs(distance + edgeWobble) / edgeWidth);
      const core = (shape[i + 3] / 255) * (.28 + .64 * params.fill);
      const lift = 1 - params.breaks * 1.75 * (1 - contact);
      // Pressure and grain affect the whole stroke, with a darker, uneven traced contour.
      const pigment = clamp(Math.max(core, rim * (.48 + .52 * params.outline)) * pressure * tooth * Math.max(.08, lift) * 1.38);
      image.data[i] = rgb[0];image.data[i + 1] = rgb[1];image.data[i + 2] = rgb[2];
      image.data[i + 3] = Math.round(255 * pigment);
    }
  }
  ctx.putImageData(image, 0, 0);
  const canvas = document.createElement('canvas');canvas.width = mask.width;canvas.height = mask.height;
  const output = canvas.getContext('2d');
  // Clear nearby map hatching without adding a rectangular label background.
  const reserve = document.createElement('canvas');reserve.width=mask.width;reserve.height=mask.height;
  const reserveContext=reserve.getContext('2d'),reserveImage=reserveContext.createImageData(mask.width,mask.height);
  for(let i=0;i<outside.length;i++) reserveImage.data[i*4+3]=Math.round(255*clamp((2.8-outside[i]/resolution)/1.1));
  reserveContext.putImageData(reserveImage,0,0);
  output.drawImage(reserve,0,0);output.globalCompositeOperation = 'source-in';output.fillStyle = paper;
  output.fillRect(0, 0, canvas.width, canvas.height);output.globalCompositeOperation = 'source-over';
  output.drawImage(mask, 0, 0);
  const label = {canvas, ink:mask, width, height, advance, ascent, descent, padding,
    draw(target, x, baseline) {target.drawImage(canvas, x - padding, baseline - ascent - padding, width, height);}};
  labels.set(key, label);
  if (labels.size > 160) labels.delete(labels.keys().next().value);
  return label;
}
