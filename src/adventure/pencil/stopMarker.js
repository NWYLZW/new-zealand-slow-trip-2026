import { pencilStroke } from './stroke';

const size = 28;
const ink = '#8a493d';
const paper = '#fdfcf8';

function ring(radius, seed) {
  const phase = seed * .71;
  return Array.from({ length: 73 }, (_, index) => {
    const angle = index / 72 * Math.PI * 2;
    const r = radius + Math.sin(angle * 3 + phase) * .32 + Math.sin(angle * 5 - phase) * .16;
    return [size / 2 + Math.cos(angle) * r, size / 2 + Math.sin(angle) * r * .95];
  });
}

function markerCanvas(seed, selected) {
  const canvas = document.createElement('canvas');
  const dpr = Math.min(devicePixelRatio || 1, 3);
  canvas.width = canvas.height = Math.round(size * dpr);
  canvas.className = `trip-stop-marker trip-stop-marker--${selected ? 'selected' : 'normal'}`;
  canvas.dataset.renderer = 'pressure-pencil';
  const ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);
  const outline = ring(6.2, seed);
  ctx.beginPath();
  outline.forEach(([x, y], index) => index ? ctx.lineTo(x, y) : ctx.moveTo(x, y));
  ctx.closePath();
  ctx.fillStyle = paper;
  ctx.fill();
  const settings = { variation: .8, breaks: .18, grain: .66, gain: 2.7, step: .35, taperLength: .7 };
  // Individual pencil passes leave paper visible between the pigment grains.
  for (let row = -3; row <= 3; row++) {
    const y = row * 1.22, half = Math.sqrt(Math.max(0, 4.6 ** 2 - y ** 2));
    pencilStroke(ctx, [[14 - half, 14 + y + .5], [14 + half, 14 + y - .5]], ink,
      .94, seed + row * 13, .18, 2, false, { ...settings, gain: 2.2, breaks: .24 });
  }
  pencilStroke(ctx, outline, ink, 1.2, seed, .2, 3, true, settings);
  if (selected) {
    pencilStroke(ctx, ring(10.7, seed + 29), paper, 2.5, seed + 29, .25, 2, true,
      { ...settings, breaks: .08, grain: .3 });
    pencilStroke(ctx, ring(10.7, seed + 29), ink, 1.15, seed + 29, .25, 3, true,
      { ...settings, breaks: .3 });
  }
  return canvas;
}

export function createStopMarker(seed) {
  const element = document.createElement('span');
  element.className = 'trip-stop-dot';
  element.setAttribute('aria-hidden', 'true');
  // Both fixed-size sprites are cached in the DOM; selection and pan never repaint them.
  element.append(markerCanvas(seed, false), markerCanvas(seed, true));
  return element;
}
