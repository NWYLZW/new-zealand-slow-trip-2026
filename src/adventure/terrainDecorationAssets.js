import { assetPath } from "../assets";
import terrainDecorations from "./data/terrainDecorations.json";

// Each asset is one transparent bitmap plant. Optimized PNGs ship with the map;
// original filenames and SHA-256 provenance live in terrainDecorations.json.
export const terrainDecorationAssets = terrainDecorations.assets.map((asset) => ({
  ...asset,
  src: assetPath(`images/adventure/terrain/${asset.file}`),
}));
