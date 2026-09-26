import assert from "node:assert/strict";
import { chromium } from "playwright";

const base = process.env.ADVENTURE_TEST_URL || "http://127.0.0.1:4174/new-zealand-slow-trip-2026/adventure";
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext();
const errors = [];
try {
  await context.addInitScript(() => {
    navigator.mediaDevices.getUserMedia = () => Promise.reject(new Error("Unexpected device access"));
    navigator.geolocation.getCurrentPosition = () => { throw new Error("Unexpected GPS access"); };
    navigator.geolocation.watchPosition = () => { throw new Error("Unexpected GPS access"); };
  });
  const first = await context.newPage();
  const second = await context.newPage();
  for (const page of [first, second]) {
    page.on("pageerror", error => errors.push(error.message));
    await page.goto(`${base}?panel=camera&cameraView=album`);
    await page.evaluate(async () => {
      window.library = await import("./src/adventure/media/library.js");
      await window.library.initializeMediaLibrary();
    });
  }
  const ids = await first.evaluate(async () => {
    const ids = [];
    for (const color of ["#d45661", "#558877"]) {
      const canvas = document.createElement("canvas");
      canvas.width = canvas.height = 16;
      canvas.getContext("2d").fillStyle = color;
      canvas.getContext("2d").fillRect(0, 0, 16, 16);
      const blob = await new Promise(resolve => canvas.toBlob(resolve, "image/png"));
      const { item } = await window.library.saveCapturedMedia({ blob });
      ids.push(item.id);
    }
    return ids;
  });
  await second.waitForFunction(() => window.library.getMediaSnapshot().items.length === 2);
  await first.evaluate(id => window.library.updateMediaMetadata(id, { favorite: true }), ids[1]);
  await second.waitForFunction(id => window.library.getMediaSnapshot().items.find(item => item.id === id)?.favorite === true, ids[1]);
  assert.equal(await first.evaluate(id => window.library.deleteMediaItem(id), ids[0]), true);
  await second.waitForFunction(() => window.library.getMediaSnapshot().items.length === 1);
  const removed = await first.evaluate(async id => ({
    blob: await window.library.getMediaBlob(id),
    present: window.library.getMediaSnapshot().items.some(item => item.id === id),
    repeated: await window.library.deleteMediaItem(id),
  }), ids[0]);
  assert.deepEqual(removed, { blob: null, present: false, repeated: false });
  assert.equal(await first.evaluate(async id => (await window.library.getMediaBlob(id))?.size > 0, ids[1]), true);
  const archived = await first.evaluate(async () => {
    const { readArchive, makeArchive } = await import("./src/adventure/media/archive.js");
    const { validateRecord } = await import("./src/adventure/media/format.js");
    window.savedTestArchive = await window.library.exportMediaArchive();
    const parsed = await readArchive(window.savedTestArchive);
    const { favorite, ...legacy } = parsed.records[0];
    const duplicateArchive = await makeArchive([{ ...legacy, favorite: false }],
      window.library.getMediaBlob, window.library.getMediaSnapshot().identity);
    const duplicate = await window.library.importMediaArchive(duplicateArchive);
    let invalidRejected = false;
    try { validateRecord({ ...legacy, favorite: "yes" }); } catch { invalidRejected = true; }
    return { records: parsed.records.map(item => ({ id: item.id, favorite: item.favorite })),
      legacyDefault: validateRecord(legacy).favorite, invalidRejected, duplicate,
      localFavorite: window.library.getMediaSnapshot().items[0].favorite };
  });
  assert.deepEqual(archived, { records: [{ id: ids[1], favorite: true }], legacyDefault: false,
    invalidRejected: true, duplicate: { imported: 0, duplicates: 1, metadataConflicts: 0 }, localFavorite: true });
  await first.reload();
  await first.evaluate(async () => {
    window.library = await import("./src/adventure/media/library.js");
    await window.library.initializeMediaLibrary();
  });
  assert.deepEqual(await first.evaluate(() => window.library.getMediaSnapshot().items.map(item => item.id)), [ids[1]]);
  assert.equal(await first.evaluate(() => window.library.getMediaSnapshot().items[0].favorite), true);
  await first.evaluate(async () => {
    window.savedTestArchive = await window.library.exportMediaArchive();
  });
  await second.evaluate(id => window.library.deleteMediaItem(id), ids[1]);
  await first.waitForFunction(() => window.library.getMediaSnapshot().items.length === 0);
  await first.evaluate(() => window.library.importMediaArchive(window.savedTestArchive));
  await second.waitForFunction(() => window.library.getMediaSnapshot().items[0]?.favorite === true);
  assert.deepEqual(errors, []);
  console.log(JSON.stringify({ atomicRemoval: true, repeatSafe: true, crossTab: true, reload: true,
    exportedArchiveExcludesDeleted: true, unrelatedMediaPreserved: true, favoriteRoundTrip: true,
    legacyFavoriteDefault: true, favoriteDoesNotDuplicateMedia: true, errors }));
} finally {
  await browser.close();
}
