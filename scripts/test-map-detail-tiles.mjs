import assert from 'node:assert/strict';
import { detailCoverage, planDetailTiles, uncoveredDetailBounds } from '../src/adventure/pencil/detailTilePlan.js';

const area = bounds => (bounds.right - bounds.left) * (bounds.bottom - bounds.top);
const missingArea = plan => plan.tiles.flatMap(tile => tile.missing).reduce((sum, bounds) => sum + area(bounds), 0);
const viewport = { left: 0, top: 0, width: 768, height: 576, renderScale: 1 };
const fresh = planDetailTiles(viewport);
assert.equal(fresh.tiles.length, 12);
assert.equal(missingArea(fresh), 768 * 576);

const completed = fresh.tiles.slice(0, 4).flatMap(tile => tile.missing);
const partialEntry = { left: 0, top: 0, w: 768, h: 576, complete: false, coverage: completed };
assert.equal(detailCoverage(partialEntry), completed);
const resumed = planDetailTiles(viewport, detailCoverage(partialEntry));
assert.equal(resumed.tiles.length, 8, 'A cancelled detail job resumes without repainting finished tiles');
assert.equal(resumed.reusedTiles, 4);
assert.equal(missingArea(resumed), 8 * 192 * 192);

const fullCoverage = detailCoverage({ ...partialEntry, complete: true });
assert.equal(fullCoverage.length, 1);
assert.equal(planDetailTiles(viewport, fullCoverage).tiles.length, 0);
const smallPan = planDetailTiles({ ...viewport, left: 5, top: 3 }, fullCoverage);
assert.equal(missingArea(smallPan), 768 * 576 - 763 * 573,
  'A small diagonal drag paints only the exposed strips, not whole overlapping tiles');
for (const bounds of smallPan.tiles.flatMap(tile => tile.missing)) {
  assert(bounds.left >= 768 || bounds.top >= 576, 'Copied pixels must not be overwritten');
}

const rightHalf = { left: 384, top: 0, right: 768, bottom: 576 };
const leftHalf = { left: 0, top: 0, right: 384, bottom: 576 };
assert.equal(planDetailTiles(viewport, [rightHalf, leftHalf, rightHalf]).tiles.length, 0,
  'Multiple compatible cached regions combine without leaving holes');
assert.deepEqual(uncoveredDetailBounds(rightHalf, [rightHalf]), []);

for (const renderScale of [6, 12, 64, 256]) {
  const scaled = { left: -20.25, top: 7.125, width: 768 / renderScale,
    height: 576 / renderScale, renderScale };
  const initial = planDetailTiles(scaled);
  const coverage = initial.tiles.slice(0, 3).flatMap(tile => tile.missing);
  const next = planDetailTiles(scaled, coverage);
  assert.equal(next.tiles.length, initial.tiles.length - 3);
  assert(Math.abs(missingArea(next) + coverage.reduce((sum, bounds) => sum + area(bounds), 0)
    - scaled.width * scaled.height) < 1e-8);
}
console.log('Detail tiles: interrupted work, small pans, partial coverage and multiple cached regions passed; no browser run.');
