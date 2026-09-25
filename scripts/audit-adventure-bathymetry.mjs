import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";

const data = JSON.parse(readFileSync(new URL("../src/adventure/data/bathymetry.json", import.meta.url), "utf8"));
const css = readFileSync(new URL("../src/adventure/bathymetry.css", import.meta.url), "utf8");
const expected = [
  [200, "K", "5c6c182da8608153ea2dce22dfb32c987e5390e0bd4a122266143ba181a7b636"],
  [1000, "J", "fa30219901dd4de34b9f5b20f41bc7c055f9fc9d58cf157ad2679c95239cd366"],
  [2000, "I", "cdedc746ce06e1a051cb8905e8f07855225ccbd3560ce3a66607651fc6953ce2"],
  [4000, "G", "ad876e6b6b686494a0e89f0096880a6755aee77af3d738794bbbc92216afcf3d"],
];

function inRing(ring, [x, y]) {
  let inside = false;
  for (let i = 0; i < ring.length - 1; i++) {
    const [x1, y1] = ring[i], [x2, y2] = ring[i + 1];
    if ((y1 > y) !== (y2 > y) && x < x1 + (y - y1) * (x2 - x1) / (y2 - y1)) inside = !inside;
  }
  return inside;
}

function contains(threshold, point) {
  return threshold.polygons.some(([outer, ...holes]) =>
    inRing(outer, point) && holes.every((hole) => !inRing(hole, point)));
}

assert.equal(data.type, "AdventureBathymetry");
assert.equal(data.crs, "EPSG:4326");
assert.equal(data.coordinateOrder, "longitude,latitude");
assert.deepEqual(data.bounds, [110, -68, 230, -15]);
// Inverted from the map's south-island focus at k=0.55. Leave room for
// approximately 130 px of horizontal panning in the shortest viewport.
for (const [west, south, east, north] of [
  [139.66, -54.87, 201.19, -29.84], // 1280 × 720
  [131.99, -55.13, 208.86, -29.45], // 844 × 390
  [158.35, -59.01, 182.49, -23.03], // 436 × 900
]) {
  assert.ok(data.bounds[0] + 15 < west && data.bounds[2] - 15 > east,
    "Minimum-zoom horizontal viewport needs sourced depth coverage and pan room");
  assert.ok(data.bounds[1] + 5 < south && data.bounds[3] - 5 > north,
    "Minimum-zoom vertical viewport needs sourced depth coverage and fade room");
}
assert.match(data.retrievedAt, /^20\d\d-\d\d-\d\d$/);
assert.equal(data.source.dataset, "Natural Earth 1:10m Bathymetry");
assert.equal(data.source.license, "Public domain");
assert.equal(data.source.repositoryCommit, "ca96624a56bd078437bca8184e78163e5039ad19");
assert.equal(data.source.descriptionUrl,
  "https://www.naturalearthdata.com/downloads/10m-physical-vectors/10m-bathymetry/");
assert.match(data.source.licenseUrl, /natural-earth-vector\/blob\/ca96624a56bd078437bca8184e78163e5039ad19\/LICENSE\.md$/);
assert.equal(data.thresholds.length, expected.length);
assert.match(css, /\.trip-bathymetry-band\{stroke:none/);

for (const [index, [depth, code, hash]] of expected.entries()) {
  const layer = data.thresholds[index];
  assert.equal(layer.minDepthM, depth);
  assert.equal(layer.sourceFile, `ne_10m_bathymetry_${code}_${depth}.geojson`);
  assert.equal(layer.sourceSha256, hash);
  assert.ok(layer.sourceFeatureCountInBounds > 0);
  assert.ok(layer.polygons.length > 0);
  assert.match(css, new RegExp(`\\.trip-bathymetry-band--${depth}\\{fill:#[0-9a-f]{6}\\}`));
  for (const polygon of layer.polygons) for (const ring of polygon) {
    assert.ok(ring.length >= 4, `${depth}m: degenerate ring`);
    assert.deepEqual(ring[0], ring.at(-1), `${depth}m: open ring`);
    for (const [lon, lat] of ring) {
      assert.ok(lon >= 110 && lon <= 230 && lat >= -68 && lat <= -15,
        `${depth}m: point outside regional bounds: ${lon},${lat}`);
    }
  }
}

assert.deepEqual(data.thresholds.map((layer) => contains(layer, [165, -41])), [true, true, true, true]);
assert.deepEqual(data.thresholds.map((layer) => contains(layer, [179, -44])), [true, false, false, false]);
assert.deepEqual(data.thresholds.map((layer) => contains(layer, [190, -40])), [true, true, true, true]);
assert.deepEqual(data.thresholds.map((layer) => contains(layer, [208, -40])), [true, true, true, true]);
assert.deepEqual(data.thresholds.map((layer) => contains(layer, [171.7, -44.5])), [false, false, false, false]);
console.log("Bathymetry audit passed: four sourced depth thresholds, regional bounds, offshore samples and color-only rendering checked.");

if (process.argv.includes("--live")) {
  for (const [depth, , hash] of expected) {
    const file = data.thresholds.find((layer) => layer.minDepthM === depth).sourceFile;
    const url = `https://raw.githubusercontent.com/nvkelso/natural-earth-vector/${data.source.repositoryCommit}/geojson/${file}`;
    const body = execFileSync("curl", ["--fail", "--silent", "--show-error", "--location", "--retry", "3", url],
      { timeout: 90000, maxBuffer: 20 * 1024 * 1024 });
    assert.equal(createHash("sha256").update(body).digest("hex"), hash, `${file}: source changed`);
  }
  console.log("Pinned Natural Earth source files match all four recorded SHA-256 hashes.");
}
