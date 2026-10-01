import { buildWeatherUrl, normalizeWeather, weatherRequest, weatherTtl } from "./weatherData.js";

const CACHE_KEY = "adventure-public-weather-v1";
const LIMIT = 64;
const empty = Object.freeze({ status: "loading", data: null, stale: false, offline: false, error: null, retryAt: 0 });

export function createWeatherClient({ fetcher = (...args) => fetch(...args), now = () => Date.now(),
  storage = () => globalThis.localStorage, document: doc = globalThis.document, window: win = globalThis.window,
  online = () => globalThis.navigator?.onLine !== false } = {}) {
  const entries = new Map(), jobs = new Set();
  let flushTimer, refreshTimer, listening = false, loaded = false;
  const visible = () => !doc || doc.visibilityState !== "hidden";
  const notify = entry => entry.listeners.forEach(listener => listener());
  const publish = (entry, patch = {}) => {
    const next = { ...entry.snapshot, ...patch };
    entry.snapshot = { ...next, offline: !online(),
      stale: Boolean(next.data && now() - next.data.fetchedAt >= weatherTtl(entry.request.product)) };
    notify(entry);
  };
  const save = () => {
    try {
      storage()?.setItem(CACHE_KEY, JSON.stringify([...entries.values()].filter(entry => entry.snapshot.data)
        .sort((a, b) => b.snapshot.data.fetchedAt - a.snapshot.data.fetchedAt).slice(0, LIMIT)
        .map(entry => [entry.request.key, entry.snapshot.data])));
    } catch { /* Quota or disabled storage: the in-memory cache still works. */ }
  };
  let saved = new Map();
  const load = () => {
    if (loaded) return;
    loaded = true;
    try {
      const rows = JSON.parse(storage()?.getItem(CACHE_KEY) ?? "[]");
      if (Array.isArray(rows)) saved = new Map(rows.slice(0, LIMIT).filter(row => {
        const data = row?.[1];
        return typeof row?.[0] === "string" && data && Number.isFinite(data.fetchedAt)
          && data.fetchedAt <= now() && now() - data.fetchedAt < 30 * 86400000
          && Array.isArray(data.hours) && data.hours.length >= 23 && data.hours.length <= 25
          && data.hours.every(hour => Number.isFinite(hour.instant) && typeof hour.clock === "string"
            && [hour.temperature, hour.precipitation, hour.wind, hour.code].every(value => value === null || Number.isFinite(value)))
          && data.daily && [data.daily.min, data.daily.max, data.daily.code].every(value => value === null || Number.isFinite(value))
          && /^https:\/\/(?:api|archive-api)\.open-meteo\.com\//.test(data.sourceUrl ?? "");
      }));
    } catch { saved = new Map(); }
  };
  const get = request => {
    load();
    let entry = entries.get(request.key);
    if (!entry) {
      const cached = saved.get(request.key);
      const data = cached?.date === request.date && cached?.locationId === request.location?.id
        && cached?.product === request.product ? cached : null;
      entry = { request, listeners: new Set(), failures: 0, nextAt: data ? data.fetchedAt + weatherTtl(request.product) : 0,
        lastAttempt: 0, job: null, snapshot: { ...empty, data, status: data ? "ready" : request.unavailable ? "unavailable" : "loading",
          reason: request.unavailable, offline: !online(), stale: Boolean(data && now() - data.fetchedAt >= weatherTtl(request.product)) } };
      entries.set(request.key, entry);
      for (const [key, item] of entries) {
        if (entries.size <= LIMIT) break;
        if (!item.listeners.size && !item.job && key !== request.key) entries.delete(key);
      }
    }
    entry.request = request;
    return entry;
  };
  const schedule = () => {
    if (!flushTimer && visible() && online() && [...entries.values()].some(entry => entry.listeners.size)) flushTimer = setTimeout(flush, 60);
  };
  const run = async group => {
    const controller = new AbortController(), job = { controller, group };
    jobs.add(job);
    for (const entry of group) {
      entry.job = job;
      entry.lastAttempt = now();
      publish(entry, { status: entry.snapshot.data ? "ready" : "loading", refreshing: true, error: null });
    }
    const timeout = setTimeout(() => { job.timedOut = true; controller.abort(); }, 15000);
    try {
      const sourceUrl = buildWeatherUrl(group.map(entry => entry.request));
      const response = await fetcher(sourceUrl, { signal: controller.signal, credentials: "omit", referrerPolicy: "no-referrer" });
      if (!response.ok) {
        const error = new Error(response.status === 429 ? "rate-limit" : "network");
        const delay = response.headers?.get("retry-after");
        error.retryAfter = delay && (/^\d+$/.test(delay) ? Number(delay) * 1000 : Date.parse(delay) - now());
        throw error;
      }
      const payload = await response.json();
      if (controller.signal.aborted) return;
      const fetchedAt = now();
      const normalized = group.map(entry => normalizeWeather(payload, entry.request, fetchedAt, sourceUrl));
      for (const [index, entry] of group.entries()) {
        const data = normalized[index];
        entry.failures = 0;
        entry.nextAt = fetchedAt + (data.available ? weatherTtl(entry.request.product) : 30 * 60000);
        publish(entry, { data: data.available ? data : null, status: data.available ? "ready" : "unavailable",
          reason: data.available ? null : "provider-gap", error: null, refreshing: false, retryAt: 0 });
      }
      save();
    } catch (error) {
      if (!controller.signal.aborted || job.timedOut) for (const entry of group) {
        entry.failures++;
        const backoff = Math.min(15 * 60000, 30000 * 2 ** Math.min(5, entry.failures - 1));
        entry.nextAt = now() + Math.max(backoff, Number.isFinite(error.retryAfter) ? error.retryAfter : 0);
        publish(entry, { status: entry.snapshot.data ? "ready" : "error", refreshing: false,
          error: job.timedOut ? "timeout" : error.message === "invalid-response" ? "invalid-response"
            : error.message === "rate-limit" ? "rate-limit" : "network", retryAt: entry.nextAt });
      }
    } finally {
      clearTimeout(timeout);
      jobs.delete(job);
      for (const entry of group) {
        entry.job = null;
        if (entry.snapshot.refreshing) publish(entry, { refreshing: false });
      }
      schedule();
    }
  };
  function flush() {
    flushTimer = null;
    if (!visible() || !online()) return;
    const due = [...entries.values()].filter(entry => entry.listeners.size && !entry.job
      && !entry.request.unavailable && entry.nextAt <= now());
    const groups = new Map();
    for (const entry of due) {
      const key = `${entry.request.location.id}|${entry.request.product === "reanalysis" ? "archive" : "forecast"}`;
      const group = groups.get(key) ?? [];
      // The public trip is short; still cap any coalesced time span at 16 days.
      const first = group[0];
      if (first && Math.abs(entry.request.start - first.request.start) > 15 * 86400000) continue;
      group.push(entry);
      groups.set(key, group);
    }
    for (const group of groups.values()) {
      if (jobs.size >= 2) break;
      void run(group);
    }
  }
  const cancelUnused = () => {
    for (const job of jobs) if (!visible() || !job.group.some(entry => entry.listeners.size)) job.controller.abort();
  };
  const tick = () => {
    cancelUnused();
    for (const entry of entries.values()) if (entry.listeners.size) publish(entry);
    schedule();
  };
  const start = () => {
    if (listening) return;
    listening = true;
    doc?.addEventListener("visibilitychange", tick);
    win?.addEventListener("online", tick);
    win?.addEventListener("offline", tick);
    refreshTimer = setInterval(tick, 60000);
  };
  const stop = () => {
    if ([...entries.values()].some(entry => entry.listeners.size)) return;
    listening = false;
    clearInterval(refreshTimer);
    clearTimeout(flushTimer);
    flushTimer = null;
    doc?.removeEventListener("visibilitychange", tick);
    win?.removeEventListener("online", tick);
    win?.removeEventListener("offline", tick);
  };
  return {
    snapshot: request => get(request).snapshot,
    subscribe(request, listener) {
      const entry = get(request);
      entry.listeners.add(listener);
      publish(entry);
      start();
      schedule();
      return () => { entry.listeners.delete(listener); cancelUnused(); stop(); };
    },
    retry(request) {
      const entry = get(request);
      if (entry.job || entry.request.unavailable || now() - entry.lastAttempt < 10000
        || (entry.snapshot.error === "rate-limit" && entry.nextAt > now())) return;
      entry.nextAt = 0;
      schedule();
    },
    // Also lets focused checks drive the exact lifecycle without a browser.
    refresh: tick,
    dispose() {
      for (const entry of entries.values()) entry.listeners.clear();
      cancelUnused();
      stop();
    },
  };
}

export const weatherClient = createWeatherClient();
export { weatherRequest };
