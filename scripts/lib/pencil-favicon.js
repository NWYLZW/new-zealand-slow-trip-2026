import coast from '../../src/adventure/data/coastline.json';
import { pencilStroke } from '../../src/adventure/pencil/stroke';

export function drawFavicon(size) {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const draft = document.createElement('canvas');
  draft.width = draft.height = Math.max(256, size * 2);
  const ctx = draft.getContext('2d');
  ctx.scale(draft.width / 64, draft.height / 64);
  const rings = coast.features[0].geometry.coordinates.map(polygon => polygon[0]);
  const raw = ([lon, lat]) => [lon * Math.cos(41 * Math.PI / 180), -lat];
  const points = rings.flat().map(raw);
  const minX = Math.min(...points.map(p => p[0])), maxX = Math.max(...points.map(p => p[0]));
  const minY = Math.min(...points.map(p => p[1])), maxY = Math.max(...points.map(p => p[1]));
  const scale = Math.min(48 / (maxX - minX), 54 / (maxY - minY));
  const project = point => {
    const [x, y] = raw(point);
    return [32 + (x - (minX + maxX) / 2) * scale, 32 + (y - (minY + maxY) / 2) * scale];
  };
  const brush = { variation: .72, breaks: .14, grain: .65, gain: 3.4, step: .26, taperLength: .5 };
  const stroke = (line, color, width, seed, closed = false) =>
    pencilStroke(ctx, line, color, width, seed, .19, 3, closed, brush);
  for (const [index, ring] of rings.entries()) {
    const line = ring.map(project);
    ctx.beginPath(); line.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.closePath();
    ctx.fillStyle = '#bed098'; ctx.fill();
    // A thin paper edge separates the pencil from both light and dark tab bars.
    ctx.strokeStyle = '#fdfcf8'; ctx.lineWidth = size <= 32 ? 3.3 : 2.3; ctx.lineJoin = 'round'; ctx.stroke();
    ctx.save(); ctx.clip();
    for (let y = 6; y < 63; y += 1.65) {
      stroke([[1, y + 6], [32, y - 1], [63, y - 8]], y % 5 < 2 ? '#c2a65c' : '#4e7550', .7, 211 + index * 97 + Math.round(y * 31));
    }
    ctx.restore();
    stroke(line, '#2c503f', size <= 32 ? 1.5 : 1.1, 907 + index * 97, true);
  }
  const route = [[168.66, -45.03], [169.13, -44.70], [170.48, -44.00], [172.64, -43.53]].map(project);
  stroke(route, '#fdfcf8', 2.7, 317);
  stroke(route, '#a84e38', 1.55, 318);
  const [x, y] = route[0], radius = size <= 32 ? 1.6 : 1.35;
  const ring = Array.from({ length: 33 }, (_, i) => {
    const angle = i * Math.PI / 16, r = radius + Math.sin(angle * 3) * .1;
    return [x + Math.cos(angle) * r, y + Math.sin(angle) * r];
  });
  ctx.beginPath(); ctx.arc(x, y, radius, 0, Math.PI * 2); ctx.fillStyle = '#fdfcf8'; ctx.fill();
  stroke(ring, '#a84e38', 1, 409, true);
  const output = canvas.getContext('2d');
  output.imageSmoothingQuality = 'high'; output.drawImage(draft, 0, 0, size, size);
  return canvas;
}
