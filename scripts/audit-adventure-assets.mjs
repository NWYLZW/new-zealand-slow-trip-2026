import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { inflateSync } from "node:zlib";
import * as d3 from "d3";

const root = new URL("../", import.meta.url);
const manifest = JSON.parse(readFileSync(new URL("src/adventure/data/landmarks.json", root), "utf8"));
const expectedStops = new Set(["ZQN", "WKA", "AOR", "TEK", "OAM", "CHC", "AKC", "HBT"]);
const ids = new Set(), stops = new Set(), hashes = new Set();
for (const asset of manifest) {
  assert(!ids.has(asset.id), `Duplicate asset id: ${asset.id}`);
  assert(!stops.has(asset.stopTag), `Duplicate asset stop: ${asset.stopTag}`);
  assert(expectedStops.has(asset.stopTag), `Unknown stop: ${asset.stopTag}`);
  assert(/^[a-z0-9-]+\.png$/.test(asset.file), `Unsafe asset filename: ${asset.file}`);
  const path = new URL(`public/images/adventure/${asset.file}`, root);
  const bytes = readFileSync(path);
  assert(bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])), `Not a PNG: ${asset.file}`);
  assert.equal(bytes.readUInt32BE(16), asset.pixelWidth, `Width mismatch: ${asset.file}`);
  assert.equal(bytes.readUInt32BE(20), asset.pixelHeight, `Height mismatch: ${asset.file}`);
  assert.equal(bytes[25], 6, `Expected RGBA PNG: ${asset.file}`);
  const hash = createHash("sha256").update(bytes).digest("hex");
  assert.equal(hash, asset.sha256, `Asset changed without updating provenance: ${asset.file}`);
  assert(!hashes.has(hash), `Duplicate image content: ${asset.file}`);
  assert(asset.alt && asset.altEn, `Missing bilingual labels: ${asset.file}`);
  assert.equal(asset.source.kind, "ai-generated-illustration");
  assert.equal(asset.source.tool, "imagegen");
  assert(asset.source.reviewedAt && asset.source.originalFile && asset.source.referenceAsset);
  assert(Number.isFinite(asset.worldWidth) && asset.worldWidth > 0 && asset.worldWidth <= 36, `Larger than the approved map scale: ${asset.file}`);
  assert(asset.anchor.length === 2 && asset.anchor.every((value) => Number.isFinite(value) && value >= 0 && value <= 1));
  ids.add(asset.id); stops.add(asset.stopTag); hashes.add(hash);
  console.log(`${asset.stopTag}: ${asset.pixelWidth}×${asset.pixelHeight}, ${(bytes.length / 1024).toFixed(0)} KiB, ${fileURLToPath(path).split("/").at(-1)}`);
}
assert.deepEqual([...stops].sort(), [...expectedStops].sort(), "Every destination must have its own asset");
console.log(`Adventure asset audit passed: ${manifest.length} unique RGBA illustrations with provenance.`);

// Non-itinerary cutouts have a separate contract from stop art.
const decorations = JSON.parse(readFileSync(new URL("src/adventure/data/decorations.json", root), "utf8"));
const expectedDecorations = new Set([
  "kiwi-bird", "whale-surfacing", "whale-tail", "whale-breaching",
  "helicopter", "milford-sound", "kea", "silver-fern", "sheep",
  "pohutukawa-blossom", "bay-of-plenty-kiwifruit", "north-island-tui",
  "central-otago-cherries", "kaikoura-fur-seal", "wetland-harakeke",
  "wetland-ti-kouka",
]);
const regionalDecorations = new Set([
  "pohutukawa-blossom", "bay-of-plenty-kiwifruit", "north-island-tui",
  "central-otago-cherries", "kaikoura-fur-seal", "wetland-harakeke",
  "wetland-ti-kouka",
]);
const decorationIds = new Set();
const whalePoses = new Set();
const coastline = JSON.parse(readFileSync(new URL("src/adventure/data/coastline.json", root), "utf8"));
const islands = coastline.features[0].geometry.coordinates.map(([ring]) => {
  const feature = { type: "Feature", geometry: { type: "Polygon", coordinates: [ring] } };
  if (d3.geoArea(feature) > 2 * Math.PI) feature.geometry.coordinates = [ring.slice().reverse()];
  return feature;
});

function alphaCounts(bytes, width, height) {
  assert.equal(bytes[28], 0, "Interlaced PNG cannot be checked for transparency");
  const chunks = [];
  for (let offset = 8; offset < bytes.length;) {
    const length = bytes.readUInt32BE(offset);
    const type = bytes.toString("ascii", offset + 4, offset + 8);
    if (type === "IDAT") chunks.push(bytes.subarray(offset + 8, offset + 8 + length));
    offset += length + 12;
  }
  const raw = inflateSync(Buffer.concat(chunks));
  const stride = width * 4;
  let previous = Buffer.alloc(stride), offset = 0, transparent = 0, opaque = 0;
  for (let y = 0; y < height; y++) {
    const filter = raw[offset++];
    const row = Buffer.from(raw.subarray(offset, offset + stride));
    offset += stride;
    for (let x = 0; x < stride; x++) {
      const left = x >= 4 ? row[x - 4] : 0;
      const above = previous[x];
      const upperLeft = x >= 4 ? previous[x - 4] : 0;
      let predictor = 0;
      if (filter === 1) predictor = left;
      else if (filter === 2) predictor = above;
      else if (filter === 3) predictor = Math.floor((left + above) / 2);
      else if (filter === 4) {
        const p = left + above - upperLeft;
        const da = Math.abs(p - left), db = Math.abs(p - above), dc = Math.abs(p - upperLeft);
        predictor = da <= db && da <= dc ? left : db <= dc ? above : upperLeft;
      } else assert.equal(filter, 0, `Unsupported PNG filter ${filter}`);
      row[x] = (row[x] + predictor) & 255;
    }
    for (let x = 3; x < stride; x += 4) {
      if (row[x] <= 5) transparent++;
      if (row[x] >= 250) opaque++;
    }
    assert(row[3] <= 5, `Left edge is not transparent at row ${y}`);
    assert(row[stride - 1] <= 5, `Right edge is not transparent at row ${y}`);
    previous = row;
  }
  return { transparent, opaque };
}

for (const asset of decorations) {
  assert(expectedDecorations.has(asset.id) && !decorationIds.has(asset.id), `Unexpected or duplicate decoration: ${asset.id}`);
  assert(!("stopTag" in asset) && !("routeId" in asset), `Decoration is tied to itinerary: ${asset.id}`);
  assert(/^[a-z0-9-]+\.png$/.test(asset.file), `Unsafe filename: ${asset.file}`);
  assert(asset.alt && asset.altEn && asset.source.approvedUse, `Missing decoration semantics: ${asset.id}`);
  assert(asset.position.length === 2 && asset.position.every(Number.isFinite), `Bad map position: ${asset.id}`);
  assert(!asset.offsetWorld || asset.offsetWorld.length === 2 && asset.offsetWorld.every((n) => Number.isFinite(n) && Math.abs(n) <= 60), `Bad map artwork offset: ${asset.id}`);
  assert(asset.anchor.length === 2 && asset.anchor.every((n) => Number.isFinite(n) && n >= 0 && n <= 1));
  assert(Number.isFinite(asset.worldWidth) && asset.worldWidth > 0 && asset.worldWidth <= 50, `Decoration too large: ${asset.id}`);
  assert(Number.isFinite(asset.minPixels) && asset.minPixels >= 16 && asset.minPixels <= 72, `Bad responsive minimum: ${asset.id}`);
  if (asset.id.startsWith("whale-")) {
    assert(["surfacing", "tail", "breaching"].includes(asset.pose), `Unknown whale pose: ${asset.id}`);
    assert(!whalePoses.has(asset.pose), `Repeated whale pose: ${asset.pose}`);
    assert(!asset.offsetWorld, `Whale must use its real ocean anchor: ${asset.id}`);
    assert(!islands.some((island) => d3.geoContains(island, asset.position)), `Whale anchor is on land: ${asset.id}`);
    whalePoses.add(asset.pose);
  }
  if (asset.id === "milford-sound") {
    const officialPointC = [167.9053, -44.63685];
    assert(asset.position.every((value, index) => Math.abs(value - officialPointC[index]) < 0.005), "Milford anchor left the mapped fiord");
    assert(!asset.offsetWorld, "Milford artwork must not be displaced from the fiord");
    assert(asset.coordinateSource?.startsWith("https://www.doc.govt.nz/"), "Missing Milford coordinate source");
  }
  if (regionalDecorations.has(asset.id)) {
    assert(islands.some((island) => d3.geoContains(island, asset.position)), `Regional anchor is outside the islands: ${asset.id}`);
    assert(asset.region && /^https:\/\/(www\.)?(doc\.govt\.nz|mpi\.govt\.nz|centralotagonz\.com)\//.test(asset.habitatSource), `Missing regional source: ${asset.id}`);
    assert(/^[a-f0-9]{64}$/.test(asset.source.originalSha256), `Missing original image hash: ${asset.id}`);
    assert.equal(asset.source.generationThreadId, "01a0d50c-b1e8-7d33-a573-82a8f57f8523", `Wrong imagegen task: ${asset.id}`);
    assert(asset.source.derivation?.includes("640px RGBA PNG"), `Missing derivative provenance: ${asset.id}`);
    assert(asset.pixelWidth <= 640 && asset.pixelHeight <= 640, `Regional cutout not optimized: ${asset.id}`);
    const originalPath = join(homedir(), ".codex", "generated_images", asset.source.generationThreadId, asset.source.originalFile);
    if (existsSync(originalPath)) {
      const originalHash = createHash("sha256").update(readFileSync(originalPath)).digest("hex");
      assert.equal(originalHash, asset.source.originalSha256, `Original image provenance changed: ${asset.id}`);
    }
  }
  assert.equal(asset.source.kind, "ai-generated-illustration");
  assert.equal(asset.source.tool, "imagegen");
  assert(asset.source.originalFile && asset.source.referenceAsset && asset.source.reviewedAt);
  const bytes = readFileSync(new URL(`public/images/adventure/${asset.file}`, root));
  assert(bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])), `Not a PNG: ${asset.file}`);
  assert.equal(bytes.readUInt32BE(16), asset.pixelWidth);
  assert.equal(bytes.readUInt32BE(20), asset.pixelHeight);
  assert.equal(bytes[24], 8, `Expected 8-bit PNG: ${asset.file}`);
  assert.equal(bytes[25], 6, `Expected RGBA PNG: ${asset.file}`);
  const hash = createHash("sha256").update(bytes).digest("hex");
  assert.equal(hash, asset.sha256, `Provenance hash mismatch: ${asset.file}`);
  assert(!hashes.has(hash), `Duplicate illustration: ${asset.file}`);
  const alpha = alphaCounts(bytes, asset.pixelWidth, asset.pixelHeight);
  assert(alpha.transparent > bytes.readUInt32BE(16) * bytes.readUInt32BE(20) / 5, `Missing transparent surround: ${asset.file}`);
  assert(alpha.opaque > 1000, `Missing visible artwork: ${asset.file}`);
  if (regionalDecorations.has(asset.id)) {
    const visible = asset.pixelWidth * asset.pixelHeight - alpha.transparent;
    assert(alpha.opaque / visible > 0.68, `Regional cutout body is too translucent: ${asset.file}`);
  }
  decorationIds.add(asset.id);
  hashes.add(hash);
  console.log(`DECOR ${asset.id}: ${asset.pixelWidth}×${asset.pixelHeight}, ${(bytes.length / 1024).toFixed(0)} KiB, transparent surround verified`);
}
assert.deepEqual([...decorationIds].sort(), [...expectedDecorations].sort());
assert.deepEqual([...whalePoses].sort(), ["breaching", "surfacing", "tail"]);
console.log(`Adventure decoration audit passed: ${decorations.length} separate, transparent, non-itinerary illustrations.`);
