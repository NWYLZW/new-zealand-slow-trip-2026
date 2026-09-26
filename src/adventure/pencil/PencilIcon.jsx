import { Children, useEffect, useRef } from 'react';
import { pencilStroke } from './stroke';

// Reuse the local icon's geometry, but deposit pigment with the map's pencil.
export function PencilIcon({ children, className = '', kind = 'ink', active = false }) {
  const ref = useRef(null);
  useEffect(() => {
    const canvas = ref.current, size = 40, dpr = Math.min(devicePixelRatio || 1, 3);
    canvas.width = canvas.height = Math.round(size * dpr);
    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);
    ctx.translate(4, 4);
    let seed = 801;
    Children.forEach(children, child => {
      if (!child?.props?.d) return;
      if (child.props.className === 'sketch-wash') {
        ctx.save();ctx.clip(new Path2D(child.props.d));
        const pigment = { tasks: '#af823c', bag: '#69805c', photos: '#527e91', zoom: '#a38e58', reset: '#698376' }[kind] || '#698376';
        ctx.globalAlpha = active ? .85 : .32;
        for (let y = 6; y < 32; y += 1.6) pencilStroke(ctx, [[5,y+3],[27,y-3]], pigment, 1.1, seed++, .25, 2, false,
          { variation: .85, breaks: .25, grain: .7, gain: 2.2, step: .35 });
        ctx.restore();return;
      }
      const scuff = ['sketch-scuff','sketch-hatch'].includes(child.props.className);
      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('d', child.props.d);
      const length = path.getTotalLength(), count = Math.max(1, Math.ceil(length / .25));
      const parts = [[]];
      // Native path measurement resolves relative moves. Split discontinuities
      // so separate pen strokes never acquire an artificial connecting line.
      for (let index = 0; index <= count; index++) {
        const point = path.getPointAtLength(length * index / count), previous = parts.at(-1).at(-1);
        if (previous && Math.hypot(point.x-previous[0],point.y-previous[1]) > .5) parts.push([]);
        parts.at(-1).push([point.x, point.y]);
      }
      for (const points of parts) {
        pencilStroke(ctx, points, '#344e40', scuff ? .55 : 1.65, seed++, .3, scuff ? 1 : 3, false,
          { variation: .82, breaks: .18, grain: .68, gain: scuff ? 1.5 : 3, step: .35, taperLength: .65 });
      }
    });
    if(active) pencilStroke(ctx, [[7,30],[16,30.5],[25,29.8]], '#344e40', 1.1, 977, .25, 3, false,
      { variation: .8, breaks: .25, grain: .7, gain: 2.8, step: .35 });
  }, [children, kind, active]);
  return <canvas ref={ref} className={`trip-pencil-icon ${className}`.trim()}
    width="80" height="80" data-renderer="pressure-pencil" data-icon={kind} data-active={active} aria-hidden="true" />;
}
