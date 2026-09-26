import { adventureStops } from "./adventureData";
import { getAdventureWaypoint } from "./adventureWaypoints";
import { getInternationalMapNode } from "./internationalMapData";

export function getMapNode(key) {
  if (typeof key !== "string") return null;
  const id = key.slice(2);
  if (key.startsWith("p:")) {
    const record = adventureStops.find(stop => stop.tag === id);
    return record ? { key, id, kind: "place", record } : null;
  }
  if (key.startsWith("w:")) {
    const record = getAdventureWaypoint(id);
    return record ? { key, id, kind: "waypoint", record } : null;
  }
  const international = getInternationalMapNode(key);
  if (international) {
    return { key, id: international.id, kind: international.kind === "international-airport" ? "airport" : "flight",
      record: international };
  }
  return null;
}

export function normalizeMapCluster(keys) {
  const list = typeof keys === "string" ? keys.split(",") : Array.isArray(keys) ? keys : [];
  const nodes = [...new Set(list)].map(getMapNode).filter(Boolean)
    .sort((a, b) => Number(b.kind === "place") - Number(a.kind === "place")
      || Number(b.kind === "airport") - Number(a.kind === "airport") || a.key.localeCompare(b.key));
  return nodes.length > 1 ? nodes.map(node => node.key) : [];
}
