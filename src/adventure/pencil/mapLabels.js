import { mapHandwriting, pencilLabel } from './label';
import { pencilPalette as p, pencilLettering } from './palette';
import { setCanvasRepaint } from './canvasRecovery';
export { textCacheReady } from './textCache';

// Use the same C pigment mask for DOM stop labels and projected map labels.
export function mapLabel(text, size = 19, seed = 71, color = p.ink, paper = p.paper, options = {}) {
  return pencilLabel(text, { size, seed, color, paper, settings: pencilLettering,
    family: options.family ?? mapHandwriting, persistence: options.persistence });
}

export function fillStopLabel(element, text, seed, options = {}) {
  const canvas = document.createElement('canvas');
  const paint = () => {
    const sprite = mapLabel(text, 19, seed, p.ink, p.paper, options);
    const source = sprite.canvas, context = canvas.getContext('2d');
    if (!source || !context || context.isContextLost?.()) return;
    canvas.width = source.width; canvas.height = source.height;
    canvas.style.width = `${sprite.width}px`; canvas.style.height = `${sprite.height}px`;
    context.drawImage(source, 0, 0);
  };
  setCanvasRepaint(canvas, paint);
  paint();
  canvas.setAttribute('aria-hidden', 'true');
  element.replaceChildren(canvas);
}

export function labelImage(selection, text, size, seed, color = p.water, options = {}) {
  const sprite = mapLabel(text, size, seed, color, p.paper, options);
  const source = sprite.canvas;
  if (!source) return sprite;
  selection.attr('href', source.toDataURL()).attr('width', sprite.width)
    .attr('height', sprite.height).attr('x', -sprite.width / 2)
    .attr('y', -sprite.ascent - sprite.padding).attr('aria-hidden', 'true');
  return sprite;
}
