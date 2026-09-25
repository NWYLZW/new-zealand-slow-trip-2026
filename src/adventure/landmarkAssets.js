import { assetPath } from "../assets";
import illustrations from "./data/landmarks.json";

// Geometry, sizing and provenance have one data source shared with the audit.
export const landmarkAssets = illustrations.map((asset) => ({
  ...asset,
  src: assetPath(`images/adventure/${asset.file}`),
}));
