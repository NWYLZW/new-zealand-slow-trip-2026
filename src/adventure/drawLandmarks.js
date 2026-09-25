import { adventureStops } from "./adventureData";
import { landmarkAssets } from "./landmarkAssets";
import { MAP_ART_SCALE } from "./artScale";

export function drawLandmarks(world, project, scale) {
  const layer = world.append("g").attr("class", "trip-landmarks").attr("pointer-events", "none");
  const placements = landmarkAssets.flatMap((asset) => {
    const stop = adventureStops.find((item) => item.tag === asset.stopTag);
    if (!stop) return [];
    const [x, y] = project([stop.position[1], stop.position[0]]);
    return [{ asset, x, y }];
  });
  // Distant cutouts are painted first; nearer lake shores remain in front.
  placements.sort((a, b) => a.y - b.y).forEach(({ asset, x, y }) => {
    const width = asset.worldWidth * scale * MAP_ART_SCALE;
    const height = width * asset.pixelHeight / asset.pixelWidth;
    layer.append("image")
      .attr("class", "trip-landmark")
      .attr("data-landmark", asset.id)
      .attr("data-stop", asset.stopTag)
      .attr("data-anchor-x", asset.anchor[0])
      .attr("data-anchor-y", asset.anchor[1])
      .attr("href", asset.src)
      .attr("x", x - width * asset.anchor[0])
      .attr("y", y - height * asset.anchor[1])
      .attr("width", width)
      .attr("height", height)
      .attr("preserveAspectRatio", "xMidYMid meet")
      .attr("role", "img")
      .attr("aria-label", asset.alt);
  });
}
