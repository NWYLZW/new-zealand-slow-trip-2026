import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { deviceDateId, resolveAdventureShortcut } from "../src/adventure/adventureShortcuts.js";
import { confirmedAccommodationBookings } from "../src/data/confirmedAccommodationBookings.js";

const dayIds = new Set(Array.from({ length: 15 }, (_, index) => {
  const date = new Date(2026, 8, 28 + index, 12);
  return deviceDateId(date);
}));
const bookings = Object.values(confirmedAccommodationBookings);
const launch = (shortcut, date, extra = "") => resolveAdventureShortcut(
  new URLSearchParams(`shortcut=${shortcut}${extra}`), { dayIds, bookings, now: date });

const first = launch("today-schedule", new Date(2026, 8, 29, 0, 1), "&place=ZQN&fullscreen=calendar");
assert.equal(first.get("day"), "2026-09-29");
assert.equal(first.get("date"), "2026-09-29");
assert.equal(first.get("panel"), "tasks");
assert(!first.has("place") && !first.has("fullscreen") && !first.has("shortcut"));
assert.equal(launch("today-schedule", new Date(2026, 8, 30, 0, 1)).get("day"), "2026-09-30");
for (const date of [new Date(2026, 8, 27, 12), new Date(2026, 9, 13, 12)]) {
  assert.equal(launch("today-schedule", date).toString(), "panel=tasks");
  assert.equal(launch("today-stay", date).toString(), "panel=bag&bagTab=stays");
}
assert.equal(launch("today-stay", new Date(2026, 8, 29, 12)).get("bagStay"), "hotel-queenstown");
assert.equal(launch("today-stay", new Date(2026, 9, 2, 12)).get("bagStay"), "hotel-queenstown");
assert.equal(launch("today-stay", new Date(2026, 9, 3, 12)).get("bagStay"), "hotel-wanaka");
assert.equal(launch("today-stay", new Date(2026, 9, 5, 12)).get("bagStay"), "mount-cook");
assert.equal(launch("today-stay", new Date(2026, 9, 10, 12)).get("bagStay"), null);
assert.equal(launch("today-stay", new Date(2026, 9, 10, 12)).get("bagDate"), "2026-10-10");
const normal = new URLSearchParams("panel=camera&place=ZQN");
assert.equal(resolveAdventureShortcut(normal, { dayIds, bookings }), normal);
const ambiguous = resolveAdventureShortcut(new URLSearchParams("shortcut=today-stay"), {
  dayIds, bookings: [...bookings, { ...bookings[0], bookingId: "overlap" }], now: new Date(2026, 8, 29, 12),
});
assert.equal(ambiguous.get("bagStay"), null);

const manifest = JSON.parse(await readFile(new URL("../dist/manifest.webmanifest", import.meta.url), "utf8"));
assert.deepEqual(manifest.shortcuts.map(item => item.name), ["当日日程", "当日酒店", "相机", "行程总览", "酒店总览"]);
assert.deepEqual(manifest.shortcuts.map(item => item.url), ["./?shortcut=today-schedule", "./?shortcut=today-stay", "./?panel=camera", "./?panel=tasks", "./?panel=bag&bagTab=stays"]);
assert(manifest.shortcuts.every(item => item.icons[0].src === "icons/pencil-app-192.png"));
console.log(`PWA shortcuts passed: local date (${Intl.DateTimeFormat().resolvedOptions().timeZone}), fresh launches, transfer days, no-stay fallback and five manifest entries.`);
