export const maxItems = 500;
export const maxMediaBytes = 512 * 1024 * 1024;
export const maxExpandedBytes = 1024 * 1024 * 1024;
export const maxArchiveBytes = 1024 * 1024 * 1024;
export const maxManifestBytes = 4 * 1024 * 1024;
export const maxLibraryBytes = maxExpandedBytes - 16 * 1024 * 1024;
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const hashPattern = /^[0-9a-f]{64}$/;
const knownPlaces = new Set(["ZQN", "WKA", "AOR", "TEK", "OAM", "CHC", "AKC", "HBT"]);

export async function hashBlob(blob) {
  const digest = await crypto.subtle.digest("SHA-256", await blob.arrayBuffer());
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function validDate(value) {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}T/.test(value)
    && !Number.isNaN(Date.parse(value)) && new Date(value).toISOString() === value;
}

function nullableDate(value) {
  return value === null || validDate(value);
}

function validLocalDateTime(value) {
  if (value === null) return true;
  const match = typeof value === "string" && value.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})$/);
  if (!match) return false;
  const [, year, month, day, hour, minute, second] = match.map(Number);
  const date = new Date(Date.UTC(year, month - 1, day, hour, minute, second));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day
    && date.getUTCHours() === hour && date.getUTCMinutes() === minute && date.getUTCSeconds() === second;
}

function validPlace(value) {
  return value === null || value === "unassigned" || knownPlaces.has(value);
}

export function validateRecord(source) {
  if (!source || typeof source !== "object" || Array.isArray(source)) throw new Error("archive-invalid-record");
  const { id, contentHash, kind, mimeType, originalName, size, photographer, capturedAt,
    captureLocalTime = null, captureOffsetMinutes, captureTimeSource, gps, gpsSource,
    addedAt, provenance, manualPlaceTag, autoPlaceTag, favorite = false } = source;
  if (!uuidPattern.test(id) || !hashPattern.test(contentHash) || !["image", "video"].includes(kind)
    || typeof mimeType !== "string" || !mimeType.startsWith(`${kind}/`)
    || typeof originalName !== "string" || !originalName || originalName.length > 255 || /[\x00-\x1f/\\]/.test(originalName)
    || !Number.isSafeInteger(size) || size <= 0 || size > maxMediaBytes
    || !photographer || !uuidPattern.test(photographer.id)
    || typeof photographer.nickname !== "string" || photographer.nickname.length > 60
    || !nullableDate(capturedAt) || !validDate(addedAt)
    || !validLocalDateTime(captureLocalTime)
    || (captureOffsetMinutes !== null && (!Number.isInteger(captureOffsetMinutes) || Math.abs(captureOffsetMinutes) > 14 * 60))
    || !["camera", "exif", "unknown"].includes(captureTimeSource)
    || !["camera", "exif", "unknown"].includes(gpsSource)
    || !["capture", "upload", "archive"].includes(provenance)
    || typeof favorite !== "boolean"
    || !validPlace(manualPlaceTag) || !validPlace(autoPlaceTag)) throw new Error("archive-invalid-record");
  if (gps !== null && (!gps || !Number.isFinite(gps.lat) || !Number.isFinite(gps.lng)
    || gps.lat < -90 || gps.lat > 90 || gps.lng < -180 || gps.lng > 180
    || (gps.accuracyMeters !== null && (!Number.isFinite(gps.accuracyMeters) || gps.accuracyMeters < 0)))) throw new Error("archive-invalid-gps");
  return { id, contentHash, kind, mimeType, originalName, size,
    photographer: { id: photographer.id, nickname: photographer.nickname }, capturedAt,
    captureLocalTime, captureOffsetMinutes, captureTimeSource,
    gps: gps && { lat: gps.lat, lng: gps.lng, accuracyMeters: gps.accuracyMeters },
    gpsSource, addedAt, provenance, manualPlaceTag, autoPlaceTag, favorite };
}

export function metadataKey(record) {
  const { id, favorite, ...metadata } = record;
  return JSON.stringify(metadata);
}

export function repeatedUploadKey(record) {
  const { addedAt, ...metadata } = record;
  return metadataKey(metadata);
}
