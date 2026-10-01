export function weatherParentView(view) {
  return view.rightPanel === "weather" ? { ...view, rightPanel: view.weatherParent ?? null,
    front: view.weatherParentFront ?? null } : view;
}

export function openWeatherView(view, date, place = null) {
  const parent = weatherParentView(view);
  return { ...view, rightPanel: "weather", weatherDate: date, weatherPlace: place, weatherView: null,
    weatherParent: parent.rightPanel, weatherParentFront: parent.front,
    weatherParentFullscreen: view.rightPanel === "weather" ? view.weatherParentFullscreen : view.fullscreen,
    fullscreen: view.fullscreen === "calendar" ? "right" : view.fullscreen, front: "right" };
}

export function backFromWeather(view) {
  if (view.weatherView === "sources") return { ...view, weatherView: null, front: "right" };
  const parent = weatherParentView(view);
  const fullscreen = view.weatherParentFullscreen === "calendar" && view.calendarOpen ? "calendar"
    : view.weatherParentFullscreen === "right" && parent.rightPanel ? "right" : null;
  return { ...parent, fullscreen,
    front: parent.front === "tasks" && parent.calendarOpen ? "tasks" : parent.rightPanel ? "right" : parent.calendarOpen ? "tasks" : null,
    weatherDate: null, weatherPlace: null, weatherView: null, weatherParent: null, weatherParentFront: null, weatherParentFullscreen: null };
}

export function readWeatherView(parent, params, validDate, validPlace) {
  const date = validDate(params.get("weather"));
  if (!date) return parent;
  const place = params.get("weatherPlace");
  const view = openWeatherView(parent, date, place && validPlace(date, place) ? place : null);
  const requestedFullscreen = params.get("fullscreen");
  return { ...view,
    weatherView: params.get("weatherView") === "sources" ? "sources" : null,
    weatherParentFront: ["tasks", "right"].includes(params.get("weatherParentFront")) ? params.get("weatherParentFront") : parent.front,
    weatherParentFullscreen: ["calendar", "right"].includes(params.get("weatherParentFullscreen")) ? params.get("weatherParentFullscreen") : null,
    fullscreen: requestedFullscreen === "right" ? "right" : requestedFullscreen === "calendar" && parent.calendarOpen ? "calendar" : null,
    front: params.get("weatherFront") === "tasks" && parent.calendarOpen ? "tasks" : "right" };
}

export function writeWeatherParams(params, view) {
  if (view.rightPanel !== "weather") return;
  params.set("weather", view.weatherDate);
  if (view.weatherView === "sources") params.set("weatherView", "sources");
  if (view.weatherPlace) params.set("weatherPlace", view.weatherPlace);
  if (view.weatherParentFront) params.set("weatherParentFront", view.weatherParentFront);
  if (view.weatherParentFullscreen) params.set("weatherParentFullscreen", view.weatherParentFullscreen);
  if (view.front === "tasks") params.set("weatherFront", "tasks");
}
