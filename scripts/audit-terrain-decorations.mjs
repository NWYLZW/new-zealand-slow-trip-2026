import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync, readdirSync } from "node:fs";
import { inflateSync } from "node:zlib";
import { geoContains } from "d3";

const root = new URL("../", import.meta.url);
const data = JSON.parse(readFileSync(new URL("src/adventure/data/terrainDecorations.json", root), "utf8"));
const coast = JSON.parse(readFileSync(new URL("src/adventure/data/coastline.json", root), "utf8"));
const pngSignature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

function alphaStats(bytes, width, height, file) {
  assert.equal(bytes[24], 8, `${file}: expected 8-bit PNG`);
  assert.equal(bytes[25], 6, `${file}: expected RGBA PNG`);
  assert.equal(bytes[28], 0, `${file}: interlaced PNG is unsupported`);
  const chunks = [];
  for (let offset = 8; offset < bytes.length;) {
    const length = bytes.readUInt32BE(offset);
    assert(offset + length + 12 <= bytes.length, `${file}: truncated PNG chunk`);
    if (bytes.toString("ascii", offset + 4, offset + 8) === "IDAT") {
      chunks.push(bytes.subarray(offset + 8, offset + 8 + length));
    }
    offset += length + 12;
  }
  assert(chunks.length, `${file}: missing image data`);
  const raw = inflateSync(Buffer.concat(chunks));
  const stride = width * 4;
  assert.equal(raw.length, height * (stride + 1), `${file}: unexpected decoded size`);
  let previous = Buffer.alloc(stride), offset = 0, clear = 0, visible = 0, edgeMax = 0;
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
      } else assert.equal(filter, 0, `${file}: unsupported PNG filter ${filter}`);
      row[x] = (row[x] + predictor) & 255;
    }
    for (let x = 3; x < stride; x += 4) {
      const alpha = row[x];
      if (alpha === 0) clear++;
      if (alpha >= 32) visible++;
      if (y === 0 || y === height - 1 || x === 3 || x === stride - 1) edgeMax = Math.max(edgeMax, alpha);
    }
    previous = row;
  }
  return { clear, visible, edgeMax };
}

const treeAssets = data.assets.filter((asset) => asset.group === "tree");
const grassAssets = data.assets.filter((asset) => asset.group === "grass");
assert(treeAssets.length >= 6, "Need at least six distinct bitmap trees");
assert(grassAssets.length >= 3, "Need at least three distinct bitmap grasses");
assert(data.meaning.includes("no itinerary"), "Decorative meaning is missing");
assert.equal(data.distribution.externalGameAssets, "none", "Game assets are prohibited");
assert(data.distribution.seed && Number.isFinite(data.distribution.capZoom));
const assetIds = new Set(), hashes = new Set(), files = new Set();
let totalBytes = 0;
for (const asset of data.assets) {
  assert(/^[a-z0-9-]+$/.test(asset.id) && !assetIds.has(asset.id), `Duplicate or invalid asset id: ${asset.id}`);
  assert(/^[a-z0-9-]+\.png$/.test(asset.file) && !files.has(asset.file), `Duplicate or unsafe filename: ${asset.file}`);
  assert(["tree", "grass"].includes(asset.group), `${asset.id}: unexpected group`);
  assert(asset.alt && asset.altEn && asset.regionHint, `${asset.id}: missing semantics`);
  assert.equal(asset.source.kind, "ai-generated-illustration");
  assert.equal(asset.source.tool, "built-in-imagegen");
  assert(asset.source.reviewedAt && asset.source.originalFile && /^[a-f0-9]{64}$/.test(asset.source.originalSha256));
  assert(asset.source.derivation.includes("lossless RGBA PNG"));
  assert.equal(asset.source.styleReference.includes("no game assets"), true);
  const bytes = readFileSync(new URL(`public/images/adventure/terrain/${asset.file}`, root));
  assert(bytes.subarray(0, 8).equals(pngSignature), `${asset.file}: not PNG`);
  assert.equal(bytes.readUInt32BE(16), asset.pixelWidth, `${asset.file}: width changed`);
  assert.equal(bytes.readUInt32BE(20), asset.pixelHeight, `${asset.file}: height changed`);
  assert(Math.max(asset.pixelWidth, asset.pixelHeight) <= (asset.group === "tree" ? 256 : 192), `${asset.file}: oversized`);
  const hash = createHash("sha256").update(bytes).digest("hex");
  assert.equal(hash, asset.sha256, `${asset.file}: derived hash changed`);
  assert(!hashes.has(hash), `${asset.file}: duplicate file content`);
  const alpha = alphaStats(bytes, asset.pixelWidth, asset.pixelHeight, asset.file);
  const pixels = asset.pixelWidth * asset.pixelHeight;
  assert(alpha.clear > pixels * 0.05, `${asset.file}: missing true transparent surround`);
  assert(alpha.visible > pixels * 0.1, `${asset.file}: subject is too transparent`);
  assert(alpha.edgeMax <= 5, `${asset.file}: nontransparent image edge`);
  const originalDir = process.env.TERRAIN_ORIGINALS_DIR;
  if (originalDir) {
    const original = readFileSync(new URL(`file://${originalDir.replace(/\/$/, "")}/${asset.source.originalFile}`));
    assert.equal(createHash("sha256").update(original).digest("hex"), asset.source.originalSha256, `${asset.id}: original source changed`);
  }
  totalBytes += bytes.length;
  console.log(`${asset.file}: ${asset.pixelWidth}×${asset.pixelHeight}; ${bytes.length} B; clear ${(alpha.clear / pixels * 100).toFixed(1)}%; hash and alpha verified`);
  assetIds.add(asset.id); files.add(asset.file); hashes.add(hash);
}
assert(totalBytes < 800000, `Vegetation payload too large: ${totalBytes} B`);
assert.deepEqual(readdirSync(new URL("public/images/adventure/terrain/", root)).filter((file) => file.endsWith(".png")).sort(), [...files].sort(), "Unlisted terrain PNG or old scenic cutout remains");
assert(Array.isArray(data.waterAvoidance) && data.waterAvoidance.length >= 5, "Missing inland water clearances");
for (const zone of data.waterAvoidance) {
  assert(Array.isArray(zone.position) && zone.position.length === 2 && zone.position.every(Number.isFinite));
  assert(Number.isFinite(zone.worldRadius) && zone.worldRadius >= 10 && zone.worldRadius <= 25);
}
assert(Array.isArray(data.texturePatches) && data.texturePatches.length >= 8, "Missing vegetation regions");
const patchIds = new Set();
for (const patch of data.texturePatches) {
  assert(/^[a-z0-9-]+$/.test(patch.id) && !patchIds.has(patch.id), `Duplicate texture patch: ${patch.id}`);
  assert(["forest", "scrub", "alpine", "grass"].includes(patch.style), `${patch.id}: invalid style`);
  assert(Array.isArray(patch.position) && patch.position.length === 2 && patch.position.every(Number.isFinite));
  assert(geoContains(coast, patch.position), `${patch.id}: region center outside islands`);
  assert(Array.isArray(patch.radius) && patch.radius.length === 2 && patch.radius.every((value) => Number.isFinite(value) && value > 0 && value <= 1));
  assert(Number.isInteger(patch.count) && patch.count >= 30 && patch.count <= 100);
  patchIds.add(patch.id);
}
const drawer = readFileSync(new URL("src/adventure/drawTerrainDecorations.js", root), "utf8");
assert(drawer.includes('.append("image")'), "Bitmap vegetation must render on the map");
assert(!drawer.includes('.append("path")'), "SVG vegetation paths must not render");
assert(drawer.includes('data-sprite') && drawer.includes('capZoom'));
console.log(`Terrain decoration audit passed: ${treeAssets.length} tree + ${grassAssets.length} grass bitmaps, ${data.texturePatches.length} regions, ${totalBytes} B total.`);
