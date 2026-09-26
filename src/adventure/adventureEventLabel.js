export function adventureEventLabel(event) {
  return event.calendarLabel ?? event.title;
}

export function adventureEventDescription(event) {
  const label = adventureEventLabel(event);
  return event.title !== label ? event.title : null;
}
