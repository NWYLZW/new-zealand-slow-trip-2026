function hash(index, seed) {
  let n = Math.imul(index ^ seed, 0x45d9f3b);
  n = Math.imul(n ^ (n >>> 16), 0x45d9f3b);
  return ((n ^ (n >>> 16)) >>> 0) / 4294967296;
}

function noise(at, seed) {
  const cell = Math.floor(at), t = at - cell, blend = t * t * (3 - 2 * t);
  return hash(cell, seed) * (1 - blend) + hash(cell + 1, seed) * blend;
}

const clamp = x => Math.max(0, Math.min(1, x));

// Pressure and lifts use distance along the original path, not a render-frame RNG.
export function strokeProfile(at, total, seed, settings = {}) {
  const variation = settings.variation ?? 1;
  const breaks = settings.breaks ?? .8;
  const grain = settings.grain ?? .7;
  const force = clamp(.12 + noise(at / 19, seed + 17) * .97
    + (noise(at / 5.3, seed + 39) - .5) * .3);
  const pressure = clamp(.72 * (1 - variation) + force * variation);
  let contact = 1;
  const cell = Math.floor(at / 37);
  for (let i = cell - 1; i <= cell + 1; i++) {
    if (hash(i, seed + 277) > breaks * .9) continue;
    const middle = i * 37 + 5 + hash(i, seed + 283) * 27;
    const halfGap = (1.1 + hash(i, seed + 293) * 3.6) * breaks;
    contact = Math.min(contact, clamp((Math.abs(at - middle) - halfGap) / 2.1));
  }
  const tooth = noise(at * 1.6, seed + 401);
  const deposit = clamp((tooth - grain * .22) / Math.max(.2, 1 - grain * .22));
  const taper = .2 + .8 * clamp(Math.min(at, total - at) / (settings.taperLength ?? 3));
  return {pressure, contact, deposit, taper};
}

export function pencilStroke(ctx, points, color, width, seed, amplitude,
  passes = 2, closed = false, settings = {}) {
  if (points.length < 2) return;
  const scale = Math.max(.4, settings.scale ?? 1);
  const line = points.slice();
  if (closed && Math.hypot(line[0][0] - line.at(-1)[0], line[0][1] - line.at(-1)[1]) > .01) line.push(line[0]);
  const segments = [];
  let total = 0;
  for (let i = 1; i < line.length; i++) {
    const a = line[i - 1], b = line[i], length = Math.hypot(b[0] - a[0], b[1] - a[1]) / scale;
    if (length < .0001) continue;
    segments.push({a, b, start:total, length});
    total += length;
  }
  if (!total) return;
  const step = settings.step ?? (settings.detail === 'fill' ? 2.1 : 1.05);
  const samples = [];
  let segmentIndex = 0;
  for (let at = 0; ; at = Math.min(total, at + step)) {
    while (segmentIndex < segments.length - 1 && at > segments[segmentIndex].start + segments[segmentIndex].length) segmentIndex++;
    const s = segments[segmentIndex], t = clamp((at - s.start) / s.length);
    const nx = -(s.b[1] - s.a[1]) / (s.length * scale), ny = (s.b[0] - s.a[0]) / (s.length * scale);
    const offset = (noise(at / 8, seed + 503) - .5) * amplitude * Math.sqrt(scale);
    samples.push({at, x:s.a[0] + (s.b[0] - s.a[0]) * t + nx * offset,
      y:s.a[1] + (s.b[1] - s.a[1]) * t + ny * offset, nx, ny,
      ...strokeProfile(at, total, seed, settings)});
    if (at === total) break;
  }
  const inheritedAlpha = ctx.globalAlpha;
  const material = .65 + hash(0, seed + 619) * .65;
  const viewport = settings.viewport;
  ctx.save();ctx.strokeStyle = color;ctx.lineCap = 'round';
  for (let pass = 0; pass < passes; pass++) {
    for (let i = 1; i < samples.length; i++) {
      const a = samples[i - 1], b = samples[i];
      if (viewport && ((a.x < -8 && b.x < -8) || (a.x > viewport[0] + 8 && b.x > viewport[0] + 8)
        || (a.y < (settings.viewportTop ?? 36) && b.y < (settings.viewportTop ?? 36)) || (a.y > viewport[1] + 8 && b.y > viewport[1] + 8))) continue;
      const contact = Math.min(a.contact, b.contact);
      if (!contact || (pass > 0 && noise(a.at / 11, seed + pass * 127) < .48)) continue;
      const pressure = (a.pressure + b.pressure) / 2;
      const deposit = .12 + .88 * (a.deposit + b.deposit) / 2;
      const opacity = Math.pow(pressure, 1.4) * contact * deposit * material * a.taper;
      if (opacity < .012) continue;
      const nib = width * (.3 + pressure * 1.65) * Math.pow(scale, .32);
      const drift = pass ? (noise(a.at / 6, seed + pass * 107) - .5) * width * 1.1 : 0;
      ctx.globalAlpha = Math.min(1, inheritedAlpha * opacity * (pass ? .56 : 1.2) * (settings.gain ?? 1));
      ctx.lineWidth = Math.max(.18, nib * (pass ? .4 : 1));
      const baseAlpha=ctx.globalAlpha;
      const grain=settings.grain ?? .7;
      ctx.globalAlpha=baseAlpha*(1-grain*.78);
      ctx.beginPath();ctx.moveTo(a.x + a.nx * drift, a.y + a.ny * drift);
      ctx.lineTo(b.x + b.nx * drift, b.y + b.ny * drift);ctx.stroke();
      if(grain>.05){
        for(let filament=0;filament<3;filament++){
          const tooth=noise(a.at*2.7,seed+filament*191+pass*317);
          if(tooth<.28)continue;
          const offset=drift+(filament-1)*nib*.3;
          ctx.globalAlpha=baseAlpha*grain*tooth;
          ctx.lineWidth=Math.max(.15,nib*(.12+tooth*.17));
          ctx.beginPath();ctx.moveTo(a.x+a.nx*offset,a.y+a.ny*offset);
          ctx.lineTo(b.x+b.nx*offset,b.y+b.ny*offset);ctx.stroke();
        }
      }
      // Sparse off-centre graphite grains roughen the edge without filling pen lifts.
      if (pass === 0 && settings.detail !== 'fill' && a.deposit > .52 && (settings.grain ?? .7) > .05) {
        const toothOffset = (noise(a.at * 2, seed + 727) - .5) * nib * 1.9;
        ctx.lineWidth = .18 + pressure * .24;
        ctx.globalAlpha = baseAlpha*.55;
        ctx.beginPath();ctx.moveTo(a.x + a.nx * toothOffset, a.y + a.ny * toothOffset);
        ctx.lineTo(b.x + b.nx * toothOffset, b.y + b.ny * toothOffset);ctx.stroke();
      }
    }
  }
  ctx.restore();
}
