import geography from '../data/pencil-geography.json';
import hydrography from '../data/hydrography.json';

// These are the same named waters, not separate features to paint on top.
// Keep the sourced LINZ geometry, including its holes and disconnected parts.
export const waterReplacements = {
  'Lake Wakatipu': 'lake-wakatipu',
  'Lake Wanaka': 'lake-wanaka',
  'Lake Tekapo': 'lake-tekapo',
  'Lake Pukaki': 'lake-pukaki',
  'Lake Taupo': 'lake-taupo',
  Waikato: 'river-waikato',
  Clutha: 'river-clutha',
  Waitaki: 'river-waitaki',
};

export const waterLabels = hydrography.features;

const detailed = hydrography.features.map(feature => ({
  type: 'Feature',
  properties: { id: feature.id, name: feature.name, kind: feature.kind, source: 'LINZ' },
  geometry: { type: 'MultiPolygon', coordinates: feature.parts },
}));
const lakes = new Map();
for (const lake of geography.lakes) {
  if (waterReplacements[lake.properties.name]) continue;
  const name = lake.properties.name;
  // Natural Earth splits Te Anau into two polygon parts; retain both under one ID.
  if (!lakes.has(name)) lakes.set(name, {
    type: 'Feature',
    properties: { id: `ne-lake-${lake.properties.id}`, name, kind: 'lake', source: 'Natural Earth' },
    geometry: { type: 'MultiPolygon', coordinates: [] },
  });
  lakes.get(name).geometry.coordinates.push(...(lake.geometry.type === 'MultiPolygon'
    ? lake.geometry.coordinates : [lake.geometry.coordinates]));
}
const rivers = geography.rivers.flatMap((river, index) => waterReplacements[river.properties.name] ? [] : [{
  ...river,
  properties: { id: `ne-river-${index}`, name: river.properties.name, kind: 'river', source: 'Natural Earth' },
}]);

// A single resolved collection feeds every terrain resolution and the labels.
export const waterFeatures = [...rivers, ...detailed.filter(f => f.properties.kind === 'river'),
  ...lakes.values(), ...detailed.filter(f => f.properties.kind === 'lake')];
