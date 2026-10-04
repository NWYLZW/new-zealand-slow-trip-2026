export const agendaIconDefinitions = {
  rest: {
    kind: "rest",
    sourceSize: 24,
    paths: [{ d: "M2 21v-6H1V9h2v4h18V9h2v6h-1v6h-2v-2H4v2zm3-10V5c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2v6h-2V7H7v4z" }],
  },
  wait: {
    kind: "wait",
    sourceSize: 24,
    paths: [{ d: "M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20m0 18a8 8 0 1 1 0-16 8 8 0 0 1 0 16m.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z" }],
  },
  meal: {
    kind: "meal",
    sourceSize: 24,
    paths: [{ d: "M5 3v7c0 2 1.2 3 3 3s3-1 3-3V3M8 3v18M18 21V3c-3 1.7-4 4.5-4 8h4" }],
  },
  scenic: {
    kind: "mountain",
    sourceSize: 24,
    paths: [{ d: "m14 6-3.75 5 2.85 3.8-1.6 1.2C9.81 13.75 7 10 7 10l-6 8h22z" }],
  },
  flight: {
    kind: "flight",
    sourceSize: 32,
    paths: [
      { d: "M16 3.9c-.8 0-1.3.7-1.3 1.5l-.1 8.4-8.3 5.3.1 2.3 8.2-2.6-.1 5.3-2.4 1.8v1.7l3.9-1.2 3.9 1.2v-1.7l-2.4-1.8-.1-5.3 8.2 2.6.1-2.3-8.3-5.3-.1-8.4c0-.8-.5-1.5-1.3-1.5z" },
      { d: "m14.8 8.1.1 3.2m2.1 5.2 4.6 2.9m-9.9-.1-3.5 1.1", className: "sketch-scuff" },
    ],
  },
  helicopter: {
    kind: "helicopter",
    sourceSize: 32,
    paths: [
      { d: "M5.5 10.2c5.8-.6 15.3-.6 21 0M15.9 8.1l.1 3.8M7.3 14.1c2-1.1 7-1.7 10.6-1.1 3.2.5 5.6 2.6 5.5 5.4-.1 3.7-4 5.8-8.9 5.7-3.8-.1-6.5-1.4-7.8-3.8l-3.1-.2m18.8-2.2 3.6-1.2 1.7-3.3M10.1 24.7l-.3 2m9.4-2 .2 2M7.3 27.1c4.6.4 10.8.3 14.5-.1" },
      { d: "m9.4 16.2 3.1-.7m4.3-.1 2.7.7m5.5 3.7 2.4.2", className: "sketch-scuff" },
    ],
  },
  city: {
    kind: "city",
    sourceSize: 24,
    paths: [{ d: "M15 11V5l-3-3-3 3v2H3v14h18V11zm-8 8H5v-2h2zm0-4H5v-2h2zm0-4H5V9h2zm6 8h-2v-2h2zm0-4h-2v-2h2zm0-4h-2V9h2zm0-4h-2V5h2zm6 12h-2v-2h2zm0-4h-2v-2h2z" }],
  },
  car: {
    kind: "car",
    sourceSize: 24,
    paths: [{ d: "M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16m11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5M5 11l1.5-4.5h11L19 11z" }],
  },
  bus: {
    kind: "bus",
    sourceSize: 24,
    paths: [{ d: "M4 16c0 .88.39 1.67 1 2.22V20c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h8v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1.78c.61-.55 1-1.34 1-2.22V6c0-3.5-3.58-4-8-4s-8 .5-8 4zm3.5 1c-.83 0-1.5-.67-1.5-1.5S6.67 14 7.5 14s1.5.67 1.5 1.5S8.33 17 7.5 17m9 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5m1.5-6H6V6h12z" }],
  },
  movie: {
    kind: "movie",
    sourceSize: 24,
    paths: [{ d: "m18 4 2 4h-3l-2-4h-2l2 4h-3l-2-4H8l2 4H7L5 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V4z" }],
  },
  stars: {
    kind: "stars",
    sourceSize: 24,
    paths: [{ d: "M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2m4.24 16L12 15.45 7.77 18l1.12-4.81-3.73-3.23 4.92-.42L12 5l1.92 4.53 4.92.42-3.73 3.23z" }],
  },
};

export function agendaActivityIcon(activityType) {
  return { drive: "car", sightseeing: "scenic", meal: "meal", rest: "rest", wait: "wait" }[activityType];
}

export function agendaIconType(text, mode) {
  if (/直升机/.test(text)) return "helicopter";
  if (/午餐|晚餐|早餐|咖啡|用餐|烧烤/.test(text)) return "meal";
  if (/观景|山|湖|峡湾|步道|冰川|花园|星空|观星|海边|河畔|企鹅|海狗/.test(text)) return "scenic";
  if (/航班|乘机|飞往|登机|机场/.test(text)) return "flight";
  if (/大巴|巴士|上车|乘车/.test(text)) return "bus";
  if (/出发|前往|取车|还车|自驾|开车/.test(text)) return mode === "coach" ? "bus" : "car";
  if (/霍比屯/.test(text)) return "movie";
  return "city";
}

export function getAgendaIconDefinition(type) {
  return agendaIconDefinitions[type] ?? agendaIconDefinitions.city;
}
