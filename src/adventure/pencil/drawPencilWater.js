import { waterFeatures } from './waterFeatures';
import { stroke, hatch } from './brush';
import { pencilPalette as p } from './palette';

const seedFor = id => [...id].reduce((n, letter) => Math.imul(n ^ letter.charCodeAt(0), 16777619), 2166136261) >>> 0;

export function drawPencilWater(ctx, path, project) {
  for (const feature of waterFeatures) {
    const { kind, id } = feature.properties;
    const { type, coordinates } = feature.geometry;
    const seed = seedFor(id);
    if (type === 'LineString' || type === 'MultiLineString') {
      const lines = type === 'LineString' ? [coordinates] : coordinates;
      lines.forEach((line, index) => stroke(ctx, line.map(project), p.water, .7, seed + index,
        { passes: 1, breaks: .25, amplitude: .25 }));
      continue;
    }
    const polygons = type === 'Polygon' ? [coordinates] : coordinates;
    ctx.save();
    ctx.beginPath(); path(feature); ctx.fillStyle = p.lake; ctx.fill('evenodd');
    ctx.clip('evenodd');
    ctx.globalAlpha = kind === 'lake' ? .32 : .22;
    hatch(ctx, path.bounds(feature), p.water, seed, 3.6, .45);
    ctx.restore();
    polygons.flat().forEach((ring, index) => stroke(ctx, ring.map(project), p.water,
      kind === 'lake' ? .6 : .3, seed + index, { closed: true, passes: 2, breaks: .25, amplitude: .18 }));
  }
}
