import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const data = JSON.parse(readFileSync(new URL("../src/adventure/data/hydrography.json", import.meta.url), "utf8"));
const expected = new Map([
  ["lake-wakatipu", ["lake", "Lake Wakatipu", 26292, "Unofficial Recorded", [312]]],
  ["lake-wanaka", ["lake", "Lake Wānaka", 26293, "Official Approved", [60687]]],
  ["lake-tekapo", ["lake", "Lake Tekapo", 26241, "Unofficial Recorded", [273]]],
  ["lake-pukaki", ["lake", "Lake Pukaki", 26116, "Unofficial Recorded", [60679]]],
  ["lake-taupo", ["lake", "Lake Taupō / Taupōmoana", 26230, "Unofficial Recorded", [60683]]],
  ["river-waikato", ["river", "Waikato River", 45893, "Official Approved", [589, 4926]]],
  ["river-clutha", ["river", "Clutha River/Mata-Au", 7308, "Official Altered", [4934, 4845]]],
  ["river-waitaki", ["river", "Waitaki River", 47013, "Official Approved", [4847]]],
]);

function inRing(ring, [x, y]) {
  let inside = false;
  for (let i = 0; i < ring.length - 1; i++) {
    const [x1, y1] = ring[i], [x2, y2] = ring[i + 1];
    if ((y1 > y) !== (y2 > y) && x < x1 + (y - y1) * (x2 - x1) / (y2 - y1)) inside = !inside;
  }
  return inside;
}

assert.equal(data.crs, "EPSG:4326");
assert.equal(data.coordinateOrder, "longitude,latitude");
assert.match(data.retrievedAt, /^20\d\d-\d\d-\d\d$/);
assert.equal(data.features.length, expected.size);
assert.equal(data.attribution, "Contains data sourced from the LINZ Data Service licensed for reuse under CC BY 4.0");
assert.equal(data.nameSource, "https://data.linz.govt.nz/layer/51681-nz-place-names-nzgb/");

for (const feature of data.features) {
  const reference = expected.get(feature.id);
  assert.ok(reference, `Unexpected water feature: ${feature.id}`);
  const [kind, name, nameId, status, objectIds] = reference;
  assert.equal(feature.kind, kind, feature.id);
  assert.equal(feature.name, name, feature.id);
  assert.equal(feature.gazetteer.nameId, nameId, feature.id);
  assert.equal(feature.gazetteer.status, status, feature.id);
  assert.deepEqual(feature.source.objectIds, objectIds, feature.id);
  assert.equal(feature.source.layer, kind === "lake" ? "NZ_Lake_Polygons_Topo_1_50k" : "LINZ_NZ_River_Name_Polygons_Pilot");
  assert.match(feature.source.url, /^https:\/\/data\.linz\.govt\.nz\/layer\/(50293|103631)-/);
  assert.equal(feature.source.apiUrl,
    `https://services.arcgis.com/xdsHIIxuCWByZiCB/ArcGIS/rest/services/${feature.source.layer}/FeatureServer/0/query`);
  assert.ok(feature.mapLabel && feature.labelZh);
  assert.ok(feature.labelMinZoom >= 1 && feature.labelMinZoom <= 6);
  assert.ok(Array.isArray(feature.parts) && feature.parts.length > 0);

  for (const polygon of feature.parts) {
    assert.ok(Array.isArray(polygon) && polygon.length > 0);
    for (const ring of polygon) {
      assert.ok(ring.length >= 4, `${feature.id}: degenerate ring`);
      assert.deepEqual(ring[0], ring.at(-1), `${feature.id}: open ring`);
      for (const [lon, lat] of ring) {
        assert.ok(lon >= 166 && lon <= 179 && lat >= -48 && lat <= -34, `${feature.id}: outside mainland NZ extent: ${lon},${lat}`);
      }
    }
  }
  assert.ok(feature.parts.some(([outer, ...holes]) =>
    inRing(outer, feature.labelPosition) && holes.every((hole) => !inRing(hole, feature.labelPosition)),
  ), `${feature.id}: label anchor is outside its water shape`);
}

console.log(`Hydrography audit passed: ${data.features.filter((item) => item.kind === "lake").length} lakes, ${data.features.filter((item) => item.kind === "river").length} rivers; names, extents, anchors and LINZ source IDs checked.`);

if (process.argv.includes("--live")) {
  async function query(url, params) {
    const endpoint = new URL(url);
    endpoint.search = new URLSearchParams({ f: "json", returnGeometry: "false", ...params }).toString();
    let lastError;
    for (let attempt = 0; attempt < 4; attempt++) {
      try {
        const response = await fetch(endpoint, { signal: AbortSignal.timeout(30000) });
        assert.ok(response.ok, `${response.status} from ${endpoint.origin}`);
        const result = await response.json();
        assert.ok(!result.error, JSON.stringify(result.error));
        return result.features;
      } catch (error) {
        lastError = error;
      }
    }
    throw lastError;
  }

  const gazetteer = await query(
    "https://services.arcgis.com/xdsHIIxuCWByZiCB/ArcGIS/rest/services/LINZ_NZ_Place_Names/FeatureServer/0/query",
    { where: `name_id IN (${data.features.map((feature) => feature.gazetteer.nameId).join(",")})`, outFields: "name_id,name,status" },
  );
  for (const feature of data.features) {
    const name = gazetteer.find((entry) => entry.attributes.name_id === feature.gazetteer.nameId)?.attributes;
    assert.equal(name?.name, feature.name, `${feature.id}: current NZGB name differs`);
    assert.equal(name?.status, feature.gazetteer.status, `${feature.id}: current NZGB status differs`);
  }
  for (const kind of ["lake", "river"]) {
    const selected = data.features.filter((feature) => feature.kind === kind);
    const ids = selected.flatMap((feature) => feature.source.objectIds);
    const rows = await query(selected[0].source.apiUrl,
      { objectIds: ids.join(","), outFields: "OBJECTID,name" });
    for (const feature of selected) for (const id of feature.source.objectIds) {
      const row = rows.find((entry) => entry.attributes.OBJECTID === id)?.attributes;
      assert.equal(row?.name, feature.name, `${feature.id}: current geometry source name differs for ${id}`);
    }
  }
  console.log("Live LINZ Gazetteer and geometry-source names verified.");
}
