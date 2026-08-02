const googleDestination = (query) => `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(query)}`;

export const flightLinks = {
  MH0523: "https://www.flightaware.com/live/flight/MAS523",
  MH0133: "https://www.flightaware.com/live/flight/MAS133",
  JQ295: "https://www.flightaware.com/live/flight/JST295",
  JQ236: "https://www.flightaware.com/live/flight/JST236",
  MH0132: "https://www.flightaware.com/live/flight/MAS132",
  MH0522: "https://www.flightaware.com/live/flight/MAS522",
};

const placeAliases = [
  ["国内航站楼", "Auckland Airport Domestic Terminal"],
  ["国际航站楼", "Auckland Airport International Terminal"],
  ["深圳机场", "Shenzhen Bao'an International Airport Terminal 3"],
  ["吉隆坡 T1", "Kuala Lumpur International Airport Terminal 1"],
  ["吉隆坡机场", "Kuala Lumpur International Airport Terminal 1"],
  ["皇后镇机场", "Queenstown Airport"],
  ["Budget 基督城机场还车", "Budget Car Rental Christchurch Airport"],
  ["基督城机场", "Christchurch Airport"],
  ["奥克兰机场", "Auckland Airport International Terminal"],
  ["奥克兰市中心酒店", "Britomart Auckland"],
  ["市中心酒店", "Britomart Auckland"],
  ["SkyCity Coach Terminal", "SkyCity Coach Terminal 102 Hobson Street Auckland"],
  ["奥克兰机场过夜候机", "Auckland Airport Domestic Terminal"],
  ["Budget 取车", "Budget Car Rental Queenstown Airport"],
  ["Budget 还车", "Budget Car Rental Christchurch Airport"],
  ["Ramada by Wyndham Queenstown Central", "Ramada by Wyndham Queenstown Central"],
  ["Wanaka Luxury Apartments", "Wanaka Luxury Apartments"],
  ["Rydges Latimer", "Rydges Latimer Christchurch"],
  ["Queenstown Gardens", "Queenstown Gardens"],
  ["皇后镇花园", "Queenstown Gardens"],
  ["Skyline", "Skyline Queenstown"],
  ["Bob’s Cove", "Bob's Cove Track"],
  ["Bennett’s Bluff", "Bennett's Bluff Lookout"],
  ["格林诺奇", "Glenorchy Wharf"],
  ["Steamer Wharf", "Steamer Wharf Queenstown"],
  ["Walter Peak", "Walter Peak High Country Farm"],
  ["箭镇", "Arrowtown New Zealand"],
  ["Crown Range", "Crown Range Summit"],
  ["Cardrona", "Cardrona Hotel"],
  ["That Wanaka Tree", "That Wanaka Tree"],
  ["Puzzling World", "Puzzling World Wanaka"],
  ["Mount Iron", "Mount Iron Track"],
  ["Lindis Pass", "Lindis Pass Viewpoint"],
  ["Omarama", "Omarama New Zealand"],
  ["Lake Pukaki", "Lake Pukaki Viewpoint"],
  ["库克山机场", "Mount Cook Airport"],
  ["The Hermitage", "The Hermitage Hotel Aoraki Mount Cook"],
  ["蒂卡波", "Church of the Good Shepherd Lake Tekapo"],
  ["奥马鲁港", "Oamaru Harbour New Zealand"],
  ["奥马鲁", "Oamaru New Zealand"],
  ["Ōamaru Blue Penguin Colony", "Oamaru Blue Penguin Colony"],
  ["Kātiki Point", "Katiki Point Lighthouse"],
  ["Riverside Market", "Riverside Market Christchurch"],
  ["雅芳河", "Avon River Christchurch"],
  ["Hagley Park", "Hagley Park Christchurch"],
  ["纸板教堂", "Cardboard Cathedral Christchurch"],
  ["Latimer Square", "Latimer Square Christchurch"],
  ["Cathedral Square", "Cathedral Square Christchurch"],
  ["New Regent Street", "New Regent Street Christchurch"],
  ["植物园", "Christchurch Botanic Gardens"],
  ["Commercial Bay", "Commercial Bay Auckland"],
  ["Queen Street", "Queen Street Auckland"],
  ["Britomart", "Britomart Transport Centre"],
  ["Westfield Newmarket", "Westfield Newmarket"],
  ["The Shire’s Rest", "The Shire's Rest Hobbiton Movie Set"],
  ["The Shire's Rest", "The Shire's Rest Hobbiton Movie Set"],
  ["霍比屯", "The Shire's Rest Hobbiton Movie Set"],
];

export function getInlineEventLink(text) {
  const flightNumber = Object.keys(flightLinks).find((number) => text.includes(number));
  if (flightNumber) {
    return { label: `查看 ${flightNumber} 航班`, url: flightLinks[flightNumber] };
  }

  const place = placeAliases.find(([alias]) => text.includes(alias));
  if (place) {
    return { label: `导航到 ${place[0]}`, url: googleDestination(place[1]) };
  }

  return null;
}

function findOccurrences(text, value, link) {
  const occurrences = [];
  let fromIndex = 0;

  while (fromIndex < text.length) {
    const start = text.indexOf(value, fromIndex);
    if (start === -1) break;
    occurrences.push({
      ...link,
      end: start + value.length,
      start,
      text: value,
    });
    fromIndex = start + value.length;
  }

  return occurrences;
}

export function getInlineEventParts(text) {
  const candidates = [
    ...Object.entries(flightLinks).flatMap(([flightNumber, url]) => findOccurrences(text, flightNumber, {
      kind: "flight",
      label: `在 FlightAware 查看 ${flightNumber}（临近出发更新）`,
      url,
    })),
    ...placeAliases.flatMap(([alias, destination]) => findOccurrences(text, alias, {
      kind: "place",
      label: `在 Google 地图中将 ${alias} 设为目的地`,
      url: googleDestination(destination),
    })),
  ].sort((left, right) => left.start - right.start || right.text.length - left.text.length);

  const matches = [];
  candidates.forEach((candidate) => {
    if (matches.some((match) => candidate.start < match.end && candidate.end > match.start)) return;
    matches.push(candidate);
  });
  matches.sort((left, right) => left.start - right.start);

  if (!matches.length) return [{ text }];

  const parts = [];
  let cursor = 0;
  matches.forEach((match) => {
    if (match.start > cursor) parts.push({ text: text.slice(cursor, match.start) });
    parts.push(match);
    cursor = match.end;
  });
  if (cursor < text.length) parts.push({ text: text.slice(cursor) });

  return parts;
}
