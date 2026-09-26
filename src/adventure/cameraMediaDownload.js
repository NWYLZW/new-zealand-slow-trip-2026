const extensions = new Map([
  ["image/jpeg", ".jpg"], ["image/png", ".png"], ["image/webp", ".webp"], ["image/gif", ".gif"],
  ["image/heic", ".heic"], ["image/heif", ".heif"], ["video/webm", ".webm"],
  ["video/mp4", ".mp4"], ["video/quicktime", ".mov"],
]);

export function mediaDownloadName(item) {
  const fallback = `media-${item.id || "download"}`;
  const name = String(item.originalName || fallback).replace(/[\x00-\x1f/\\]/g, "_").trim() || fallback;
  if (/\.[a-z0-9]{1,8}$/i.test(name)) return name;
  return `${name}${extensions.get(String(item.mimeType || "").toLowerCase()) || ""}`;
}

export async function downloadMediaBlob(item, getBlob, {
  documentObject = document, urlObject = URL, schedule = setTimeout,
} = {}) {
  const blob = await getBlob(item.id);
  if (!blob) throw new Error("media-blob-not-found");
  const url = urlObject.createObjectURL(blob);
  try {
    const anchor = documentObject.createElement("a");
    anchor.href = url;
    anchor.download = mediaDownloadName(item);
    documentObject.body.append(anchor);
    anchor.click();
    anchor.remove();
  } catch (error) {
    urlObject.revokeObjectURL(url);
    throw error;
  }
  schedule(() => urlObject.revokeObjectURL(url), 60_000);
  return true;
}
