const newZealandDate = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Pacific/Auckland', year: 'numeric', month: '2-digit', day: '2-digit',
});

export function initialTripDate(search, dayIds, now = new Date()) {
  // Explicit navigation always wins, including map-only and unlock links.
  if (new URLSearchParams(search).size || !Number.isFinite(now.getTime())) return null;
  const parts = Object.fromEntries(newZealandDate.formatToParts(now).map(part => [part.type, part.value]));
  const today = `${parts.year}-${parts.month}-${parts.day}`;
  return dayIds.has(today) ? today : null;
}

export function initialAdventureParams(search, dayIds, now = new Date()) {
  const params = new URLSearchParams(search);
  const today = initialTripDate(search, dayIds, now);
  if (today) {
    params.set('panel', 'tasks');
    params.set('date', today);
    params.set('day', today);
  }
  return params;
}
