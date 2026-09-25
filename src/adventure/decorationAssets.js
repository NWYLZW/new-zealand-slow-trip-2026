import { assetPath } from "../assets";
import illustrations from "./data/decorations.json";

// Separate from the eight real stops: these are non-interactive map atmosphere.
export const decorationAssets = illustrations.map((asset) => ({
  ...asset,
  src: assetPath(`images/adventure/${asset.file}`),
}));
