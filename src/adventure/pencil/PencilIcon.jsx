import { Children, useEffect, useRef } from 'react';
import { pencilStroke } from './stroke';
import './iconAlignment.css';

const geometryCache = new Map();
const imageCache = new Map();

function stableHash(value) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index++) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function seededRandom(seed) {
  let state = seed || 1;
  return () => {
    state += 0x6d2b79f5;
    let value = state;
    value = Math.imul(value ^ value >>> 15, value | 1);
    value ^= value + Math.imul(value ^ value >>> 7, value | 61);
    return ((value ^ value >>> 14) >>> 0) / 4294967296;
  };
}

function paintThemeBackdrop(context, color, paths, sourceSize, textureKey) {
  const offset = (40 - sourceSize) / 2;
  let left = 40, top = 40, right = 0, bottom = 0;
  for (const [data] of paths) {
    for (const part of cachedPathParts(data)) {
      for (const [x, y] of part) {
        left = Math.min(left, x + offset);
        top = Math.min(top, y + offset);
        right = Math.max(right, x + offset);
        bottom = Math.max(bottom, y + offset);
      }
    }
  }
  const strokePad = 2;
  left -= strokePad;
  top -= strokePad;
  right += strokePad;
  bottom += strokePad;
  const glyphWidth = Math.max(1, right - left);
  const glyphHeight = Math.max(1, bottom - top);
  const outerWidth = glyphWidth * 1.25;
  const outerHeight = glyphHeight * 1.25;
  const centerX = (left + right) / 2, centerY = (top + bottom) / 2;
  const seed = stableHash(textureKey);
  const random = seededRandom(seed);
  const canvasMin = 1.5, canvasMax = 38.5;
  let outerLeft = centerX - outerWidth / 2;
  let outerTop = centerY - outerHeight / 2;
  const outerRight = outerLeft + outerWidth;
  const outerBottom = outerTop + outerHeight;
  const translateX = outerLeft < canvasMin ? canvasMin - outerLeft
    : outerRight > canvasMax ? canvasMax - outerRight : 0;
  const translateY = outerTop < canvasMin ? canvasMin - outerTop
    : outerBottom > canvasMax ? canvasMax - outerBottom : 0;
  left += translateX;
  right += translateX;
  top += translateY;
  bottom += translateY;
  outerLeft += translateX;
  outerTop += translateY;
  const shiftedOuterRight = outerLeft + outerWidth;
  const shiftedOuterBottom = outerTop + outerHeight;
  const horizontalMargin = (outerWidth - glyphWidth) / 2;
  const verticalMargin = (outerHeight - glyphHeight) / 2;
  const pointCount = 12 + seed % 5;
  const sideCounts = Array.from({ length: 4 }, (_, side) =>
    Math.floor(pointCount / 4) + (side < pointCount % 4 ? 1 : 0));
  const points = [];
  for (let side = 0; side < 4; side++) {
    for (let index = 0; index < sideCounts[side]; index++) {
      const progress = index / sideCounts[side];
      const normalJitter = (random() - .35) * (side % 2 ? horizontalMargin : verticalMargin) * .38;
      const tangentJitter = index === 0 ? 0
        : (random() - .5) * (side % 2 ? outerHeight : outerWidth) / sideCounts[side] * .3;
      if (side === 0) points.push([
        Math.max(canvasMin, Math.min(canvasMax,
          outerLeft + outerWidth * progress + tangentJitter)),
        Math.max(canvasMin, Math.min(top - verticalMargin * .35, outerTop + normalJitter)),
      ]);
      else if (side === 1) points.push([
        Math.min(canvasMax,
          Math.max(right + horizontalMargin * .35, shiftedOuterRight - normalJitter)),
        Math.max(canvasMin, Math.min(canvasMax,
          outerTop + outerHeight * progress + tangentJitter)),
      ]);
      else if (side === 2) points.push([
        Math.max(canvasMin, Math.min(canvasMax,
          shiftedOuterRight - outerWidth * progress - tangentJitter)),
        Math.min(canvasMax,
          Math.max(bottom + verticalMargin * .35, shiftedOuterBottom - normalJitter)),
      ]);
      else points.push([
        Math.max(canvasMin, Math.min(left - horizontalMargin * .35, outerLeft + normalJitter)),
        Math.max(canvasMin, Math.min(canvasMax,
          shiftedOuterBottom - outerHeight * progress - tangentJitter)),
      ]);
    }
  }
  context.save();
  context.fillStyle = color;
  context.globalAlpha = .97;
  context.beginPath();
  context.moveTo(...points[0]);
  for (const point of points.slice(1)) context.lineTo(...point);
  context.closePath();
  context.fill();
  context.globalAlpha = .09;
  for (let index = 0; index < 4; index++) {
    const y = top + glyphHeight * (index + 1) / 5 + (random() - .5) * 1.2;
    pencilStroke(context, [[left + .5, y], [right - .5, y + (random() - .5) * 1.4]],
      color, .75, seed + index * 17, .2, 1, false,
      { variation: .8, breaks: .1, grain: .65, gain: 1.5, step: .4, taperLength: .6 });
  }
  context.globalAlpha = .72;
  const rayCount = 3 + Math.floor(random() * 3);
  let raysPainted = 0;
  for (let attempt = 0; attempt < rayCount * 6 && raysPainted < rayCount; attempt++) {
    const side = Math.floor(random() * 4);
    const progress = .18 + random() * .64;
    const length = 2.4 + random() * 2.2;
    let start, end;
    if (side === 0) {
      start = [outerLeft + outerWidth * progress, outerTop + .4];
      end = [start[0] + (random() - .5) * 1.5, start[1] - length];
    } else if (side === 1) {
      start = [shiftedOuterRight - .4, outerTop + outerHeight * progress];
      end = [start[0] + length, start[1] + (random() - .5) * 1.5];
    } else if (side === 2) {
      start = [outerLeft + outerWidth * progress, shiftedOuterBottom - .4];
      end = [start[0] + (random() - .5) * 1.5, start[1] + length];
    } else {
      start = [outerLeft + .4, outerTop + outerHeight * progress];
      end = [start[0] - length, start[1] + (random() - .5) * 1.5];
    }
    if ([...start, ...end].some(value => value < canvasMin || value > canvasMax)) continue;
    pencilStroke(context, [start, end], color, .55, seed + 211 + raysPainted * 29, .16, 1, false,
      { variation: .75, breaks: .08, grain: .55, gain: 1.25, step: .35, taperLength: .7 });
    raysPainted++;
  }
  context.restore();
}

function cachedPathParts(data) {
  if (geometryCache.has(data)) return geometryCache.get(data);
  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  path.setAttribute('d', data);
  const length = path.getTotalLength(), count = Math.max(1, Math.ceil(length / .25));
  const parts = [[]];
  // Split pen lifts before caching so disconnected strokes never join.
  for (let index = 0; index <= count; index++) {
    const point = path.getPointAtLength(length * index / count), previous = parts.at(-1).at(-1);
    if (previous && Math.hypot(point.x - previous[0], point.y - previous[1]) > .5) parts.push([]);
    parts.at(-1).push([point.x, point.y]);
  }
  geometryCache.set(data, parts);
  if (geometryCache.size > 256) geometryCache.delete(geometryCache.keys().next().value);
  return parts;
}

// Reuse the local icon's geometry, but deposit pigment with the map's pencil.
export function PencilIcon({ children, className = '', kind = 'ink', active = false, sourceSize = 32,
  themeBackdrop = false }) {
  const ref = useRef(null);
  const paths = [];
  Children.forEach(children, child => {
    if (child?.props?.d) paths.push([child.props.d, child.props.className || '']);
  });
  const geometryKey = JSON.stringify(paths);
  useEffect(() => {
    const canvas = ref.current;
    const paint = () => {
      const size = 40, dpr = Math.min(devicePixelRatio || 1, 3);
      const style = getComputedStyle(canvas);
      const ink = style.color;
      const backdropInk = themeBackdrop
        ? style.getPropertyValue('--trip-pencil-icon-backdrop').trim() || '#fff'
        : null;
      const imageKey = JSON.stringify([geometryKey, kind, active, sourceSize, dpr, ink, backdropInk]);
      const cached = imageCache.get(imageKey);
      canvas.width = canvas.height = Math.round(size * dpr);
      const ctx = canvas.getContext('2d');
      if (cached) {
        ctx.drawImage(cached, 0, 0);
        return;
      }
      ctx.scale(dpr, dpr);
      if (backdropInk) paintThemeBackdrop(ctx, backdropInk, JSON.parse(geometryKey), sourceSize,
        `${kind}:${geometryKey}:${sourceSize}`);
      ctx.translate((size - sourceSize) / 2, (size - sourceSize) / 2);
      let seed = 801;
      for (const [data, pathClass] of JSON.parse(geometryKey)) {
        if (pathClass === 'sketch-wash') {
          ctx.save(); ctx.clip(new Path2D(data));
          const pigment = themeBackdrop ? ink
            : { tasks: '#af823c', bag: '#69805c', photos: '#527e91', zoom: '#a38e58', reset: '#698376' }[kind] || '#698376';
          ctx.globalAlpha = active ? .85 : .32;
          for (let y = 6; y < 32; y += 1.6) pencilStroke(ctx, [[5,y + 3], [27, y - 3]], pigment, 1.1, seed++, .25, 2, false,
            { variation: .85, breaks: .25, grain: .7, gain: 2.2, step: .35 });
          ctx.restore();
          continue;
        }
        const scuff = ['sketch-scuff', 'sketch-hatch'].includes(pathClass);
        for (const points of cachedPathParts(data)) {
          const strokeSeed = seed++;
          pencilStroke(ctx, points, ink, scuff ? .55 : 1.65, strokeSeed, .3, scuff ? 1 : 3, false,
            { variation: .82, breaks: .18, grain: .68, gain: scuff ? 1.5 : 3, step: .35, taperLength: .65 });
        }
      }
      if (active) pencilStroke(ctx, [[7, 30], [16, 30.5], [25, 29.8]], ink, 1.1, 977, .25, 3, false,
        { variation: .8, breaks: .25, grain: .7, gain: 2.8, step: .35 });
      const bitmap = document.createElement('canvas');
      bitmap.width = canvas.width;
      bitmap.height = canvas.height;
      bitmap.getContext('2d').drawImage(canvas, 0, 0);
      imageCache.set(imageKey, bitmap);
      if (imageCache.size > 256) imageCache.delete(imageCache.keys().next().value);
    };
    const appearance = new MutationObserver(paint);
    appearance.observe(document.documentElement, { attributes: true,
      attributeFilter: ['data-adventure-appearance', 'data-adventure-theme'] });
    paint();
    return () => appearance.disconnect();
  }, [geometryKey, kind, active, sourceSize, themeBackdrop]);
  return <canvas ref={ref} className={`trip-pencil-icon ${className}`.trim()}
    width="80" height="80" data-renderer="pressure-pencil" data-icon={kind} data-active={active}
    data-theme-backdrop={themeBackdrop || undefined} aria-hidden="true" />;
}
