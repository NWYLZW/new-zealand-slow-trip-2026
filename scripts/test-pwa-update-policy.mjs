import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const dist = fileURLToPath(new URL("../dist/", import.meta.url));
const files = await readdir(dist);
const workerFile = files.find(file => file === "sw.js");
assert(workerFile, "Service worker was not built");

const worker = await readFile(resolve(dist, workerFile), "utf8");
const shell = await readFile(resolve(dist, "index.html"), "utf8");
const entry = shell.match(/assets\/index-[^\"]+\.js/)?.[0];
assert(entry, "Built shell has no entry module");

assert.match(worker, /self\.skipWaiting\(\)/, "Migration worker must take over an old client");
assert.match(worker, /nz-trip-app-assets-v1/, "Application assets need a runtime cache");
assert(worker.includes("AdventureMap-"), "The unvisited map core must remain available offline");
assert(!worker.includes("AdventurePanel-"), "Panel implementation must not block service-worker installation");
assert(worker.includes("AdventureCalendar-"), "The task calendar must remain available offline");
assert(worker.includes(entry), "The entry module must be available for an offline shell reload");

const manifestMatch = worker.match(/precacheAndRoute\((\[[\s\S]*?\]),/);
assert(manifestMatch, "Precache manifest was not found");
const precacheSource = manifestMatch[1];
const urls = [...precacheSource.matchAll(/url:\"([^\"]+)\"/g)].map(match => match[1]);
assert(urls.includes("index.html"), "The navigation shell must remain available offline");
assert(urls.includes("manifest.webmanifest"), "The install manifest must work offline");
assert(urls.includes("icons/pencil-favicon-32.png"), "The primary favicon must work offline");
assert(urls.length <= 32, `Precache should stay bounded; found ${urls.length} entries`);

console.log(JSON.stringify({ precacheEntries: urls.length, runtimeEntry: entry, manualUpdateUi: true }));
