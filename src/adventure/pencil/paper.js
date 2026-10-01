import { grain, random } from './brush';
import { registerCanvasCache } from './canvasRecovery';

const size = 384;
const cache = new Map();
registerCanvasCache(cache);

export function calendarPaper(color = '#faf9f3', { dark = false } = {}) {
  const key = `${color}:${dark}`;
  if (cache.has(key)) return cache.get(key);
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, size, size);
  if (dark) {
    // Dark paper has quiet warm tooth. White grain reads as snow on near-black paper.
    grain(ctx, size, size, '#3b392f', 4331, .42);
    grain(ctx, size, size, '#0a0a08', 7013, .3);
  } else {
    grain(ctx, size, size, '#808278', 4331, .85);
    grain(ctx, size, size, '#ffffff', 7013, 1.7);
  }

  const rng = random(8119);
  ctx.lineCap = 'round';
  // Short, softly embossed fibres wrap across the tile without a visible seam.
  for (let index = 0; index < (dark ? 700 : 1100); index++) {
    const x = rng() * size, y = rng() * size;
    const length = 2 + rng() * 12;
    const angle = rng() * Math.PI;
    const dx = Math.cos(angle) * length, dy = Math.sin(angle) * length * .45;
    const bend = (rng() - .5) * 2;
    const alpha = dark ? .025 + rng() * .025 : .025 + rng() * .055;
    ctx.lineWidth = .35 + rng() * .45;
    for (const ox of [-size, 0, size]) for (const oy of [-size, 0, size]) {
      if (x + ox + length < 0 || x + ox - length > size
        || y + oy + length < 0 || y + oy - length > size) continue;
      ctx.strokeStyle = dark ? '#0d0d0b' : '#82877b';
      ctx.globalAlpha = alpha;
      ctx.beginPath();
      ctx.moveTo(x + ox, y + oy);
      ctx.quadraticCurveTo(x + ox + dx / 2, y + oy + dy / 2 + bend, x + ox + dx, y + oy + dy);
      ctx.stroke();
      ctx.strokeStyle = dark ? '#494737' : '#ffffff';
      ctx.globalAlpha = dark ? alpha * 1.2 : alpha * 2.5;
      ctx.beginPath();
      ctx.moveTo(x + ox, y + oy + .7);
      ctx.quadraticCurveTo(x + ox + dx / 2, y + oy + dy / 2 + bend + .7, x + ox + dx, y + oy + dy + .7);
      ctx.stroke();
    }
  }
  const result = { color, dark, canvas, url: canvas.toDataURL('image/png') };
  cache.set(key, result);
  if (cache.size > 8) cache.delete(cache.keys().next().value);
  return result;
}
