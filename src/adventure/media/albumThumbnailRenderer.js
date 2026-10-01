import { thumbnailDimensions } from "./albumLoading.js";

// Decoders, temporary URLs and canvases are scoped to one cancellable job.
export function renderAlbumThumbnail(blob, item, signal) {
  return new Promise((resolve, reject) => {
    if (signal.aborted) { reject(new DOMException("Cancelled", "AbortError")); return; }
    const video = item.kind === "video";
    const media = document.createElement(video ? "video" : "img");
    const canvas = document.createElement("canvas");
    const url = URL.createObjectURL(blob);
    let settled = false;
    let encoding = false;
    const finish = (error, result) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      signal.removeEventListener("abort", abort);
      media.onload = media.onloadeddata = media.onerror = null;
      if (video) media.pause();
      media.removeAttribute("src");
      if (video) media.load();
      URL.revokeObjectURL(url);
      canvas.width = canvas.height = 0;
      if (error) reject(error);
      else resolve(result);
    };
    // toBlob cannot be cancelled. Keep its queue slot until the callback finishes.
    const abort = () => { if (!encoding) finish(new DOMException("Cancelled", "AbortError")); };
    const timer = setTimeout(() => finish(new Error("thumbnail-timeout")), 12_000);
    signal.addEventListener("abort", abort, { once: true });
    const draw = () => {
      if (settled) return;
      media.onload = media.onloadeddata = null;
      try {
        const size = thumbnailDimensions(video ? media.videoWidth : media.naturalWidth,
          video ? media.videoHeight : media.naturalHeight);
        canvas.width = size.width;
        canvas.height = size.height;
        const context = canvas.getContext("2d");
        if (!context) throw new Error("thumbnail-canvas-unavailable");
        context.drawImage(media, 0, 0, size.width, size.height);
        encoding = true;
        clearTimeout(timer);
        canvas.toBlob(result => {
          if (signal.aborted) finish(new DOMException("Cancelled", "AbortError"));
          else if (result?.size) finish(null, result);
          else finish(new Error("thumbnail-encode-failed"));
        }, "image/webp", .8);
      } catch (error) { finish(error); }
    };
    media.onerror = () => finish(new Error("thumbnail-decode-failed"));
    if (video) {
      media.preload = "auto";
      media.muted = true;
      media.playsInline = true;
      media.onloadeddata = draw;
    } else {
      media.decoding = "async";
      media.onload = draw;
    }
    media.src = url;
  });
}
