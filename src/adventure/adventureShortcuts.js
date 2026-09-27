const dailyShortcuts = new Set(["today-schedule", "today-stay"]);

export function isDailyAdventureShortcut(value) {
  return dailyShortcuts.has(value);
}

export function deviceDateId(now = new Date()) {
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

export function resolveAdventureShortcut(params, { dayIds, bookings, now = new Date() }) {
  const shortcut = params.get("shortcut");
  if (!isDailyAdventureShortcut(shortcut)) return params;
  const today = deviceDateId(now);
  // Resolve at launch, not at installation. Unrelated deep-link state must not
  // override the shortcut, and out-of-trip dates fall back to their overview.
  const target = new URLSearchParams();
  if (shortcut === "today-schedule") {
    target.set("panel", "tasks");
    if (dayIds.has(today)) {
      target.set("date", today);
      target.set("day", today);
    }
  } else {
    target.set("panel", "bag");
    target.set("bagTab", "stays");
    if (dayIds.has(today)) target.set("bagDate", today);
    const stays = bookings.filter(booking => booking.checkIn <= today && today < booking.checkOut);
    // A move day opens tonight's stay, never yesterday's checked-out booking.
    // An ambiguous overlap stays in the calendar instead of choosing arbitrarily.
    if (stays.length === 1) target.set("bagStay", stays[0].bookingId);
  }
  return target;
}
