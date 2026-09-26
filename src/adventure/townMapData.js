const loaders = {
  ZQN: () => import("./data/town-maps/ZQN.json"),
  WKA: () => import("./data/town-maps/WKA.json"),
  AOR: () => import("./data/town-maps/AOR.json"),
  TEK: () => import("./data/town-maps/TEK.json"),
  OAM: () => import("./data/town-maps/OAM.json"),
  CHC: () => import("./data/town-maps/CHC.json"),
  AKC: () => import("./data/town-maps/AKC.json"),
  HBT: () => import("./data/town-maps/HBT.json"),
};

const cache = new Map();

export const townMapCoverages = [
  { tag: "ZQN", position: [-45.0312, 168.6626], radiusMeters: 2400 },
  { tag: "WKA", position: [-44.698, 169.136], radiusMeters: 2400 },
  { tag: "AOR", position: [-43.735, 170.0967], radiusMeters: 2400 },
  { tag: "TEK", position: [-44.0047, 170.4771], radiusMeters: 2400 },
  { tag: "OAM", position: [-45.0966, 170.9714], radiusMeters: 2400 },
  { tag: "CHC", position: [-43.5321, 172.6362], radiusMeters: 2400 },
  { tag: "AKC", position: [-36.8509, 174.7645], radiusMeters: 2400 },
  { tag: "HBT", position: [-37.8576, 175.6792], radiusMeters: 1400 },
];

export function loadTownMapData(tag) {
  const loader = loaders[tag];
  if (!loader) return Promise.resolve(null);
  if (!cache.has(tag)) {
    cache.set(tag, loader().then(module => ({
      source: module.default.source,
      status: module.default.status,
      place: module.default.place ?? { roads: [], buildings: [], water: [], labels: [] },
    })));
  }
  return cache.get(tag);
}
