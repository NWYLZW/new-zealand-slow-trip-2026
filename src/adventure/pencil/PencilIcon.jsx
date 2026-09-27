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
  const parts = [];
  let left = 40, top = 40, right = 0, bottom = 0;
  for (const [data] of paths) {
    for (const part of cachedPathParts(data)) {
      const shifted = part.map(([x, y]) => [x + offset, y + offset]);
      parts.push(shifted);
      for (const [x, y] of shifted) {
        left = Math.min(left, x);
        top = Math.min(top, y);
        right = Math.max(right, x);
        bottom = Math.max(bottom, y);
      }
    }
  }
  if (!parts.length) return;
  const glyphWidth = Math.max(1, right - left);
  const glyphHeight = Math.max(1, bottom - top);
  const centerX = (left + right) / 2, centerY = (top + bottom) / 2;
  const seed = stableHash(textureKey);
  const random = seededRandom(seed);
  const canvasMin = 1.5, canvasMax = 38.5;
  const corePadding = 4.75;
  const paddedPoints = [];
  for (const part of parts) {
    const step = Math.max(1, Math.floor(part.length / 24));
    for (let index = 0; index < part.length; index += step) {
      const [x, y] = part[index];
      for (let spoke = 0; spoke < 8; spoke++) {
        const angle = Math.PI * 2 * spoke / 8 + (random() - .5) * .16;
        const desiredRadius = corePadding + random() * .85;
        const cos = Math.cos(angle), sin = Math.sin(angle);
        const horizontalRoom = cos > 0 ? (canvasMax - x) / cos : (canvasMin - x) / cos;
        const verticalRoom = sin > 0 ? (canvasMax - y) / sin : (canvasMin - y) / sin;
        const radius = Math.max(0, Math.min(desiredRadius, horizontalRoom, verticalRoom) - .2);
        paddedPoints.push([x + cos * radius, y + sin * radius]);
      }
    }
  }
  const ordered = paddedPoints.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const cross = (origin, a, b) => (a[0] - origin[0]) * (b[1] - origin[1])
    - (a[1] - origin[1]) * (b[0] - origin[0]);
  const lower = [], upper = [];
  for (const point of ordered) {
    while (lower.length > 1 && cross(lower.at(-2), lower.at(-1), point) <= 0) lower.pop();
    lower.push(point);
  }
  for (let index = ordered.length - 1; index >= 0; index--) {
    const point = ordered[index];
    while (upper.length > 1 && cross(upper.at(-2), upper.at(-1), point) <= 0) upper.pop();
    upper.push(point);
  }
  const hull = lower.slice(0, -1).concat(upper.slice(0, -1));
  const drawBlob = (points, alpha) => {
    context.globalAlpha = alpha;
    context.beginPath();
    context.moveTo(...points[0]);
    for (const point of points.slice(1)) context.lineTo(...point);
    context.closePath();
    context.fill();
  };
  const area = hull.reduce((total, [x, y], index) => {
    const next = hull[(index + 1) % hull.length];
    return total + x * next[1] - next[0] * y;
  }, 0);
  const orientation = area >= 0 ? 1 : -1;
  const ruffledHull = [];
  for (let index = 0; index < hull.length; index++) {
    const start = hull[index], end = hull[(index + 1) % hull.length];
    const dx = end[0] - start[0], dy = end[1] - start[1];
    const length = Math.max(.001, Math.hypot(dx, dy));
    const outward = [orientation * dy / length, -orientation * dx / length];
    const tangent = [dx / length, dy / length];
    ruffledHull.push(start);
    const divisions = 2 + Math.floor(random() * 3);
    for (let division = 1; division < divisions; division++) {
      const progress = division / divisions;
      const notch = (index + division + seed) % 5 === 0;
      const lift = notch ? .08 + random() * .18 : .35 + random() * 1.35;
      const drift = (random() - .5) * .65;
      ruffledHull.push([
        Math.max(canvasMin, Math.min(canvasMax,
          start[0] + dx * progress + outward[0] * lift + tangent[0] * drift)),
        Math.max(canvasMin, Math.min(canvasMax,
          start[1] + dy * progress + outward[1] * lift + tangent[1] * drift)),
      ]);
    }
  }
  context.save();
  context.fillStyle = color;
  const featherPatchCount = 3 + seed % 3;
  for (let patch = 0; patch < featherPatchCount; patch++) {
    const startIndex = Math.floor(random() * hull.length);
    const span = Math.min(hull.length - 1, 2 + Math.floor(random() * 4));
    const inner = Array.from({ length: span + 1 }, (_, offsetIndex) =>
      hull[(startIndex + offsetIndex) % hull.length]);
    const outer = inner.map(([x, y]) => {
      const angle = Math.atan2(y - centerY, x - centerX);
      const distance = .55 + random() * 1.35;
      return [Math.max(canvasMin, Math.min(canvasMax, x + Math.cos(angle) * distance)),
        Math.max(canvasMin, Math.min(canvasMax, y + Math.sin(angle) * distance))];
    }).reverse();
    drawBlob(inner.concat(outer), .08 + random() * .13);
  }
  drawBlob(hull, .97);
  drawBlob(ruffledHull, .97);

  const maxEdgeWidth = .52;
  const maxNib = maxEdgeWidth * 1.95;
  const strokeSafety = Math.ceil((.07 + maxNib * .95 + .21 + .35) * 4) / 4;
  const strokeMin = canvasMin + strokeSafety, strokeMax = canvasMax - strokeSafety;
  const rayRoom = ([x, y], angle) => {
    const cos = Math.cos(angle), sin = Math.sin(angle);
    const horizontalRoom = cos > 0 ? (strokeMax - x) / cos : (strokeMin - x) / cos;
    const verticalRoom = sin > 0 ? (strokeMax - y) / sin : (strokeMin - y) / sin;
    return Math.min(horizontalRoom, verticalRoom);
  };
  const candidates = hull.map((anchor, anchorIndex) => {
    const outward = Math.atan2(anchor[1] - centerY, anchor[0] - centerX);
    const inset = [anchor[0] - Math.cos(outward) * .9, anchor[1] - Math.sin(outward) * .9];
    return { anchorIndex, outward, room: rayRoom(inset, outward) };
  }).filter(candidate => candidate.room > .85)
    .sort((a, b) => b.room - a.room);
  const clusterCount = Math.min(3, candidates.length);
  const clusters = [];
  while (clusters.length < clusterCount && candidates.length) {
    const poolSize = Math.max(1, Math.ceil(candidates.length * .55));
    const [candidate] = candidates.splice(Math.floor(random() * poolSize), 1);
    clusters.push({ ...candidate, angle: candidate.outward + (random() - .5) * 1.5 });
  }
  for (let clusterIndex = 0; clusterIndex < clusters.length; clusterIndex++) {
    const cluster = clusters[clusterIndex];
    const targetCount = 3 + Math.floor(random() * 3);
    let painted = 0;
    for (let attempt = 0; attempt < targetCount * 7 && painted < targetCount; attempt++) {
      const pointOffset = Math.round((random() - .5) * Math.max(2, hull.length * .1));
      const anchor = hull[(cluster.anchorIndex + pointOffset + hull.length) % hull.length];
      const outward = Math.atan2(anchor[1] - centerY, anchor[0] - centerX);
      const angle = cluster.angle + (random() - .5) * (attempt % 3 === 0 ? 1.35 : .55);
      const start = [anchor[0] - Math.cos(outward) * (.45 + random() * .5),
        anchor[1] - Math.sin(outward) * (.45 + random() * .5)];
      const available = rayRoom(start, angle) - .15;
      const length = Math.min(.9 + random() * 2.3, available);
      if (length < .7) continue;
      const end = [start[0] + Math.cos(angle) * length, start[1] + Math.sin(angle) * length];
      const middle = [(start[0] + end[0]) / 2
        + Math.cos(angle + Math.PI / 2) * (random() - .5) * .9,
        (start[1] + end[1]) / 2 + Math.sin(angle + Math.PI / 2) * (random() - .5) * .9];
      const stroke = [start, middle, end];
      if (stroke.flat().some(value => value < strokeMin || value > strokeMax)) continue;
      context.globalAlpha = .38 + random() * .32;
      pencilStroke(context, stroke, color, .28 + random() * .24,
        seed + 211 + clusterIndex * 313 + attempt * 41, .12, 1 + (attempt + seed) % 2, false,
        { variation: .88, breaks: .12, grain: .7, gain: 2, step: .3, taperLength: .6 });
      painted++;
    }
  }

  const particleCount = 20 + seed % 17;
  for (let index = 0; index < particleCount; index++) {
    const anchorIndex = clusters.length ? clusters[index % clusters.length].anchorIndex
      : Math.floor(random() * hull.length);
    const anchor = hull[(anchorIndex + Math.round((random() - .5) * hull.length * .16)
      + hull.length) % hull.length];
    const outward = Math.atan2(anchor[1] - centerY, anchor[0] - centerX);
    const angle = outward + (random() - .5) * 1.8;
    const distance = .4 + random() * 3.8;
    const radius = .14 + random() * .34;
    const x = anchor[0] + Math.cos(angle) * distance;
    const y = anchor[1] + Math.sin(angle) * distance;
    if (x - radius < canvasMin || x + radius > canvasMax
      || y - radius < canvasMin || y + radius > canvasMax) continue;
    const fade = 1 - Math.min(1, distance / 3.8);
    context.globalAlpha = .05 + fade * .22;
    context.beginPath();
    context.arc(x, y, radius, 0, Math.PI * 2);
    context.fill();
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
