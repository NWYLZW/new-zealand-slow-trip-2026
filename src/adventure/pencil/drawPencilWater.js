import { waterFeatures } from './waterFeatures';
import { stroke, hatch, clipPolyline } from './brush';
import { pencilPalette as p } from './palette';

const seedFor = id => [...id].reduce((n, letter) => Math.imul(n ^ letter.charCodeAt(0), 16777619), 2166136261) >>> 0;

export function drawPencilWaterFeature(ctx, path, project, feature, options = {}) {
  const { kind, id } = feature.properties;
  const { type, coordinates } = feature.geometry;
  const seed = seedFor(id);
  if (type === 'LineString' || type === 'MultiLineString') {
    const lines = type === 'LineString' ? [coordinates] : coordinates;
    lines.forEach((line, index) => {
      const projected = line.map(project);
      const chunks = options.viewport ? clipPolyline(projected, options.viewport) : [projected];
      chunks.forEach((chunk, chunkIndex) => stroke(ctx, chunk, p.water, .7, seed + index * 31 + chunkIndex,
        { passes: 1, breaks: .25, amplitude: .25 }));
    });
    return;
  }
  const polygons = type === 'Polygon' ? [coordinates] : coordinates;
  ctx.save();
  ctx.beginPath(); path(feature); ctx.fillStyle = p.lake; ctx.fill('evenodd');
  ctx.clip('evenodd');
  ctx.globalAlpha = kind === 'lake' ? .32 : .22;
  hatch(ctx, path.bounds(feature), p.water, seed, 3.6, .45, options);
  ctx.restore();
  polygons.flat().forEach((ring, index) => {
    const projected = ring.map(project);
    const chunks = options.viewport ? clipPolyline(projected, options.viewport) : [projected];
    chunks.forEach((chunk, chunkIndex) => stroke(ctx, chunk, p.water, kind === 'lake' ? .6 : .3,
      seed + index * 31 + chunkIndex, { closed: !options.viewport, passes: 2, breaks: .25, amplitude: .18 }));
  });
}

export function drawPencilWater(ctx, path, project, options = {}) {
  for (const feature of waterFeatures) {
    if (options.excludeNames?.has(feature.properties.name)) continue;
    drawPencilWaterFeature(ctx, path, project, feature, options);
  }
}
