import { Children, useEffect, useRef } from 'react';
import { pencilStroke } from './stroke';
import './iconAlignment.css';

const geometryCache = new Map();
const imageCache = new Map();

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
export function PencilIcon({ children, className = '', kind = 'ink', active = false, sourceSize = 32 }) {
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
      const ink = getComputedStyle(canvas).color;
      const imageKey = JSON.stringify([geometryKey, kind, active, sourceSize, dpr, ink]);
      const cached = imageCache.get(imageKey);
      canvas.width = canvas.height = Math.round(size * dpr);
      const ctx = canvas.getContext('2d');
      if (cached) {
        ctx.drawImage(cached, 0, 0);
        return;
      }
      ctx.scale(dpr, dpr);
      ctx.translate((size - sourceSize) / 2, (size - sourceSize) / 2);
      let seed = 801;
      for (const [data, pathClass] of JSON.parse(geometryKey)) {
        if (pathClass === 'sketch-wash') {
          ctx.save(); ctx.clip(new Path2D(data));
          const pigment = { tasks: '#af823c', bag: '#69805c', photos: '#527e91', zoom: '#a38e58', reset: '#698376' }[kind] || '#698376';
          ctx.globalAlpha = active ? .85 : .32;
          for (let y = 6; y < 32; y += 1.6) pencilStroke(ctx, [[5,y + 3], [27, y - 3]], pigment, 1.1, seed++, .25, 2, false,
            { variation: .85, breaks: .25, grain: .7, gain: 2.2, step: .35 });
          ctx.restore();
          continue;
        }
        const scuff = ['sketch-scuff', 'sketch-hatch'].includes(pathClass);
        for (const points of cachedPathParts(data)) {
          pencilStroke(ctx, points, ink, scuff ? .55 : 1.65, seed++, .3, scuff ? 1 : 3, false,
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
  }, [geometryKey, kind, active, sourceSize]);
  return <canvas ref={ref} className={`trip-pencil-icon ${className}`.trim()}
    width="80" height="80" data-renderer="pressure-pencil" data-icon={kind} data-active={active} aria-hidden="true" />;
}
