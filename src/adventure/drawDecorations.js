import { decorationAssets } from "./decorationAssets";
import { MAP_ART_SCALE } from "./artScale";

export function drawDecorations(world, project, scale) {
  const layer = world.append("g")
    .attr("class", "trip-decorations")
    .attr("pointer-events", "none");

  decorationAssets.forEach((asset) => {
    const [baseX, baseY] = project(asset.position);
    // Optional display offsets are for other atmosphere art; Milford stays at its geographic anchor.
    const x = baseX + (asset.offsetWorld?.[0] ?? 0) * scale;
    const y = baseY + (asset.offsetWorld?.[1] ?? 0) * scale;
    // Keep tiny map cutouts legible when the whole island map fits a phone.
    const width = Math.max(asset.worldWidth * scale, asset.minPixels ?? 0) * MAP_ART_SCALE;
    const height = width * asset.pixelHeight / asset.pixelWidth;
    // Small plants and fruit are map accents, not giant foreground objects at 12×.
    const maxScreenWidth = asset.kind.includes("plant") ? 36
      : asset.kind === "regional-fruit-illustration" ? 44 : 0;
    layer.append("image")
      .attr("class", "trip-decoration")
      .attr("data-decoration", asset.id)
      .attr("data-regional", asset.source.originalSha256 ? "true" : null)
      .attr("data-kind", asset.kind)
      .attr("data-base-width", width)
      .attr("data-aspect-ratio", asset.pixelHeight / asset.pixelWidth)
      .attr("data-anchor-x", x)
      .attr("data-anchor-y", y)
      .attr("data-anchor-fraction-x", asset.anchor[0])
      .attr("data-anchor-fraction-y", asset.anchor[1])
      .attr("data-max-screen-width", maxScreenWidth)
      .attr("href", asset.src)
      .attr("x", x - width * asset.anchor[0])
      .attr("y", y - height * asset.anchor[1])
      .attr("width", width)
      .attr("height", height)
      .attr("preserveAspectRatio", "xMidYMid meet")
      .attr("pointer-events", "none")
      .attr("role", "img")
      .attr("aria-label", asset.alt);
  });
}

// A fitted island map compresses several geographic decorations into the same
// few pixels as the fixed-size stop buttons and labels. Hide only the images
// whose actual screen rectangles would cover those controls. The selection is
// deterministic for a given view and all images return at ordinary zoom.
export function updateDecorationVisibility(area, zoomScale) {
  const images = [...area.querySelectorAll(".trip-decoration")];
  images.forEach((image) => {
    image.style.display = "";
    const baseWidth = Number(image.dataset.baseWidth);
    const maxScreenWidth = Number(image.dataset.maxScreenWidth);
    if (!maxScreenWidth) return;
    const width = Math.min(baseWidth, maxScreenWidth / zoomScale);
    const height = width * Number(image.dataset.aspectRatio);
    image.setAttribute("x", Number(image.dataset.anchorX) - width * Number(image.dataset.anchorFractionX));
    image.setAttribute("y", Number(image.dataset.anchorY) - height * Number(image.dataset.anchorFractionY));
    image.setAttribute("width", width);
    image.setAttribute("height", height);
  });
  if (zoomScale >= 1.4) return;

  const stopRects = [...area.querySelectorAll(".trip-stop, .trip-stop-label")]
    .map((element) => element.getBoundingClientRect());
  const gap = 2;
  const intersects = (a, b) => a.left < b.right + gap && a.right + gap > b.left &&
    a.top < b.bottom + gap && a.bottom + gap > b.top;
  const imageRects = images.map((image) => image.getBoundingClientRect());
  images.forEach((image, index) => {
    if (stopRects.some((rect) => intersects(imageRects[index], rect))) {
      image.style.display = "none";
    }
  });
}
