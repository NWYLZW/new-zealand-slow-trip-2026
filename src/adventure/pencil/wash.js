import { pencilStroke } from './stroke';
import { registerCanvasCache } from './canvasRecovery';

const cache = new Map();
registerCanvasCache(cache);
const cacheLimit = 64;

function randomAt(index, seed) {
  let value = Math.imul(index ^ seed, 0x45d9f3b);
  value = Math.imul(value ^ (value >>> 16), 0x45d9f3b);
  return ((value ^ (value >>> 16)) >>> 0) / 4294967296;
}

function makeWash(width, height, color, seed, ratio, settings) {
  const { strength, spacing, roughness, inset, radius, edgeReach } = settings;
  const bleed = edgeReach ? Math.ceil(edgeReach + 4) : 0;
  const canvas = document.createElement('canvas');
  canvas.width = Math.ceil((width + bleed * 2) * ratio);
  canvas.height = Math.ceil((height + bleed * 2) * ratio);
  const ctx = canvas.getContext('2d');
  ctx.scale(ratio, ratio);
  ctx.translate(bleed, bleed);
  const margin = inset + spacing + roughness * .4;
  const rows = Math.max(1, Math.floor((height - margin * 2) / spacing));

  // Each sweep lifts independently at the edges, leaving paper instead of a filled rectangle.
  for (let row = 0; row <= rows; row++) {
    const noise = offset => randomAt(row, seed + offset);
    const y = margin + row * spacing;
    const edgeDistance = Math.max(0, Math.min(y - inset, height - inset - y));
    const corner = edgeDistance < radius
      ? radius - Math.sqrt(radius * radius - (radius - edgeDistance) ** 2) : 0;
    const leftReach = edgeReach * (.15 + noise(359) * .85);
    const rightReach = edgeReach * (.15 + noise(383) * .85);
    const left = inset + corner + noise(31) * roughness * 1.8 - leftReach;
    const right = width - inset - corner - noise(67) * roughness * 1.8 + rightReach;
    if (right <= left) continue;
    const tilt = Math.min(4, width * .02) * (.35 + noise(101) * .65);
    const wave = Math.sin(row * .63 + seed % 19) * roughness * .24;
    // Extend the original sweeps; do not shrink the body or add detached edge marks.
    const edgeLift = edgeReach ? (margin + edgeReach) * Math.max(0, 1 - edgeDistance / (radius + spacing * 3))
      * (y < height / 2 ? -1 : 1) : 0;
    const points = [
      [left, y + wave + edgeLift * noise(397)],
      [left + (right - left) * .32, y - tilt * .3 + noise(149) - .5 + edgeLift * noise(401)],
      [left + (right - left) * .7, y - tilt * .7 + noise(181) - .5 + edgeLift * noise(409)],
      [right, y - tilt + wave + edgeLift * noise(419)],
    ];
    const feather = Math.min(1, (row + 1) / 3, (rows - row + 1) / 3);
    ctx.globalAlpha = Math.min(1, strength * feather * (.48 + noise(211) * .35));
    pencilStroke(ctx, points, color, spacing * 1.55, seed + row * 337, .9,
      1, false, { variation: .94, breaks: .28, grain: .76, gain: 2.1,
        step: 2.2, detail: 'fill', taperLength: 5 + noise(257) * 8 });
    if (row % 4 === 1) {
      ctx.globalAlpha = Math.min(1, strength * .28 * feather);
      pencilStroke(ctx, points, color, .5, seed + row * 613, .65,
        1, false, { variation: .85, breaks: .4, grain: .8, gain: 1.5,
          step: 2.4, detail: 'fill', taperLength: 9 });
    }
  }

  // Paper tooth breaks the pigment, not the text painted in a separate DOM layer.
  ctx.globalCompositeOperation = 'destination-out';
  const grains = Math.ceil((width + bleed * 2) * (height + bleed * 2) / 12);
  for (let index = 0; index < grains; index++) {
    const x = randomAt(index, seed + 811) * (width + bleed * 2) - bleed;
    const y = randomAt(index, seed + 977) * (height + bleed * 2) - bleed;
    const size = .35 + randomAt(index, seed + 1193) * .65;
    ctx.globalAlpha = .2 + randomAt(index, seed + 1301) * .5;
    ctx.fillRect(x, y, size, size * .6);
  }
  return canvas;
}

export function drawPencilWash(ctx, box, color, seed, options = {}) {
  const width = Math.ceil(box.width), height = Math.ceil(box.height);
  if (width < 1 || height < 1) return;
  const ratio = Math.min(window.devicePixelRatio || 1, 2);
  const settings = {
    strength: Math.max(0, options.strength ?? 1),
    spacing: Math.max(1, options.spacing ?? 2),
    roughness: Math.max(0, options.roughness ?? 3),
    inset: Math.max(2, options.inset ?? 3),
    radius: Math.max(0, Math.min(options.radius ?? 0, width / 2, height / 2)),
    edgeReach: Math.max(0, Math.min(options.edgeReach ?? 0, width / 4, height / 4)),
  };
  const key = JSON.stringify([width, height, color, seed, ratio, settings]);
  let texture = cache.get(key);
  if (!texture) {
    texture = makeWash(width, height, color, seed, ratio, settings);
    cache.set(key, texture);
    if (cache.size > cacheLimit) cache.delete(cache.keys().next().value);
  }
  const bleed = settings.edgeReach ? Math.ceil(settings.edgeReach + 4) : 0;
  const scaleX = box.width / width, scaleY = box.height / height;
  ctx.drawImage(texture, box.x - bleed * scaleX, box.y - bleed * scaleY,
    box.width + bleed * 2 * scaleX, box.height + bleed * 2 * scaleY);
}
