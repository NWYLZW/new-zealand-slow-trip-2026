import { waterLabels } from './waterFeatures';
import { labelImage } from './mapLabels';

const labelOffsets = { 'lake-wakatipu': [-45, 35], 'lake-wanaka': [-55, -20] };

// Labels only. All lake/river pigment belongs to the single pencil terrain layer.
export function drawWaterLabels(world, project) {
  const layer = world.append('g').attr('class', 'trip-water-labels').attr('pointer-events', 'none');
  const labels = waterLabels.map((feature, index) => {
    const [x, y] = project(feature.labelPosition);
    const label = layer.append('g').attr('class', 'trip-water-label')
      .attr('data-water-label', feature.id).attr('aria-hidden', 'true');
    labelImage(label.append('image'), feature.mapLabel, feature.kind === 'river' ? 13 : 15, 7100 + index);
    return { feature, label, x, y };
  });
  return {
    updateZoom(zoom) {
      for (const { feature, label, x, y } of labels) {
        const shown = zoom >= feature.labelMinZoom;
        label.style('display', shown ? null : 'none');
        if (!shown) continue;
        const [dx, dy] = labelOffsets[feature.id] ?? [0, feature.kind === 'river' ? -12 : 0];
        label.attr('transform', `translate(${x + dx / zoom},${y + dy / zoom}) scale(${1 / zoom})`);
      }
    },
    avoidStops(markers) {
      const occupied = markers.filter(({ button }) => button.querySelector('.trip-stop-label').style.visibility !== 'hidden')
        .map(({ button }) => button.querySelector('.trip-stop-label').getBoundingClientRect());
      for (const { label } of labels) {
        label.style('visibility', null);
        if (label.style('display') === 'none') continue;
        const bounds = label.select('image').node().getBoundingClientRect();
        if (occupied.some(other => bounds.left < other.right + 4 && bounds.right + 4 > other.left &&
          bounds.top < other.bottom + 4 && bounds.bottom + 4 > other.top)) label.style('visibility', 'hidden');
        else occupied.push(bounds);
      }
    },
  };
}
