import { readArchive, makeArchive } from "./archive";
import { hashBlob, maxItems, maxLibraryBytes, maxMediaBytes, metadataKey, repeatedUploadKey, validateRecord } from "./format";
import { embeddedMetadata, inspectMediaBlob } from "./metadata";
import { isKnownPlaceTag, listMediaForPlace as filterMediaForPlace, nearbyPlaceTag } from "./places";

const databaseName = "nz-slow-trip-local-media";
const databaseVersion = 1;
const listeners = new Set();
let snapshot = { status: "idle", items: [], identity: null, error: null };
let databasePromise;
let initializePromise;
let writeTail = Promise.resolve();
let changeChannel;

function signalOtherTabs() {
  changeChannel?.postMessage("changed");
}

function publish(change) {
  snapshot = { ...snapshot, ...change };
  for (const listener of listeners) listener(snapshot);
  return snapshot;
}

function requestResult(request) {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function transactionDone(transaction) {
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onabort = () => reject(transaction.error ?? new Error("storage-transaction-aborted"));
    transaction.onerror = () => reject(transaction.error ?? new Error("storage-transaction-failed"));
  });
}

function openDatabase() {
  if (databasePromise) return databasePromise;
  databasePromise = new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") { reject(new Error("storage-unavailable")); return; }
    const request = indexedDB.open(databaseName, databaseVersion);
    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains("items")) database.createObjectStore("items", { keyPath: "id" });
      if (!database.objectStoreNames.contains("blobs")) database.createObjectStore("blobs", { keyPath: "id" });
      if (!database.objectStoreNames.contains("settings")) database.createObjectStore("settings", { keyPath: "key" });
    };
    request.onsuccess = () => {
      const database = request.result;
      database.onversionchange = () => database.close();
      if (!changeChannel && typeof BroadcastChannel !== "undefined") {
        changeChannel = new BroadcastChannel(`${databaseName}-changes`);
        changeChannel.onmessage = () => { refreshMediaLibrary().catch(() => {}); };
      }
      resolve(database);
    };
    request.onerror = () => reject(request.error ?? new Error("storage-unavailable"));
    request.onblocked = () => reject(new Error("storage-blocked"));
  }).catch((error) => { databasePromise = null; throw error; });
  return databasePromise;
}

function errorCode(error) {
  return error?.name === "QuotaExceededError" ? "storage-quota-exceeded" : error?.message ?? "storage-error";
}

function handleError(error) {
  publish({ status: "error", error: errorCode(error) });
  throw error;
}

function queueWrite(operation) {
  const running = writeTail.then(operation);
  writeTail = running.catch(() => {});
  return running.catch(handleError);
}

function newIdentity() {
  return { id: crypto.randomUUID(), nickname: "本机摄影者" };
}

async function sourcePhotographer(contentHash, name) {
  const digest = new Uint8Array(await crypto.subtle.digest("SHA-256",
    new TextEncoder().encode(`${contentHash}\n${name || "unknown"}`)));
  const bytes = digest.slice(0, 16);
  bytes[6] = (bytes[6] & 0x0f) | 0x50;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
  return { id: `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`,
    nickname: name || "" };
}

export function getMediaSnapshot() {
  return snapshot;
}

export function subscribeMediaLibrary(listener) {
  listeners.add(listener);
  listener(snapshot);
  return () => listeners.delete(listener);
}

export function initializeMediaLibrary() {
  if (snapshot.status === "ready") return Promise.resolve(snapshot);
  if (initializePromise) return initializePromise;
  publish({ status: "loading", error: null });
  initializePromise = (async () => {
    const database = await openDatabase();
    const transaction = database.transaction("items", "readonly");
    const done = transactionDone(transaction);
    const itemsRequest = requestResult(transaction.objectStore("items").getAll());
    const items = await itemsRequest;
    await done;
    const identityTransaction = database.transaction("settings", "readwrite");
    const identityDone = transactionDone(identityTransaction);
    const identityStore = identityTransaction.objectStore("settings");
    let identity;
    const identityRequest = identityStore.get("identity");
    identityRequest.onsuccess = () => {
      identity = identityRequest.result?.value ?? newIdentity();
      if (!identityRequest.result) identityStore.put({ key: "identity", value: identity });
    };
    await identityDone;
    return publish({ status: "ready", items: items.sort((a, b) => b.addedAt.localeCompare(a.addedAt)), identity, error: null });
  })().catch(handleError).finally(() => { initializePromise = null; });
  return initializePromise;
}

async function readCurrentItems() {
  const database = await openDatabase();
  const transaction = database.transaction("items", "readonly");
  const done = transactionDone(transaction);
  const items = await requestResult(transaction.objectStore("items").getAll());
  await done;
  return items.sort((a, b) => b.addedAt.localeCompare(a.addedAt));
}

async function readCurrentIdentity() {
  const database = await openDatabase();
  const transaction = database.transaction("settings", "readonly");
  const done = transactionDone(transaction);
  const row = await requestResult(transaction.objectStore("settings").get("identity"));
  await done;
  return row?.value ?? snapshot.identity;
}

export async function refreshMediaLibrary() {
  await initializeMediaLibrary();
  const [items, identity] = await Promise.all([readCurrentItems(), readCurrentIdentity()]);
  if (JSON.stringify(items) !== JSON.stringify(snapshot.items)
    || JSON.stringify(identity) !== JSON.stringify(snapshot.identity)) publish({ status: "ready", items, identity, error: null });
  return snapshot;
}

async function writeWithCurrentItems(operation) {
  const database = await openDatabase();
  const transaction = database.transaction(["items", "blobs"], "readwrite");
  const done = transactionDone(transaction);
  const itemStore = transaction.objectStore("items");
  const blobStore = transaction.objectStore("blobs");
  let result, operationError;
  const currentRequest = itemStore.getAll();
  currentRequest.onsuccess = () => {
    try { result = operation(currentRequest.result, itemStore, blobStore); }
    catch (error) { operationError = error; transaction.abort(); }
  };
  try { await done; } catch (error) { throw operationError ?? error; }
  return result;
}

function normalizedGps(gps) {
  if (gps == null) return null;
  const lat = Number(gps.lat ?? gps.latitude), lng = Number(gps.lng ?? gps.longitude);
  const accuracyValue = gps.accuracyMeters ?? gps.accuracy ?? null;
  const accuracyMeters = accuracyValue == null ? null : Number(accuracyValue);
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180
    || (accuracyMeters !== null && (!Number.isFinite(accuracyMeters) || accuracyMeters < 0))) throw new Error("media-invalid-gps");
  return { lat, lng, accuracyMeters };
}

function normalizedTimestamp(value) {
  if (value == null) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) throw new Error("media-invalid-capture-time");
  return date.toISOString();
}

async function saveMedia({ blob, originalName, provenance, capturedAt = null, captureLocalTime = null,
  captureOffsetMinutes = null, captureTimeSource = "unknown", gps = null, gpsSource = "unknown",
  photographerName = null }) {
  await refreshMediaLibrary();
  if (!(blob instanceof Blob) || blob.size <= 0 || blob.size > maxMediaBytes) throw new Error("media-invalid-size");
  const type = await inspectMediaBlob(blob);
  const contentHash = await hashBlob(blob);
  const identity = provenance === "upload" ? await sourcePhotographer(contentHash, photographerName) : snapshot.identity;
  const normalizedLocation = normalizedGps(gps);
  const record = validateRecord({ id: crypto.randomUUID(), contentHash, kind: type.kind,
    mimeType: type.mimeType, originalName: String(originalName || `capture-${crypto.randomUUID()}`).slice(0, 255).replace(/[\x00-\x1f/\\]/g, "_"),
    size: blob.size, photographer: { id: identity.id, nickname: identity.nickname },
    capturedAt: normalizedTimestamp(capturedAt), captureLocalTime, captureOffsetMinutes,
    captureTimeSource, gps: normalizedLocation, gpsSource, addedAt: new Date().toISOString(),
    provenance, manualPlaceTag: null, autoPlaceTag: nearbyPlaceTag(normalizedLocation) });
  return queueWrite(async () => {
    const outcome = await writeWithCurrentItems((items, itemStore, blobStore) => {
      const duplicate = items.find((item) => item.contentHash === record.contentHash && repeatedUploadKey(item) === repeatedUploadKey(record));
      if (duplicate) return { status: "duplicate", item: duplicate, items };
      if (items.length >= maxItems) throw new Error("media-library-full");
      if (items.reduce((total, item) => total + item.size, blob.size) > maxLibraryBytes) throw new Error("media-library-size-limit");
      itemStore.put(record);
      blobStore.put({ id: record.id, blob });
      return { status: "added", item: record, items: [record, ...items] };
    });
    const items = outcome.items.sort((a, b) => b.addedAt.localeCompare(a.addedAt));
    if (outcome.status === "added" || JSON.stringify(items) !== JSON.stringify(snapshot.items))
      publish({ status: "ready", items, error: null });
    if (outcome.status === "added") signalOtherTabs();
    return { status: outcome.status, item: outcome.item };
  });
}

export function saveCapturedMedia({ blob, capturedAt = null, captureOffsetMinutes = null, gps = null }) {
  if (capturedAt !== null && (captureOffsetMinutes === null || !Number.isInteger(captureOffsetMinutes)
    || Math.abs(captureOffsetMinutes) > 14 * 60)) throw new Error("media-invalid-capture-offset");
  return saveMedia({ blob, originalName: blob?.name, provenance: "capture", capturedAt,
    captureOffsetMinutes, captureTimeSource: capturedAt ? "camera" : "unknown", gps,
    gpsSource: gps ? "camera" : "unknown" });
}

export async function saveUploadedMedia(file) {
  if (!(file instanceof Blob)) throw new Error("media-invalid-blob");
  if (file.size <= 0 || file.size > maxMediaBytes) throw new Error("media-invalid-size");
  const { kind } = await inspectMediaBlob(file);
  const metadata = await embeddedMetadata(file, kind);
  return saveMedia({ blob: file, originalName: file.name, provenance: "upload", ...metadata });
}

export async function getMediaBlob(id) {
  await initializeMediaLibrary();
  const database = await openDatabase();
  const transaction = database.transaction("blobs", "readonly");
  const done = transactionDone(transaction);
  const row = await requestResult(transaction.objectStore("blobs").get(id));
  await done;
  return row?.blob ?? null;
}

export function setLocalNickname(nickname) {
  const value = String(nickname ?? "").trim();
  if (!value || value.length > 60) return Promise.reject(new Error("media-invalid-nickname"));
  return queueWrite(async () => {
    await initializeMediaLibrary();
    const identity = { ...snapshot.identity, nickname: value };
    const database = await openDatabase();
    const transaction = database.transaction("settings", "readwrite");
    const done = transactionDone(transaction);
    transaction.objectStore("settings").put({ key: "identity", value: identity });
    await done;
    publish({ status: "ready", identity, error: null });
    signalOtherTabs();
    return identity;
  });
}

export function updateMediaMetadata(id, patch) {
  return queueWrite(async () => {
    await initializeMediaLibrary();
    const outcome = await writeWithCurrentItems((items, itemStore) => {
      const current = items.find((item) => item.id === id);
      if (!current) throw new Error("media-not-found");
      const next = { ...current };
      if (Object.hasOwn(patch, "photographerName")) {
        const nickname = String(patch.photographerName ?? "").trim();
        if (nickname.length > 60) throw new Error("media-invalid-nickname");
        next.photographer = { ...current.photographer, nickname };
      }
      if (Object.hasOwn(patch, "manualPlaceTag")) {
        const tag = patch.manualPlaceTag;
        if (tag !== null && tag !== "unassigned" && !isKnownPlaceTag(tag)) throw new Error("media-invalid-place");
        next.manualPlaceTag = tag;
      }
      if (Object.hasOwn(patch, "favorite")) {
        if (typeof patch.favorite !== "boolean") throw new Error("media-invalid-favorite");
        next.favorite = patch.favorite;
      }
      itemStore.put(next);
      return { item: next, items: items.map((item) => item.id === id ? next : item) };
    });
    publish({ status: "ready", items: outcome.items.sort((a, b) => b.addedAt.localeCompare(a.addedAt)), error: null });
    signalOtherTabs();
    return outcome.item;
  });
}

export function deleteMediaItem(id) {
  if (typeof id !== "string" || !id) return Promise.reject(new Error("media-invalid-id"));
  return queueWrite(async () => {
    await initializeMediaLibrary();
    const outcome = await writeWithCurrentItems((items, itemStore, blobStore) => {
      const exists = items.some(item => item.id === id);
      itemStore.delete(id);
      blobStore.delete(id);
      return { removed: exists, items: items.filter(item => item.id !== id) };
    });
    publish({ status: "ready", items: outcome.items.sort((a, b) => b.addedAt.localeCompare(a.addedAt)), error: null });
    signalOtherTabs();
    return outcome.removed;
  });
}

export async function exportMediaArchive() {
  await initializeMediaLibrary();
  const [items, identity] = await Promise.all([readCurrentItems(), readCurrentIdentity()]);
  if (JSON.stringify(items) !== JSON.stringify(snapshot.items)
    || JSON.stringify(identity) !== JSON.stringify(snapshot.identity)) publish({ status: "ready", items, identity, error: null });
  return makeArchive(items, getMediaBlob, identity);
}

export async function importMediaArchive(file) {
  const archive = await readArchive(file);
  return queueWrite(async () => {
    await initializeMediaLibrary();
    const outcome = await writeWithCurrentItems((existing, itemStore, blobStore) => {
      const additions = [];
      let duplicates = 0, metadataConflicts = 0;
      for (const incoming of archive.records) {
        const staged = additions.map(({ item }) => item);
        const matchingId = [...existing, ...staged].find((item) => item.id === incoming.id);
        const exact = [...existing, ...staged].find((item) => item.contentHash === incoming.contentHash
          && metadataKey(item) === metadataKey(incoming));
        if (exact) { duplicates++; continue; }
        const sameContent = [...existing, ...staged].some((item) => item.contentHash === incoming.contentHash);
        const item = matchingId ? { ...incoming, id: crypto.randomUUID() } : incoming;
        if (matchingId || sameContent) metadataConflicts++;
        additions.push({ item, blob: archive.blobs.get(incoming.id) });
      }
      if (existing.length + additions.length > maxItems) throw new Error("media-library-full");
      if ([...existing, ...additions.map(({ item }) => item)].reduce((total, item) => total + item.size, 0) > maxLibraryBytes)
        throw new Error("media-library-size-limit");
      for (const { item, blob } of additions) {
        itemStore.put(item);
        blobStore.put({ id: item.id, blob });
      }
      return { imported: additions.length, duplicates, metadataConflicts,
        items: [...additions.map(({ item }) => item), ...existing] };
    });
    const items = outcome.items.sort((a, b) => b.addedAt.localeCompare(a.addedAt));
    if (outcome.imported || JSON.stringify(items) !== JSON.stringify(snapshot.items))
      publish({ status: "ready", items, error: null });
    if (outcome.imported) signalOtherTabs();
    return { imported: outcome.imported, duplicates: outcome.duplicates, metadataConflicts: outcome.metadataConflicts };
  });
}

export function listMediaForPlace(placeTag, items = snapshot.items) {
  return filterMediaForPlace(placeTag, items);
}
