import assert from 'node:assert/strict';
import { createServer } from 'vite';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { initialAdventureParams, initialTripDate } from '../src/adventure/adventureInitialView.js';

const days = new Set(['2026-09-28', '2026-10-01', '2026-10-12']);
const inside = new Date('2026-09-30T12:00:00Z');
assert.equal(initialTripDate('', days, inside), '2026-10-01');
assert.equal(initialTripDate('', days, new Date('2026-09-27T10:59:59Z')), null);
assert.equal(initialTripDate('', days, new Date('2026-09-27T11:00:00Z')), '2026-09-28');
assert.equal(initialTripDate('', days, new Date('2026-10-12T10:59:59Z')), '2026-10-12');
assert.equal(initialTripDate('', days, new Date('2026-10-12T11:00:00Z')), null);
assert.equal(initialTripDate('', days, new Date('invalid')), null);
for (const search of ['?date=2026-10-05', '?panel=camera', '?place=ZQN', '?route=zqn-wanaka',
  '?map=international', '?zoom=1&lat=-45&lng=168', '?weather=2026-10-05', '?unlock=1', '?shortcut=today-stay']) {
  assert.equal(initialTripDate(search, days, inside), null);
  assert.equal(initialAdventureParams(search, days, inside).toString(), new URLSearchParams(search).toString());
}
assert.equal(initialAdventureParams('', days, inside).toString(), 'panel=tasks&date=2026-10-01&day=2026-10-01');
assert.equal(initialAdventureParams('', days, new Date('2026-10-13T00:00:00Z')).toString(), '');
const server = await createServer({ configFile: false, server: { middlewareMode: true, hmr: false },
  optimizeDeps: { noDiscovery: true, include: [] } });
const NativeDate = Date;
try {
  const { readLocation, writeLocation, useAdventureNavigation } = await server.ssrLoadModule('/src/adventure/useAdventureNavigation.js');
  const { getAdventureCalendarDays } = await server.ssrLoadModule('/src/components/calendar/tripCalendarData.js');
  const base = 'http://127.0.0.1:4174/new-zealand-slow-trip-2026/';
  const writes = [];
  globalThis.window = { location: new URL(base) };
  globalThis.history = Object.fromEntries(['pushState', 'replaceState'].map(method => [method, (_, __, url) => {
    writes.push(method); window.location = new URL(url);
  }]));
  globalThis.document = { getElementById: () => null };
  for (const day of getAdventureCalendarDays()) {
    const next = readLocation({ initial: true, now: new Date(`${day.dateId}T00:00:00Z`) });
    assert.equal(next.calendarOpen, true);
    assert.equal(next.rightPanel, 'day');
    assert.equal(next.day, day.dateId);
    assert.equal(next.date, day.dateId);
    assert.equal(next.front, 'right');
    assert.deepEqual(next.focus, { kind: 'date', value: day.dateId, token: 0 });
  }
  for (const date of ['2026-09-27T00:00:00Z', '2026-10-13T00:00:00Z']) {
    const overview = readLocation({ initial: true, now: new Date(date) });
    assert.equal(overview.calendarOpen, false);
    assert.equal(overview.rightPanel, null);
    assert.equal(overview.focus, null);
  }
  const today = readLocation({ initial: true, now: inside });
  writeLocation(today, { replace: true });
  assert.deepEqual(writes, ['replaceState']);
  assert.deepEqual(readLocation(), today);
  assert.deepEqual(readLocation({ initial: true, now: new Date('2026-10-13T00:00:00Z') }), today);
  for (const query of ['?panel=camera', '?weather=2026-10-05', '?place=ZQN', '?map=international',
    '?panel=tasks&date=2026-10-05&day=2026-10-05', '?shortcut=today-schedule', '?shortcut=today-stay']) {
    window.location = new URL(base + query);
    assert.deepEqual(readLocation({ initial: true, now: inside }), readLocation({ now: inside }));
  }
  window.location = new URL(base);
  globalThis.Date = class extends NativeDate {
    constructor(...args) { super(...(args.length ? args : [inside.getTime()])); }
    static now() { return inside.getTime(); }
  };
  let launch, navigate;
  renderToString(React.createElement(function Harness() {
    [launch, navigate] = useAdventureNavigation();
    return null;
  }));
  assert.equal(launch.day, '2026-10-01', 'Hook initializes the selected day, not just the helper');
  navigate('close-right');
  assert.equal(readLocation().rightPanel, null);
  assert.equal(readLocation().calendarOpen, true);
  navigate('close-calendar');
  assert.equal(readLocation().calendarOpen, false);
  assert.equal(readLocation().rightPanel, null);
  window.location = new URL(base);
  assert.equal(readLocation().rightPanel, null, 'Empty history entry must not reapply launch defaults');
} finally {
  globalThis.Date = NativeDate;
  delete globalThis.window; delete globalThis.history; delete globalThis.document;
  await server.close();
}
console.log('Default trip entry: NZ local boundaries, 15 itinerary days, explicit links, hook initialization, URL replacement and close/history parsing passed.');
