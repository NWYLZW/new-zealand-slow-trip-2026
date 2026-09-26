import { mapHandwriting, pencilLabel } from './label';
import { pencilPalette as p, pencilLettering } from './palette';

// Use the same C pigment mask for DOM stop labels and projected map labels.
export function mapLabel(text, size = 19, seed = 71, color = p.ink, paper = p.paper) {
  return pencilLabel(text, { size, seed, color, paper, settings: pencilLettering,
    family: mapHandwriting });
}

export function fillStopLabel(element, text, seed) {
  const sprite = mapLabel(text, 19, seed);
  const canvas = document.createElement('canvas');
  canvas.width = sprite.canvas.width; canvas.height = sprite.canvas.height;
  canvas.style.width = `${sprite.width}px`; canvas.style.height = `${sprite.height}px`;
  canvas.getContext('2d').drawImage(sprite.canvas, 0, 0);
  canvas.setAttribute('aria-hidden', 'true');
  element.replaceChildren(canvas);
}

export function labelImage(selection, text, size, seed, color = p.water) {
  const sprite = mapLabel(text, size, seed, color);
  selection.attr('href', sprite.canvas.toDataURL()).attr('width', sprite.width)
    .attr('height', sprite.height).attr('x', -sprite.width / 2)
    .attr('y', -sprite.ascent - sprite.padding).attr('aria-hidden', 'true');
  return sprite;
}
