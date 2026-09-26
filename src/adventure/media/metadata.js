import exifr from "exifr";

const imageTypes = new Map([
  ["jpeg", "image/jpeg"], ["png", "image/png"], ["webp", "image/webp"],
  ["gif", "image/gif"], ["avif", "image/avif"], ["heic", "image/heic"], ["heif", "image/heif"],
]);

function ascii(bytes, start, length) {
  return String.fromCharCode(...bytes.slice(start, start + length));
}

export async function inspectMediaBlob(blob) {
  if (!(blob instanceof Blob)) throw new Error("media-invalid-blob");
  const bytes = new Uint8Array(await blob.slice(0, 32).arrayBuffer());
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return { kind: "image", mimeType: "image/jpeg" };
  if (ascii(bytes, 0, 8) === "\x89PNG\r\n\x1a\n") return { kind: "image", mimeType: "image/png" };
  if (ascii(bytes, 0, 4) === "RIFF" && ascii(bytes, 8, 4) === "WEBP") return { kind: "image", mimeType: "image/webp" };
  if (ascii(bytes, 0, 6) === "GIF87a" || ascii(bytes, 0, 6) === "GIF89a") return { kind: "image", mimeType: "image/gif" };
  if (bytes[0] === 0x1a && bytes[1] === 0x45 && bytes[2] === 0xdf && bytes[3] === 0xa3) return { kind: "video", mimeType: "video/webm" };
  if (ascii(bytes, 4, 4) === "ftyp") {
    const brand = ascii(bytes, 8, 4).trim();
    if (imageTypes.has(brand)) return { kind: "image", mimeType: imageTypes.get(brand) };
    if (["heix", "hevc", "heim", "heis", "mif1"].includes(brand)) return { kind: "image", mimeType: "image/heic" };
    if (["qt", "qt  "].includes(brand)) return { kind: "video", mimeType: "video/quicktime" };
    if (["isom", "iso2", "mp41", "mp42", "avc1", "M4V", "M4V ", "3gp4"].includes(brand)) return { kind: "video", mimeType: "video/mp4" };
  }
  throw new Error("media-unsupported-type");
}

function parseOffset(text) {
  const match = typeof text === "string" && text.match(/^([+-])(\d{2}):(\d{2})$/);
  if (!match) return null;
  const minutes = Number(match[2]) * 60 + Number(match[3]);
  return minutes <= 14 * 60 ? (match[1] === "+" ? 1 : -1) * minutes : null;
}

function parseExifLocalTime(value) {
  const match = typeof value === "string" && value.match(/^(\d{4}):(\d{2}):(\d{2}) (\d{2}):(\d{2}):(\d{2})$/);
  if (!match) return null;
  const [, year, month, day, hour, minute, second] = match.map(Number);
  const date = new Date(Date.UTC(year, month - 1, day, hour, minute, second));
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day
    || date.getUTCHours() !== hour || date.getUTCMinutes() !== minute || date.getUTCSeconds() !== second) return null;
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}T${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}:${String(second).padStart(2, "0")}`;
}

export async function embeddedMetadata(blob, kind) {
  const result = { capturedAt: null, captureLocalTime: null, captureOffsetMinutes: null,
    captureTimeSource: "unknown", gps: null, gpsSource: "unknown", photographerName: null };
  if (kind !== "image") return result;
  let exif;
  try {
    exif = await exifr.parse(blob, { tiff: true, exif: true, gps: true, xmp: true,
      ifd1: false, iptc: false, icc: false, reviveValues: false });
  } catch { /* Unsupported or malformed metadata remains unknown. */ }
  if (exif) {
    const author = Array.isArray(exif?.Creator) ? exif.Creator[0] : exif?.Artist ?? exif?.Creator;
    if (typeof author === "string" && author.trim()) result.photographerName = author.trim().slice(0, 60);
    const localTime = parseExifLocalTime(exif?.DateTimeOriginal);
    if (localTime) {
      result.captureLocalTime = localTime;
      result.captureTimeSource = "exif";
      const offset = parseOffset(exif.OffsetTimeOriginal);
      if (offset !== null) {
        result.captureOffsetMinutes = offset;
        result.capturedAt = new Date(Date.parse(`${localTime}Z`) - offset * 60000).toISOString();
      }
    }
  }
  try {
    const coordinates = await exifr.gps(blob);
    const lat = coordinates?.latitude, lng = coordinates?.longitude;
    if (Number.isFinite(lat) && Number.isFinite(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
      const accuracy = Number(exif?.GPSHPositioningError);
      result.gps = { lat, lng, accuracyMeters: Number.isFinite(accuracy) && accuracy >= 0 ? accuracy : null };
      result.gpsSource = "exif";
    }
  } catch { /* No embedded GPS is not the uploader's location. */ }
  return result;
}
