import assert from "node:assert/strict";
import { albumMaxActiveCards, albumThumbnailKey, albumWindow, createAlbumThumbnailLoader,
  thumbnailDimensions } from "../src/adventure/media/albumLoading.js";
import { renderAlbumThumbnail } from "../src/adventure/media/albumThumbnailRenderer.js";

const tick = () => new Promise(resolve => setImmediate(resolve));
const item = id => ({ id: String(id), contentHash: `hash-${id}`, kind: "image", mimeType: "image/jpeg", size: 12345 });
const original = new Blob(["original-bytes"], { type: "image/jpeg" });
const preview = new Blob(["thumb"], { type: "image/webp" });
const checks = [];

const initial = albumWindow({ count: 500, columns: 2, rowHeight: 236, gap: 10, top: 0, height: 700 });
assert.deepEqual(initial, { start: 0, end: 8, visibleStart: 0, visibleEnd: 6 });
const middle = albumWindow({ count: 500, columns: 2, rowHeight: 236, gap: 10, top: 20 * 246, height: 700 });
assert.deepEqual(middle, { start: 38, end: 48, visibleStart: 40, visibleEnd: 46 });
assert.equal(albumWindow({ count: 500, columns: 1, rowHeight: 280, gap: 7, top: 0, height: 630 }).end, 4);
for (const count of [0, 1, 13, 500]) {
  for (const columns of [1, 2]) {
    for (const top of [-80, 0, 284, 900, 100_000]) {
      const range = albumWindow({ count, columns, rowHeight: 180, gap: 7, top, height: 800 });
      assert(range.start >= 0 && range.end <= count && range.end >= range.start);
      assert(range.end - range.start <= albumMaxActiveCards);
    }
  }
}
assert.equal(albumWindow({ count: 500, columns: 2, rowHeight: 200, gap: 10, top: 0, height: 1000, visible: false }).end, 0);
assert.deepEqual(thumbnailDimensions(8000, 6000), { width: 480, height: 360 });
assert.deepEqual(thumbnailDimensions(6000, 8000), { width: 360, height: 480 });
assert.deepEqual(thumbnailDimensions(100, 50), { width: 100, height: 50 });
assert.deepEqual(thumbnailDimensions(1, 40000), { width: 1, height: 480 });
assert.throws(() => thumbnailDimensions(0, 100));
checks.push("500-item ranges, one-row overscan, mobile columns, hard cap, hidden grid, aspect-ratio sizing");

assert.equal(albumThumbnailKey(item(1)), albumThumbnailKey({ ...item(1), favorite: true, photographer: { nickname: "new" } }));
assert.notEqual(albumThumbnailKey(item(1)), albumThumbnailKey({ ...item(1), contentHash: "replacement" }));
assert.notEqual(albumThumbnailKey(item(1)), albumThumbnailKey({ ...item(1), mimeType: "image/png" }));
assert.notEqual(albumThumbnailKey(item(1)), albumThumbnailKey(item(2)));
checks.push("original-identity/version keys, metadata-only updates do not invalidate thumbnails");

{
  const reads = [];
  const held = [];
  const loader = createAlbumThumbnailLoader({ readBlob: async id => { reads.push(id); return original; },
    renderThumbnail: () => new Promise(resolve => held.push(resolve)) });
  const promises = Array.from({ length: initial.end }, (_, id) => loader.request(item(id)));
  await tick();
  assert.equal(reads.length, 2);
  assert.equal(loader.inspect().active, 2);
  assert.equal(loader.inspect().pending, initial.end - 2);
  while (loader.inspect().active || loader.inspect().pending) {
    for (const resolve of held.splice(0)) resolve(preview);
    await tick();
  }
  await Promise.all(promises);
  assert.equal(reads.length, 8, "entry reads eight near cards, never all 500 originals");
  await loader.request(item(0));
  assert.equal(reads.length, 8, "revisit cache hit reads no original");
}
checks.push("entry reads only nearby eight of 500; at most two reads/decodes; revisit needs no original read");

{
  const reads = [];
  let release;
  const loader = createAlbumThumbnailLoader({ concurrency: 1, maxPending: 2,
    readBlob: async id => { reads.push(id); return original; },
    renderThumbnail: () => new Promise(resolve => { release = resolve; }) });
  const first = loader.request(item(1));
  await tick();
  const cancel = new AbortController();
  const second = loader.request(item(2), { signal: cancel.signal });
  const cancelled = assert.rejects(second, { name: "AbortError" });
  const third = loader.request(item(3));
  await assert.rejects(loader.request(item(4)), /queue-full/);
  cancel.abort();
  await cancelled;
  release(preview);
  await first;
  await tick();
  assert.deepEqual(reads, ["1", "3"]);
  release(preview);
  await third;
}
checks.push("pending bound and cancellation: scrolled-away queued original is never read");

{
  const reads = [];
  const loader = createAlbumThumbnailLoader({ concurrency: 1,
    readBlob: async id => { reads.push(id); return original; }, renderThumbnail: async () => preview });
  await Promise.all([loader.request(item("near"), { priority: 1 }), loader.request(item("visible"), { priority: 0 })]);
  assert.deepEqual(reads, ["visible", "near"]);
  const missing = createAlbumThumbnailLoader({ readBlob: async () => null,
    renderThumbnail: () => assert.fail("missing original must not be decoded") });
  await assert.rejects(missing.request(item("missing")), /media-not-found/);
  assert.equal(missing.inspect().entries, 0);
}
checks.push("visible jobs precede overscan; missing original fails locally without decoding or caching");

{
  const reads = [];
  let releaseRead;
  let renders = 0;
  const loader = createAlbumThumbnailLoader({ readBlob: id => {
    reads.push(id); return new Promise(resolve => { releaseRead = resolve; });
  }, renderThumbnail: async () => { renders++; return preview; } });
  const a = new AbortController();
  const b = new AbortController();
  const one = loader.request(item(1), { signal: a.signal });
  const two = loader.request(item(1), { signal: b.signal });
  const oneAborted = assert.rejects(one, { name: "AbortError" });
  await tick();
  a.abort();
  await oneAborted;
  releaseRead(original);
  await two;
  assert.deepEqual(reads, ["1"]);
  assert.equal(renders, 1, "remaining shared consumer completes");
  const c = new AbortController();
  const three = loader.request(item(3), { signal: c.signal });
  const threeAborted = assert.rejects(three, { name: "AbortError" });
  await tick();
  c.abort();
  await threeAborted;
  releaseRead(original);
  await tick();
  assert.equal(renders, 1, "late non-abortable IDB read does not start a decode");
  assert.equal(loader.inspect().active, 0);
}
checks.push("deduplicated readers, independent consumers, late IDB result discarded after cancellation");

{
  let calls = 0;
  let fail = false;
  const loader = createAlbumThumbnailLoader({ maxEntries: 2, maxBytes: 10,
    readBlob: async () => { calls++; return original; },
    renderThumbnail: async () => { if (fail) throw new Error("decode-failed"); return preview; } });
  await loader.request(item(1));
  await loader.request(item(2));
  await loader.request(item(1));
  await loader.request(item(3));
  assert.equal(loader.inspect().entries, 2);
  assert.equal(loader.inspect().bytes, 10);
  await loader.request(item(1));
  assert.equal(calls, 3);
  await loader.request(item(2));
  assert.equal(calls, 4, "least-recent entry was evicted");
  loader.retain([item(2)]);
  assert.equal(loader.inspect().entries, 1);
  loader.retain([{ ...item(2), contentHash: "changed" }]);
  assert.equal(loader.inspect().entries, 0);
  fail = true;
  await assert.rejects(loader.request(item(4)), /decode-failed/);
  assert.equal(loader.inspect().active, 0);
  assert.equal(loader.inspect().entries, 0);
  fail = false;
  await loader.request(item(4));
  assert.equal(await original.text(), "original-bytes");
  const oversized = createAlbumThumbnailLoader({ maxBytes: 2,
    readBlob: async () => original, renderThumbnail: async () => preview });
  assert.equal(await oversized.request(item(1)), preview);
  assert.equal(oversized.inspect().entries, 0);
}
checks.push("LRU byte/entry limits, deletion and replacement invalidation, oversized exclusion, failed decode retry, intact originals");

{
  let release;
  const loader = createAlbumThumbnailLoader({ readBlob: async () => original,
    renderThumbnail: () => new Promise(resolve => { release = resolve; }) });
  const pending = loader.request(item(1));
  const invalidated = assert.rejects(pending, { name: "AbortError" });
  await tick();
  loader.retain([]);
  await invalidated;
  release(preview);
  await tick();
  assert.equal(loader.inspect().entries, 0, "late deleted-item result cannot repopulate cache");
}
checks.push("in-flight deletion invalidates consumers and prevents late cache repopulation");

// Small decoder fakes only; no browser, media library, permissions or device is opened.
{
  const savedDocument = globalThis.document;
  const savedCreate = URL.createObjectURL;
  const savedRevoke = URL.revokeObjectURL;
  const media = [];
  const canvases = [];
  const revoked = [];
  let nextUrl = 0;
  let encode;
  globalThis.document = { createElement(tag) {
    if (tag === "canvas") {
      const canvas = { width: 0, height: 0,
        getContext: () => ({ drawImage: (...args) => { canvas.draw = args; } }),
        toBlob: callback => { encode = callback; } };
      canvases.push(canvas);
      return canvas;
    }
    const element = { tag, naturalWidth: 8000, naturalHeight: 6000, videoWidth: 1920, videoHeight: 1080,
      removeAttribute(name) { delete this[name]; },
      pause() { this.paused = true; }, load() { this.released = true; } };
    media.push(element);
    return element;
  } };
  URL.createObjectURL = () => `blob:fake-${++nextUrl}`;
  URL.revokeObjectURL = url => revoked.push(url);
  try {
    const imageResult = renderAlbumThumbnail(original, item(1), new AbortController().signal);
    media[0].onload();
    assert.deepEqual([canvases[0].width, canvases[0].height], [480, 360]);
    encode(preview);
    assert.equal(await imageResult, preview);
    assert.equal(media[0].src, undefined);
    assert.deepEqual([canvases[0].width, canvases[0].height], [0, 0]);
    const videoResult = renderAlbumThumbnail(original, { ...item(2), kind: "video" }, new AbortController().signal);
    assert.equal(media[1].muted, true);
    media[1].onloadeddata();
    assert.deepEqual([canvases[1].width, canvases[1].height], [480, 270]);
    encode(preview);
    await videoResult;
    assert.equal(media[1].paused, true);
    assert.equal(media[1].released, true);
    const signal = new AbortController();
    const cancelled = renderAlbumThumbnail(original, item(3), signal.signal);
    const aborted = assert.rejects(cancelled, { name: "AbortError" });
    let completed = false;
    void cancelled.catch(() => { completed = true; });
    media[2].onload();
    signal.abort();
    await tick();
    assert.equal(completed, false, "non-abortable native encode retains its queue slot until callback");
    encode(preview);
    await aborted;
    assert.equal(media[2].src, undefined);
    const badImage = renderAlbumThumbnail(original, item(4), new AbortController().signal);
    const failure = assert.rejects(badImage, /decode-failed/);
    media[3].onerror();
    await failure;
    assert.deepEqual(revoked, ["blob:fake-1", "blob:fake-2", "blob:fake-3", "blob:fake-4"]);
  } finally {
    globalThis.document = savedDocument;
    URL.createObjectURL = savedCreate;
    URL.revokeObjectURL = savedRevoke;
  }
}
checks.push("fake image/video sizing; success/error/abort revoke URLs, clear canvas and stop video; cancelled native encoding holds slot until callback");

console.log(JSON.stringify({ passed: checks, browserRun: false, deviceRun: false,
  limits: "24 nearby cards plus focus/action retention; 2 thumbnail jobs; 48 pending; 64 entries / 12 MiB" }, null, 2));
