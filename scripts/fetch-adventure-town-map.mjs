import { mkdir, readFile, writeFile } from "node:fs/promises";

const places = [
  ["ZQN", -45.0312, 168.6626], ["WKA", -44.698, 169.136],
  ["AOR", -43.735, 170.0967], ["TEK", -44.0047, 170.4771],
  ["OAM", -45.0966, 170.9714], ["CHC", -43.5321, 172.6362],
  ["AKC", -36.8509, 174.7645], ["HBT", -37.8576, 175.6792],
];

const endpoints = ["https://overpass-api.de/api/interpreter", "https://overpass.kumi.systems/api/interpreter",
  "https://overpass.private.coffee/api/interpreter"];
const outputDirectory = new URL("../src/adventure/data/town-maps/", import.meta.url);
const combinedUrl = new URL("../src/adventure/data/town-map.json", import.meta.url);
const previous = await readFile(combinedUrl, "utf8").then(JSON.parse).catch(() => null);
const source = previous?.source ?? {
  source: {
    name: "OpenStreetMap contributors",
    license: "ODbL 1.0",
    url: "https://www.openstreetmap.org/copyright",
    retrievedAt: new Date().toISOString(),
    note: "Local generalized vector snapshot for the adventure town maps; not live navigation data.",
  },
}.source;
await mkdir(outputDirectory, { recursive: true });

const samePoint = (a, b) => a?.[0] === b?.[0] && a?.[1] === b?.[1];
function relationRings(members) {
  const remaining = members.filter(member => member.type === "way" && member.geometry?.length)
    .map(member => member.geometry.map(point => [point.lon, point.lat]));
  const rings = [];
  while (remaining.length) {
    const ring = remaining.shift();
    while (!samePoint(ring[0], ring.at(-1))) {
      const index = remaining.findIndex(segment => samePoint(ring.at(-1), segment[0]) ||
        samePoint(ring.at(-1), segment.at(-1)));
      if (index < 0) break;
      const segment = remaining.splice(index, 1)[0];
      if (samePoint(ring.at(-1), segment.at(-1))) segment.reverse();
      ring.push(...segment.slice(1));
    }
    if (ring.length > 3 && samePoint(ring[0], ring.at(-1))) rings.push(ring);
  }
  return rings;
}

for (const [tag, lat, lng] of places) {
  const outputUrl = new URL(`${tag}.json`, outputDirectory);
  if (await readFile(outputUrl, "utf8").then(() => true).catch(() => false)) continue;
  if (previous?.places[tag]) {
    await writeFile(outputUrl, `${JSON.stringify({ source, place: previous.places[tag] })}\n`);
    console.log(tag, "migrated");
    continue;
  }
  const roadRadius = tag === "HBT" ? 1300 : 2200;
  const buildingRadius = tag === "HBT" ? 700 : 1100;
  const waterRadius = tag === "HBT" ? 1400 : 2400;
  const query = `[out:json][timeout:90];(
    way(around:${roadRadius},${lat},${lng})[highway][name];
    way(around:${buildingRadius},${lat},${lng})[building];
    way(around:${waterRadius},${lat},${lng})[natural=water];
    way(around:${waterRadius},${lat},${lng})[water];
    way(around:${waterRadius},${lat},${lng})[waterway];
    way(around:${waterRadius},${lat},${lng})[natural=coastline];
    relation(around:${waterRadius},${lat},${lng})[natural=water];
    relation(around:${waterRadius},${lat},${lng})[water];
    relation(around:${waterRadius},${lat},${lng})[waterway];
    node(around:${roadRadius},${lat},${lng})[place~"suburb|neighbourhood|locality"][name];
  );out tags geom;`;
  let response, lastError;
  for (const endpoint of endpoints) {
    try {
      response = await fetch(endpoint, { method: "POST", headers: {
        "content-type": "application/x-www-form-urlencoded;charset=UTF-8",
        "user-agent": "new-zealand-slow-trip-2026 town-map snapshot",
      }, body: new URLSearchParams({ data: query }), signal: AbortSignal.timeout(45000) });
      if (response.ok) break;
    } catch (error) { lastError = error; }
  }
  if (!response?.ok) throw new Error(`${tag}: Overpass ${response?.status ?? lastError?.message}`);
  const payload = await response.json();
  const roads = [], buildings = [], water = [], labels = [];
  for (const element of payload.elements) {
    if (element.type === "node") {
      labels.push({ id: element.id, name: element.tags?.name, kind: element.tags?.place,
        position: [element.lat, element.lon] });
      continue;
    }
    if (element.type === "relation") {
      const rings = relationRings(element.members ?? []);
      if (!rings.length) continue;
      water.push({ id: `r${element.id}`, name: element.tags?.name ?? null,
        kind: element.tags?.waterway ?? element.tags?.water ?? element.tags?.natural,
        rings, closed: true });
      continue;
    }
    if (!element.geometry?.length) continue;
    const coordinates = element.geometry.map(point => [point.lon, point.lat]);
    if (element.tags?.highway) roads.push({ id: element.id, name: element.tags.name,
      kind: element.tags.highway, coordinates });
    else if (element.tags?.building) buildings.push({ id: element.id, coordinates });
    else water.push({ id: element.id, name: element.tags?.name ?? null,
      kind: element.tags?.natural === "coastline" ? "coastline" :
        element.tags?.waterway ?? element.tags?.water ?? element.tags?.natural, coordinates,
      closed: coordinates.length > 2 && coordinates[0][0] === coordinates.at(-1)[0]
        && coordinates[0][1] === coordinates.at(-1)[1] });
  }
  const place = { center: [lat, lng], roads, buildings, water, labels };
  await writeFile(outputUrl, `${JSON.stringify({ source, place })}\n`);
  console.log(tag, { roads: roads.length, buildings: buildings.length, water: water.length, labels: labels.length });
}
