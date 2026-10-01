export const albumMaxActiveCards = 24;
export const albumThumbnailVersion = "album-preview-v1-480-webp";
export const albumThumbnailEdge = 480;

export function albumThumbnailKey(item) {
  return JSON.stringify([albumThumbnailVersion, item.id, item.contentHash, item.kind, item.mimeType, item.size]);
}

export function albumWindow({ count, columns, rowHeight, gap, top, height, visible = true }) {
  if (!visible || count <= 0 || height <= 0 || rowHeight <= 0 || columns < 1)
    return { start: 0, end: 0, visibleStart: 0, visibleEnd: 0 };
  const stride = rowHeight + gap;
  const rows = Math.ceil(count / columns);
  const first = Math.max(0, Math.min(rows - 1, Math.floor(top / stride)));
  const last = Math.min(rows, Math.max(first + 1, Math.ceil((top + height) / stride)));
  const start = Math.max(0, first - 1) * columns;
  const end = Math.min(count, (last + 1) * columns, start + albumMaxActiveCards);
  return { start, end, visibleStart: first * columns, visibleEnd: Math.min(count, last * columns) };
}

export function thumbnailDimensions(width, height, edge = albumThumbnailEdge) {
  if (!(width > 0 && height > 0)) throw new Error("thumbnail-invalid-dimensions");
  const scale = Math.min(1, edge / Math.max(width, height));
  return { width: Math.max(1, Math.round(width * scale)), height: Math.max(1, Math.round(height * scale)) };
}

function abortError() {
  return new DOMException("Thumbnail request cancelled", "AbortError");
}

// Only derived blobs enter this cache. Originals and object URLs belong to callers.
export function createAlbumThumbnailLoader({ readBlob, renderThumbnail, concurrency = 2,
  maxPending = 48, maxEntries = 64, maxBytes = 12 * 1024 * 1024 }) {
  const cache = new Map();
  const jobs = new Map();
  let bytes = 0;
  let active = 0;
  let scheduled = false;

  const removeCached = key => {
    const entry = cache.get(key);
    if (entry) { bytes -= entry.size; cache.delete(key); }
  };
  const cacheBlob = (key, blob) => {
    if (!(blob instanceof Blob) || blob.size > maxBytes || maxEntries <= 0) return;
    removeCached(key);
    cache.set(key, blob);
    bytes += blob.size;
    while (cache.size > maxEntries || bytes > maxBytes) removeCached(cache.keys().next().value);
  };
  const settle = (job, error, blob) => {
    for (const consumer of job.consumers) {
      consumer.detach();
      if (error) consumer.reject(error);
      else consumer.resolve(blob);
    }
    job.consumers.clear();
  };
  const cancel = job => {
    if (jobs.get(job.key) === job) jobs.delete(job.key);
    job.controller.abort();
    settle(job, abortError());
  };
  const schedule = () => {
    if (scheduled) return;
    scheduled = true;
    queueMicrotask(() => {
      scheduled = false;
      while (active < concurrency) {
        const job = [...jobs.values()].filter(candidate => !candidate.started)
          .sort((a, b) => a.priority - b.priority)[0];
        if (!job) break;
        job.started = true;
        active++;
        void run(job);
      }
    });
  };
  async function run(job) {
    try {
      const original = await readBlob(job.item.id);
      if (job.controller.signal.aborted) throw abortError();
      if (!original) throw new Error("media-not-found");
      const blob = await renderThumbnail(original, job.item, job.controller.signal);
      if (job.controller.signal.aborted) throw abortError();
      if (!(blob instanceof Blob) || !blob.size) throw new Error("thumbnail-unavailable");
      cacheBlob(job.key, blob);
      settle(job, null, blob);
    } catch (error) {
      settle(job, error);
    } finally {
      if (jobs.get(job.key) === job) jobs.delete(job.key);
      active--;
      schedule();
    }
  }

  return {
    request(item, { signal, priority = 0 } = {}) {
      if (signal?.aborted) return Promise.reject(abortError());
      const key = albumThumbnailKey(item);
      const cached = cache.get(key);
      if (cached) {
        cache.delete(key);
        cache.set(key, cached);
        return Promise.resolve(cached);
      }
      let job = jobs.get(key);
      if (!job) {
        if ([...jobs.values()].filter(candidate => !candidate.started).length >= maxPending)
          return Promise.reject(new Error("thumbnail-queue-full"));
        job = { key, item, priority, started: false, consumers: new Set(), controller: new AbortController() };
        jobs.set(key, job);
      }
      job.priority = Math.min(priority, job.priority);
      const promise = new Promise((resolve, reject) => {
        const consumer = { resolve, reject, detach: () => signal?.removeEventListener("abort", onAbort) };
        const onAbort = () => {
          consumer.detach();
          job.consumers.delete(consumer);
          reject(abortError());
          if (!job.consumers.size) cancel(job);
        };
        job.consumers.add(consumer);
        signal?.addEventListener("abort", onAbort, { once: true });
      });
      schedule();
      return promise;
    },
    retain(items) {
      const keys = new Set(items.map(albumThumbnailKey));
      for (const key of cache.keys()) if (!keys.has(key)) removeCached(key);
      for (const job of jobs.values()) if (!keys.has(job.key)) cancel(job);
    },
    inspect() {
      return { active, pending: [...jobs.values()].filter(job => !job.started).length,
        entries: cache.size, bytes };
    },
  };
}
