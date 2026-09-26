import { Children, useEffect, useRef } from 'react';
import { mapLabel } from './mapLabels';

function textSeed(text) {
  return Array.from(text).reduce((seed, char) => Math.imul(seed ^ char.codePointAt(0), 16777619), 71) >>> 0;
}

function paintText(element, source, canvas, text) {
  const box = element.getBoundingClientRect();
  if (!box.width || !box.height) return;
  const style = getComputedStyle(element), size = parseFloat(style.fontSize);
  const context = canvas.getContext('2d');
  canvas.width = Math.ceil(box.width * 2); canvas.height = Math.ceil(box.height * 2);
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
    const sprite = mapLabel(line.text.trimEnd(), size, textSeed(line.text), style.color, 'transparent');
    context.drawImage(sprite.ink, line.left - box.left - sprite.padding,
      line.top - box.top + ascent - sprite.ascent - sprite.padding, sprite.width, sprite.height);
  }
  canvas.dataset.lines = String(lines.length);
  element.dataset.pencilReady = 'true';
}

export function PencilText({ children }) {
  const text = Children.toArray(children).join('');
  const element = useRef(null), source = useRef(null), canvas = useRef(null);
  useEffect(() => {
    const node = element.current;
    delete node.dataset.pencilReady;
    let disposed = false, visible = false, pending = 0, dirty = true;
    const idle = window.requestIdleCallback ?? (callback => window.setTimeout(callback, 32));
    const cancel = window.cancelIdleCallback ?? window.clearTimeout;
    const schedule = () => {
      if (!visible || !dirty || pending || disposed) return;
      pending = idle(() => {
        pending = 0;
        if (!disposed && visible && dirty) {
          paintText(node, source.current, canvas.current, text); dirty = false;
        }
      }, { timeout: 300 });
    };
    const resize = new ResizeObserver(() => {
      dirty = true; delete node.dataset.pencilReady; schedule();
    });
    const intersection = new IntersectionObserver(entries => {
      visible = entries[0].isIntersecting; schedule();
    }, { rootMargin: '80px' });
    document.fonts.ready.then(() => {
      if (disposed) return;
      resize.observe(node); intersection.observe(node);
    });
    return () => { disposed = true; cancel(pending); resize.disconnect(); intersection.disconnect(); };
  }, [text]);
  return <span className="trip-pencil-text" ref={element}>
    <span className="trip-pencil-text-source" ref={source}>{text}</span>
    <canvas ref={canvas} aria-hidden="true" data-renderer="pencil-lettering-c" />
  </span>;
}
