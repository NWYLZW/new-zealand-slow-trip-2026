import { forwardRef, useImperativeHandle, useLayoutEffect, useRef } from 'react';
import { calendarPaper } from './paper';
import { pencilStroke } from './stroke';
import { drawPencilWash } from './wash';
import { observeCanvasRecovery } from './canvasRecovery';
import './PencilSurface.css';

const styles = {
  paper: { radius: 8, ink: '#627769', width: 1.2, passes: 3 },
  sheet: { ink: '#536d59', width: 1.35, passes: 3 },
  full: {},
  action: { radius: 7, ink: '#355c46', width: 1.35, passes: 3,
    wash: '#739873', strength: .48 },
  quiet: { radius: 7, ink: '#99aa9b', width: .75, passes: 2,
    wash: '#8eaa8a', strength: .18 },
  badge: { radius: 6, ink: '#82917a', width: .9, passes: 2,
    wash: '#a1a878', strength: .25 },
};

function outline(width, height, radius, seed) {
  const left = 2.5, top = 2.5, right = width - 2.5, bottom = height - 2.5;
  const points = [];
  for (let corner = 0; corner < 4; corner++) {
    const variation = ((seed >>> (corner * 4)) & 7) * .12;
    const r = Math.min(radius + variation, (right - left) / 2, (bottom - top) / 2);
    const cx = corner < 2 ? right - r : left + r;
    const cy = corner === 0 || corner === 3 ? top + r : bottom - r;
    for (let step = 0; step <= 6; step++) {
      const angle = (corner - 1 + step / 6) * Math.PI / 2;
      points.push([cx + Math.cos(angle) * r, cy + Math.sin(angle) * r]);
    }
  }
  return points;
}

function sheetEdge(height, seed) {
  const points = [];
  for (let y = 0; ; y = Math.min(height, y + 6)) {
    points.push([2.8 + Math.sin(y / 31 + seed) * .5 + Math.sin(y / 8 + seed * .17) * .25, y]);
    if (y === height) break;
  }
  return points;
}

function drawSurface(canvas, width, height, variant, seed, ratio, theme, borderCanvas) {
  canvas.width = Math.ceil(width * ratio);
  canvas.height = Math.ceil(height * ratio);
  const ctx = canvas.getContext('2d');
  ctx.setTransform(canvas.width / width, 0, 0, canvas.height / height, 0, 0);
  const style = styles[variant];
  if (variant === 'full') {
    if (borderCanvas) { borderCanvas.width = canvas.width; borderCanvas.height = canvas.height; }
    ctx.fillStyle = ctx.createPattern(calendarPaper(theme.paper, { dark: theme.dark }).canvas, 'repeat');
    ctx.fillRect(0, 0, width, height);
    return;
  }
  const points = variant === 'sheet' ? sheetEdge(height, seed) : outline(width, height, style.radius, seed);

  ctx.save();
  ctx.beginPath();
  ctx.moveTo(...points[0]);
  for (const point of points.slice(1)) ctx.lineTo(...point);
  if (variant === 'sheet') {
    ctx.lineTo(width, height);
    ctx.lineTo(width, 0);
  }
  ctx.closePath();
  ctx.clip();
  ctx.fillStyle = ctx.createPattern(calendarPaper(theme.paper, { dark: theme.dark }).canvas, 'repeat');
  ctx.fillRect(0, 0, width, height);
  if (style.wash) {
    drawPencilWash(ctx, { x: 0, y: 0, width, height }, theme.wash ?? style.wash, seed,
      { strength: style.strength, spacing: variant === 'action' ? 1.8 : 2.2,
        roughness: 3, inset: 2, radius: style.radius });
  }
  ctx.restore();

  let borderContext = ctx;
  if (borderCanvas) {
    borderCanvas.width = canvas.width;
    borderCanvas.height = canvas.height;
    borderContext = borderCanvas.getContext('2d');
    borderContext.setTransform(canvas.width / width, 0, 0, canvas.height / height, 0, 0);
  }
  pencilStroke(borderContext, points, theme.ink ?? style.ink, style.width, seed, .6, style.passes, variant !== 'sheet',
    { variation: .82, breaks: variant === 'paper' ? .2 : .25,
      grain: .7, gain: variant === 'action' ? 2.5 : 2.1, step: .8 });
  return variant === 'sheet' ? [...points, [width, height], [width, 0]] : points;
}

export const PencilSurface = forwardRef(function PencilSurface({
  as: Element = 'div', variant = 'paper', seed = 23, className = '', clipContent = false, children, ...props
}, forwardedRef) {
  const rootRef = useRef(null);
  const canvasRef = useRef(null);
  const borderRef = useRef(null);
  useImperativeHandle(forwardedRef, () => rootRef.current);

  useLayoutEffect(() => {
    const root = rootRef.current;
    const canvas = canvasRef.current;
    let frame = 0;
    let lastPaint = '';
    const paint = () => {
      frame = 0;
      const width = root.clientWidth, height = root.clientHeight;
      if (width < 6 || height < 6) return;
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      const css = getComputedStyle(root);
      const dark = document.documentElement.dataset.adventureAppearance === 'dark';
      const paper = css.getPropertyValue('--trip-paper-color').trim() || '#faf9f3';
      const muted = css.getPropertyValue('--trip-ink-muted').trim() || '#627769';
      const ink = css.getPropertyValue('--trip-ink-color').trim() || '#344e40';
      const washToken = { action: '--trip-surface-action-wash', quiet: '--trip-surface-quiet-wash',
        badge: '--trip-surface-badge-wash' }[variant];
      const wash = washToken ? css.getPropertyValue(washToken).trim() : '';
      const actionInk = css.getPropertyValue('--trip-surface-action-ink').trim() || ink;
      const theme = { paper, dark, ink: variant === 'action' ? actionInk : dark ? muted : undefined, wash: wash || undefined };
      const paintKey = `${width}:${height}:${ratio}:${dark}:${paper}:${theme.ink}:${theme.wash}`;
      if (paintKey === lastPaint) return;
      lastPaint = paintKey;
      const points = drawSurface(canvas, width, height, styles[variant] ? variant : 'paper', seed, ratio, theme, borderRef.current);
      if (clipContent && points) {
        root.style.setProperty('--trip-surface-clip', `polygon(${points.map(([x, y]) => `${x / width * 100}% ${y / height * 100}%`).join(',')})`);
      } else root.style.removeProperty('--trip-surface-clip');
    };
    const schedule = () => { if (!frame) frame = requestAnimationFrame(paint); };
    const observer = new ResizeObserver(schedule);
    observer.observe(root);
    const appearance = new MutationObserver(schedule);
    appearance.observe(document.documentElement, { attributes: true,
      attributeFilter: ['data-adventure-appearance', 'data-adventure-theme'] });
    const stopRecovery = observeCanvasRecovery(() => { lastPaint = ''; schedule(); });
    paint();
    return () => { stopRecovery(); observer.disconnect(); appearance.disconnect(); cancelAnimationFrame(frame); };
  }, [variant, seed, clipContent]);

  const nativeProps = Element === 'button' ? { type: 'button', ...props } : props;
  return <Element {...nativeProps} ref={rootRef}
    className={`trip-pencil-surface trip-pencil-surface--${variant}${clipContent ? ' trip-pencil-surface--clipped' : ''} ${className}`.trim()}>
    <canvas ref={canvasRef} className="trip-pencil-surface-ink" aria-hidden="true" />
    {clipContent ? <>
      <div className="trip-pencil-surface-content">{children}</div>
      <canvas ref={borderRef} className="trip-pencil-surface-border-ink" aria-hidden="true" />
    </> : children}
  </Element>;
});
