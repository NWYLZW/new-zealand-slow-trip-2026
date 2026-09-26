import { pencilStroke } from './stroke';
import { pencilPalette } from './palette';
import { getAgendaIconDefinition } from '../adventureAgendaIcons';

const size = 28;
const displayScale = 1.5;
const paper = pencilPalette.paper;
const geometryCache = new Map();
const spriteCache = new Map();
const markerStyles = {
  primary: { color: pencilPalette.accent, radius: 7.3 },
  town: { color: pencilPalette.cropInk, radius: 6 },
  nature: { color: pencilPalette.forestInk, radius: 6 },
  transport: { color: pencilPalette.water, radius: 6 },
  activity: { color: pencilPalette.mountain, radius: 6 },
};

function ring(radius, seed) {
  const phase = seed * .71;
  return Array.from({ length: 73 }, (_, index) => {
    const angle = index / 72 * Math.PI * 2;
    const r = radius + Math.sin(angle * 3 + phase) * .32 + Math.sin(angle * 5 - phase) * .16;
    return [size / 2 + Math.cos(angle) * r, size / 2 + Math.sin(angle) * r * .95];
  });
}

function sampledPath(data) {
  if (geometryCache.has(data)) return geometryCache.get(data);
  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  path.setAttribute('d', data);
  const length = path.getTotalLength();
  const count = Math.max(2, Math.ceil(length / .4));
  const points = Array.from({ length: count + 1 }, (_, index) => {
    const point = path.getPointAtLength(length * index / count);
    return [point.x, point.y];
  });
  const parts = [[]];
  for (const point of points) {
    const previous = parts.at(-1).at(-1);
    if (previous && Math.hypot(point[0] - previous[0], point[1] - previous[1]) > .5) parts.push([]);
    parts.at(-1).push(point);
  }
  geometryCache.set(data, parts);
  return parts;
}

function paintIcon(ctx, iconType, seed) {
  if (!iconType) return;
  const definition = getAgendaIconDefinition(iconType);
  const scale = definition.sourceSize === 32 ? .32 : .4;
  const offset = (size - definition.sourceSize * scale) / 2;
  definition.paths.forEach((path, index) => {
    sampledPath(path.d).forEach((part, partIndex) => {
      const points = part.map(([x, y]) => [offset + x * scale, offset + y * scale]);
      const scuff = path.className === 'sketch-scuff';
      pencilStroke(ctx, points, pencilPalette.ink, scuff ? .48 : .7,
        seed + 211 + index * 17 + partIndex * 7, .14, scuff ? 1 : 2, false,
        { variation: .72, breaks: .12, grain: .58, gain: scuff ? 1.5 : 2.7, step: .28, taperLength: .4 });
    });
  });
}

function markerSprite(seed, selected, type, iconType) {
  const style = markerStyles[type] ?? markerStyles.town;
  const dpr = Math.min(devicePixelRatio || 1, 3) * displayScale;
  const cacheKey = JSON.stringify([type, style.color, style.radius, seed, selected, iconType ?? '', dpr]);
  if (spriteCache.has(cacheKey)) return { sprite: spriteCache.get(cacheKey), cacheKey, style };
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = Math.round(size * dpr);
  const ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);
  const outline = ring(style.radius, seed);
  ctx.beginPath();
  outline.forEach(([x, y], index) => index ? ctx.lineTo(x, y) : ctx.moveTo(x, y));
  ctx.closePath();
  ctx.fillStyle = paper;
  ctx.fill();
  const settings = { variation: .8, breaks: .18, grain: .66, gain: 2.7, step: .35, taperLength: .7 };
  // Individual pencil passes leave paper visible between the pigment grains.
  const fillRadius = style.radius - 1.35;
  for (let row = -fillRadius; row <= fillRadius; row += 1.18) {
    const half = Math.sqrt(Math.max(0, fillRadius ** 2 - row ** 2));
    pencilStroke(ctx, [[14 - half, 14 + row + .5], [14 + half, 14 + row - .5]], style.color,
      .94, seed + row * 13, .18, 2, false, { ...settings, gain: 2.2, breaks: .24 });
  }
  pencilStroke(ctx, outline, style.color, 1.2, seed, .2, 3, true, settings);
  paintIcon(ctx, iconType, seed);
  if (selected) {
    const ringRadius = type === 'primary' ? 10.8 : 9.6;
    pencilStroke(ctx, ring(ringRadius, seed + 29), paper, 2.5, seed + 29, .25, 2, true,
      { ...settings, breaks: .08, grain: .3 });
    pencilStroke(ctx, ring(ringRadius, seed + 29), style.color, 1.15, seed + 29, .25, 3, true,
      { ...settings, breaks: .3 });
  }
  spriteCache.set(cacheKey, canvas);
  if (spriteCache.size > 256) spriteCache.delete(spriteCache.keys().next().value);
  return { sprite: canvas, cacheKey, style };
}

function markerCanvas(seed, selected, type, iconType) {
  const { sprite, cacheKey, style } = markerSprite(seed, selected, type, iconType);
  const canvas = document.createElement('canvas');
  canvas.width = sprite.width;
  canvas.height = sprite.height;
  canvas.className = `trip-stop-marker trip-stop-marker--${selected ? 'selected' : 'normal'}`;
  canvas.dataset.renderer = 'pressure-pencil';
  canvas.dataset.cacheKey = cacheKey;
  canvas.dataset.markerColor = style.color;
  canvas.dataset.markerRadius = String(style.radius);
  canvas.getContext('2d').drawImage(sprite, 0, 0);
  return canvas;
}

export function createStopMarker(seed, { type = 'primary', iconType = null } = {}) {
  const element = document.createElement('span');
  element.className = 'trip-stop-dot';
  element.dataset.markerType = type;
  if (iconType) element.dataset.markerIcon = iconType;
  element.setAttribute('aria-hidden', 'true');
  // Both fixed-size sprites are cached in the DOM; selection and pan never repaint them.
  element.append(markerCanvas(seed, false, type, iconType), markerCanvas(seed, true, type, iconType));
  return element;
}
