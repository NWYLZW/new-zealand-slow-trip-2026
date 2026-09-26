import { mapStops, northDays, southDays } from "../tripData";
import { placePositions } from "../data/mapRoutes";

const stopLayout = [
  ["ZQN", [-35, 25]], ["WKA", [-35, -22]], ["AOR", [-29, -24]],
  ["TEK", [35, 10]], ["OAM", [32, 25]], ["CHC", [29, 14]],
  ["AKC", [-30, -20]], ["HBT", [30, 10]],
];

export const adventureStops = stopLayout.map(([tag, offset]) => ({
  ...mapStops.find((stop) => stop.tag === tag), offset,
  // The city overnight is the driving destination; flights remain schematic.
  ...(tag === "CHC" ? { position: [placePositions.christchurchCbd.lat, placePositions.christchurchCbd.lng] } : {}),
}));
export const adventureDays = [...southDays, ...northDays];
export const sketchOptions = { seed: 23, roughness: 0.8, boil: 0.08 };
