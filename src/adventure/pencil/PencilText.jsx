import { Children, createContext, useContext, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { mapLabel } from './mapLabels';
import { textCacheReady } from './textCache';
import { observeCanvasRecovery } from './canvasRecovery';
import { queueTextPaint } from './textPaintQueue';
import './PencilText.css';

const PersistenceContext = createContext('memory');

// A provider is an explicit public assertion for an audited subtree only.
export function PencilTextPersistenceProvider({ children, persistence = 'memory' }) {
  return <PersistenceContext.Provider value={persistence === 'public' ? 'public' : 'memory'}>
    {children}
  </PersistenceContext.Provider>;
}

function textSeed(text) {
  return Array.from(text).reduce((seed, char) => Math.imul(seed ^ char.codePointAt(0), 16777619), 71) >>> 0;
}

function paintText(element, source, canvas, text, persistence) {
  const box = element.getBoundingClientRect();
  if (!box.width || !box.height || text.length > 4096 || !source.firstChild) return false;
  const style = getComputedStyle(element), size = parseFloat(style.fontSize);
  const context = canvas.getContext('2d');
  // Pencil contours extend beyond native glyph advances; keep that ink off the bitmap edge.
  const padding = 5;
  const width = box.width + padding * 2, height = box.height + padding * 2;
  if (width * height * 4 > 2 * 1024 * 1024 || !context || context.isContextLost?.()) return false;
  canvas.width = Math.ceil(width * 2); canvas.height = Math.ceil(height * 2);
  Object.assign(canvas.style, { left: `-${padding}px`, top: `-${padding}px`,
    right: 'auto', bottom: 'auto', width: `${width}px`, height: `${height}px` });
  context.scale(2, 2);
  context.font = `400 ${size}px ${style.fontFamily}`;
  const ascent = context.measureText(text).fontBoundingBoxAscent ?? size;
  const range = document.createRange(), lines = [];
  let offset = 0;
  // Native text owns wrapping and selection; the canvas only supplies pigment.
  for (const char of text) {
    range.setStart(source.firstChild, offset); offset += char.length;
    range.setEnd(source.firstChild, offset);
    const rect = range.getBoundingClientRect();
    let line = lines.at(-1);
    if (!line || Math.abs(line.top - rect.top) > 1) {
      line = { text: '', left: rect.left, top: rect.top }; lines.push(line);
    }
    line.text += char;
  }
  for (const line of lines) {
    const sprite = mapLabel(line.text.trimEnd(), size, textSeed(line.text), style.color, 'transparent',
      { family: style.fontFamily, persistence });
    const ink = sprite.ink;
    if (!ink || ink.getContext('2d')?.isContextLost?.()) return false;
    context.drawImage(ink, padding + line.left - box.left - sprite.padding,
      padding + line.top - box.top + ascent - sprite.ascent - sprite.padding, sprite.width, sprite.height);
  }
  canvas.dataset.lines = String(lines.length);
  element.dataset.pencilReady = 'true';
  return true;
}

export function PencilText({ children, ellipsis = false, persistence }) {
  const inheritedPersistence = useContext(PersistenceContext);
  const cachePolicy = persistence ?? inheritedPersistence;
  const fullText = Children.toArray(children).join('');
  const [text, setText] = useState(fullText);
  const element = useRef(null), source = useRef(null), canvas = useRef(null);
  useLayoutEffect(() => {
    if (!ellipsis) {
      setText(fullText);
      return;
    }
    const node = element.current;
    let disposed = false;
    const fit = () => {
      const width = node.clientWidth - 8;
      if (width <= 0) return;
      const style = getComputedStyle(node);
      const context = canvas.current.getContext('2d');
      if (!context || context.isContextLost?.()) return;
      context.font = `400 ${style.fontSize} ${style.fontFamily}`;
      context.fontKerning = 'none';
      const measure = value => context.measureText(value).width;
      if (measure(fullText) <= width) {
        setText(previous => previous === fullText ? previous : fullText);
        return;
      }
      const characters = Array.from(fullText);
      let low = 0, high = characters.length;
      while (low < high) {
        const middle = Math.ceil((low + high) / 2);
        if (measure(`${characters.slice(0, middle).join('')}…`) <= width) low = middle;
        else high = middle - 1;
      }
      const clipped = `${characters.slice(0, low).join('').trimEnd()}…`;
      setText(previous => previous === clipped ? previous : clipped);
    };
    const resize = new ResizeObserver(fit);
    resize.observe(node);
    document.fonts.ready.then(() => { if (!disposed) fit(); });
    fit();
    return () => { disposed = true; resize.disconnect(); };
  }, [fullText, ellipsis]);
  useEffect(() => {
    const node = element.current;
    delete node.dataset.pencilReady;
    let disposed = false, visible = false, pending = null, dirty = true;
    const schedule = () => {
      if (!visible || !dirty || pending || disposed) return;
      pending = queueTextPaint(() => {
        pending = null;
        if (!disposed && visible && dirty) {
          try {
            paintText(node, source.current, canvas.current, text, cachePolicy);
          } catch {
            // Oversized input or unavailable canvas keeps native accessible text.
            delete node.dataset.pencilReady;
          }
          dirty = false;
        }
      });
    };
    const resize = new ResizeObserver(() => {
      dirty = true; delete node.dataset.pencilReady; schedule();
    });
    const appearance = new MutationObserver(() => {
      dirty = true; delete node.dataset.pencilReady; schedule();
    });
    appearance.observe(document.documentElement, { attributes: true,
      attributeFilter: ['data-adventure-appearance', 'data-adventure-theme'] });
    const intersection = new IntersectionObserver(entries => {
      visible = entries.at(-1).isIntersecting; schedule();
    }, { rootMargin: '80px' });
    const fontChanged = () => {
      dirty = true; delete node.dataset.pencilReady; schedule();
    };
    document.fonts.addEventListener('loading', fontChanged);
    document.fonts.addEventListener('loadingdone', fontChanged);
    document.fonts.addEventListener('loadingerror', fontChanged);
    resize.observe(node); intersection.observe(node);
    Promise.all([document.fonts.ready, cachePolicy === 'public' ? textCacheReady : null]).then(() => {
      if (disposed) return;
      fontChanged();
    });
    const stopRecovery = observeCanvasRecovery(() => {
      pending?.(); pending = null;
      dirty = true; delete node.dataset.pencilReady; schedule();
    });
    return () => {
      disposed = true; stopRecovery(); pending?.(); resize.disconnect(); intersection.disconnect(); appearance.disconnect();
      document.fonts.removeEventListener('loading', fontChanged);
      document.fonts.removeEventListener('loadingdone', fontChanged);
      document.fonts.removeEventListener('loadingerror', fontChanged);
    };
  }, [text, cachePolicy]);
  return <span className={`trip-pencil-text${ellipsis ? ' trip-pencil-text--ellipsis' : ''}`}
    ref={element} title={ellipsis ? fullText : undefined}>
    <span className="trip-pencil-text-source" ref={source}>{text}</span>
    <canvas ref={canvas} aria-hidden="true" data-renderer="pencil-lettering-c" />
  </span>;
}
