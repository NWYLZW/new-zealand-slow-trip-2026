import terrainSource from './drawPencilMap.js?raw';
import brushSource from './brush.js?raw';
import strokeSource from './stroke.js?raw';
import waterSource from './drawPencilWater.js?raw';
import waterFeaturesSource from './waterFeatures.js?raw';
import paletteSource from './palette.js?raw';
import { mapFingerprint } from './mapTerrainCache';

const painterVersion = mapFingerprint([terrainSource, brushSource, strokeSource,
  waterSource, waterFeaturesSource, paletteSource].join('\n'));
let previousData = [], dataVersion = '';

export function terrainOverviewKey({ geography, landCover, waterFeatures, project, width, height, density, palette }) {
  if (previousData[0] !== geography || previousData[1] !== landCover || previousData[2] !== waterFeatures) {
    previousData = [geography, landCover, waterFeatures];
    dataVersion = mapFingerprint(JSON.stringify([geography, landCover, waterFeatures]));
  }
  return `overview:${mapFingerprint(JSON.stringify({ painterVersion, dataVersion,
    projection: [[166, -47], [173, -40], [178, -34]].map(project),
    width, height, density, palette, lod: 'overview', format: 'png-v1' }))}`;
}
