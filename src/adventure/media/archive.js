import { BlobReader, BlobWriter, TextReader, ZipReader, ZipWriter } from "@zip.js/zip.js";
import { hashBlob, maxArchiveBytes, maxExpandedBytes, maxItems, maxLibraryBytes, maxManifestBytes, maxMediaBytes, validateRecord } from "./format";
import { inspectMediaBlob } from "./metadata";

const manifestName = "media-library.json";

async function extractBounded(entry, limit, mimeType, account) {
  const chunks = [];
  let size = 0;
  const writable = new WritableStream({
    write(chunk) {
      const bytes = chunk instanceof Uint8Array ? chunk : new Uint8Array(chunk);
      size += bytes.byteLength;
      account(bytes.byteLength);
      if (size > limit) throw new Error("archive-expanded-limit");
      chunks.push(bytes);
    },
  });
  await entry.getData(writable, { checkSignature: true, checkOverlappingEntry: true });
  return new Blob(chunks, { type: mimeType });
}

export async function makeArchive(records, getBlob, identity) {
  if (records.length > maxItems) throw new Error("archive-too-many-items");
  const writer = new ZipWriter(new BlobWriter("application/zip"));
  try {
    const manifest = { schemaVersion: 1, exportedAt: new Date().toISOString(),
      sourceIdentity: identity, records: records.map(validateRecord) };
    const manifestText = JSON.stringify(manifest);
    const manifestSize = new TextEncoder().encode(manifestText).length;
    if (manifestSize > maxManifestBytes) throw new Error("archive-manifest-too-large");
    await writer.add(manifestName, new TextReader(manifestText));
    let expanded = manifestSize;
    for (const record of records) {
      const blob = await getBlob(record.id);
      if (!blob || blob.size !== record.size) throw new Error("archive-missing-original");
      expanded += blob.size;
      if (expanded > maxExpandedBytes || expanded - manifestSize > maxLibraryBytes) throw new Error("archive-too-large");
      await writer.add(`media/${record.id}`, new BlobReader(blob), { level: 0 });
    }
    const result = await writer.close();
    if (result.size > maxArchiveBytes) throw new Error("archive-too-large");
    return result;
  } catch (error) {
    try { await writer.close(); } catch { /* Preserve the original failure. */ }
    throw error;
  }
}

export async function readArchive(file) {
  if (!(file instanceof Blob) || file.size <= 0 || file.size > maxArchiveBytes) throw new Error("archive-invalid-size");
  const reader = new ZipReader(new BlobReader(file));
  try {
    const entries = [];
    for await (const entry of reader.getEntriesGenerator()) {
      entries.push(entry);
      if (entries.length > maxItems + 1) throw new Error("archive-invalid-entry-count");
    }
    if (entries.length < 1 || entries.length > maxItems + 1) throw new Error("archive-invalid-entry-count");
    const byName = new Map();
    let expanded = 0;
    for (const entry of entries) {
      if (entry.directory || entry.encrypted || byName.has(entry.filename)
        || !Number.isSafeInteger(entry.uncompressedSize) || entry.uncompressedSize < 0
        || !Number.isSafeInteger(entry.compressedSize) || entry.compressedSize < 0) throw new Error("archive-invalid-entry");
      if (entry.filename !== manifestName && !/^media\/[0-9a-f-]{36}$/i.test(entry.filename)) throw new Error("archive-invalid-path");
      if (entry.filename === manifestName && entry.uncompressedSize > maxManifestBytes) throw new Error("archive-manifest-too-large");
      if (entry.filename !== manifestName && (entry.uncompressedSize <= 0 || entry.uncompressedSize > maxMediaBytes)) throw new Error("archive-media-too-large");
      expanded += entry.uncompressedSize;
      if (expanded > maxExpandedBytes) throw new Error("archive-too-large");
      byName.set(entry.filename, entry);
    }
    const manifestEntry = byName.get(manifestName);
    if (!manifestEntry) throw new Error("archive-missing-manifest");
    let actualExpanded = 0;
    const account = (bytes) => {
      actualExpanded += bytes;
      if (actualExpanded > maxExpandedBytes) throw new Error("archive-expanded-limit");
    };
    const manifestBlob = await extractBounded(manifestEntry, maxManifestBytes, "application/json", account);
    const manifestText = await manifestBlob.text();
    let manifest;
    try { manifest = JSON.parse(manifestText); } catch { throw new Error("archive-invalid-manifest"); }
    if (manifest?.schemaVersion !== 1 || !Array.isArray(manifest.records)
      || manifest.records.length > maxItems || entries.length !== manifest.records.length + 1) throw new Error("archive-unsupported-version");
    const records = manifest.records.map(validateRecord);
    if (records.reduce((total, record) => total + record.size, 0) > maxLibraryBytes) throw new Error("archive-too-large");
    const seenIds = new Set();
    const blobs = new Map();
    for (const record of records) {
      if (seenIds.has(record.id)) throw new Error("archive-duplicate-id");
      seenIds.add(record.id);
      const entry = byName.get(`media/${record.id}`);
      if (!entry || entry.uncompressedSize !== record.size) throw new Error("archive-missing-original");
      const blob = await extractBounded(entry, Math.min(record.size, maxMediaBytes), record.mimeType, account);
      if (blob.size !== record.size || await hashBlob(blob) !== record.contentHash) throw new Error("archive-hash-mismatch");
      const inspected = await inspectMediaBlob(blob);
      if (inspected.kind !== record.kind || inspected.mimeType !== record.mimeType) throw new Error("archive-type-mismatch");
      blobs.set(record.id, blob);
    }
    return { records, blobs };
  } finally {
    await reader.close();
  }
}
