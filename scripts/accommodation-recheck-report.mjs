#!/usr/bin/env node

import {
  aucklandCityHotels,
  aucklandCityStay,
} from "../src/data/aucklandCityHotels.js";
import {
  regionalHotels,
  regionalStays,
} from "../src/data/regionalHotels.js";

const regionOrder = [
  "queenstown",
  "wanaka",
  "mount-cook",
  "oamaru",
  "christchurch",
  "auckland-city",
];

const hotelGroups = {
  "auckland-city": aucklandCityHotels,
  ...regionalHotels,
};
const dateRanges = {
  "auckland-city": `${aucklandCityStay.dates.checkIn}/${aucklandCityStay.dates.checkOut}`,
  ...Object.fromEntries(
    Object.entries(regionalStays).map(([region, stay]) => [
      region,
      `${stay.dates.checkIn}/${stay.dates.checkOut}`,
    ]),
  ),
};

function hasPositivePrice(rate) {
  if (!rate || typeof rate !== "object") return false;
  if ([rate.nonRefundableNzd, rate.refundableNzd].some(
    (value) => typeof value === "number" && Number.isFinite(value) && value > 0,
  )) return true;
  return (rate.rateOptions ?? []).some(
    (option) => typeof option?.nzd === "number" && Number.isFinite(option.nzd) && option.nzd > 0,
  );
}

function ratesInSnapshot(snapshot) {
  if (!snapshot || typeof snapshot !== "object") return [];
  if (snapshot.roomRates) {
    return Object.values(snapshot.roomRates).flatMap((platforms) => (
      platforms && typeof platforms === "object" ? Object.entries(platforms) : []
    ));
  }
  return snapshot.roomKey ? [["legacy", snapshot]] : [];
}

function evidenceType(hotel, dateRange) {
  if (hotel.isResearchPlaceholder) return "research-placeholder";
  if (hotel.officialStatus === "exact-date-unavailable") return "current-date-unavailable";

  const snapshot = hotel.rateSnapshots?.[dateRange];
  const rates = ratesInSnapshot(snapshot);
  if (rates.some(([platform, rate]) => platform === "official" && hasPositivePrice(rate))) {
    return "current-official-price";
  }
  if (rates.some(([, rate]) => hasPositivePrice(rate))) return "current-platform-price";
  if (snapshot?.availabilityScope === "recommended-room-starting-prices") {
    return "current-room-starting-prices";
  }
  if (snapshot?.availabilityScope === "recommended-room-unavailable-alternative-available") {
    return "current-alternative-room-available";
  }
  if (snapshot?.availabilityScope === "unmatched-room-result") {
    return "current-unmatched-room-result";
  }
  if (snapshot?.availabilityChecked === true || snapshot?.roomKey) {
    return "current-availability-only";
  }
  if (Object.keys(hotel.rateSnapshots ?? {}).length > 0) return "stale-date-snapshot";
  return "no-current-date-evidence";
}

function isSelectable(hotel) {
  return hotel.isResearchPlaceholder !== true
    && hotel.officialStatus === "exact-rate-verified";
}

function nextAction(hotel, evidence) {
  if (hotel.isResearchPlaceholder) return "replace-or-complete-target-search";
  if (hotel.officialStatus === "exact-rate-verified") return "complete";
  if (hotel.officialStatus === "exact-date-unavailable") return "complete-unavailable";
  if (hotel.officialStatus === "official-unreachable") return "complete-unreachable";
  if (hotel.officialStatus === "official-inquiry-only") return "complete-inquiry-only";
  if (hotel.officialStatus === "no-independent-official-found") return "complete-no-independent-official";
  if (evidence === "current-platform-price") return "refresh-platform-total-before-selection";
  if (evidence === "current-room-starting-prices") return "obtain-stay-total-not-starting-prices";
  if (evidence === "current-alternative-room-available") return "add-matching-room-evidence-or-retire-alternative";
  if (evidence === "current-unmatched-room-result") return "confirm-room-mapping-and-terms";
  if (evidence === "current-availability-only") return "obtain-matching-stay-total";
  return "retry-target-date-engine";
}

function entryUrl(hotel) {
  return hotel.officialBookingUrl
    ?? hotel.officialUrl
    ?? hotel.bookingUrl
    ?? hotel.agodaUrl
    ?? "";
}

function hostFor(url) {
  if (!url) return "(none)";
  try {
    return new URL(url).hostname.toLowerCase();
  } catch {
    return "(invalid-url)";
  }
}

function engineFor(host) {
  if (host.includes("airbnb.")) return "Airbnb";
  if (host === "all.accor.com") return "Accor";
  if (host.endsWith("ihg.com")) return "IHG";
  if (["www.onlinebooking.direct", "v2.onlinebooking.direct"].includes(host)) return "Resly";
  if (["book-directonline.com", "app-apac.thebookingbutton.com"].includes(host)) return "SiteMinder";
  if (host === "ibe.channex.io") return "Channex";
  if (host.endsWith("ibexres.com")) return "Ibex";
  if (host.endsWith("rmscloud.com")) return "RMS Cloud";
  if (host.includes("staah")) return "STAAH";
  if (host.endsWith("cloudbeds.com")) return "Cloudbeds";
  if (host.endsWith("ihotelier.com") || host.endsWith("travelclick.com")) return "Amadeus iHotelier";
  if (host === "app.mews.com") return "Mews";
  if (host === "www.swiftbook.io") return "SwiftBook";
  if (host === "app.thebookingfactory.com") return "The Booking Factory";
  if (host === "book.roommanager.com.au") return "RoomManager";
  if (host.endsWith("freeonlinebooking.com")) return "FreeOnlineBooking";
  if (host.endsWith("booking.com")) return "Booking.com";
  if (host.endsWith("agoda.com")) return "Agoda";
  return host;
}

function quotedDates(hotel) {
  const dates = [];
  if (/^\d{4}-\d{2}-\d{2}$/.test(hotel.officialVerifiedAt ?? "")) {
    dates.push(hotel.officialVerifiedAt);
  }
  for (const snapshot of Object.values(hotel.rateSnapshots ?? {})) {
    if (/^\d{4}-\d{2}-\d{2}$/.test(snapshot?.quotedAt ?? "")) dates.push(snapshot.quotedAt);
    for (const [, rate] of ratesInSnapshot(snapshot)) {
      if (/^\d{4}-\d{2}-\d{2}$/.test(rate?.quotedAt ?? "")) dates.push(rate.quotedAt);
    }
  }
  return dates.sort().at(-1) ?? "";
}

function searchRetained(hotel) {
  if (hotel.officialLinkRetainsSearch === true) return "true";
  if (hotel.officialLinkRetainsSearch === false) return "false";
  return "unknown";
}

function cleanCell(value) {
  return String(value ?? "").replaceAll(/[\t\r\n]+/g, " ").trim();
}

const rows = regionOrder.flatMap((region) => (
  (hotelGroups[region] ?? []).map((hotel) => {
    const url = entryUrl(hotel);
    const host = hostFor(url);
    const dateRange = dateRanges[region] ?? "";
    return {
      region,
      id: hotel.id ?? "",
      name: hotel.name ?? "",
      status: hotel.officialStatus ?? "unknown",
      placeholder: hotel.isResearchPlaceholder === true,
      dateRange,
      engine: engineFor(host),
      host,
      url,
      searchRetained: searchRetained(hotel),
      evidenceType: evidenceType(hotel, dateRange),
      lastChecked: quotedDates(hotel),
      selectable: isSelectable(hotel),
      nextAction: nextAction(hotel, evidenceType(hotel, dateRange)),
    };
  })
));

function printTsv(title, data, columns) {
  console.log(title);
  console.log(columns.join("\t"));
  for (const row of data) {
    console.log(columns.map((column) => cleanCell(row[column])).join("\t"));
  }
  console.log();
}

function summarize(data, key) {
  const groups = new Map();
  for (const row of data) {
    const summary = groups.get(row[key]) ?? {
      [key]: row[key],
      total: 0,
      placeholders: 0,
      exactRateVerified: 0,
      needsRecheck: 0,
      selectable: 0,
      requiresAction: 0,
      currentOfficialPrice: 0,
      currentPlatformPrice: 0,
      startingPricesOnly: 0,
      alternativeRoomAvailable: 0,
      unmatchedRoomResult: 0,
      availabilityOnly: 0,
      staleOrMissing: 0,
    };
    summary.total += 1;
    if (row.placeholder) summary.placeholders += 1;
    if (row.status === "exact-rate-verified") summary.exactRateVerified += 1;
    if (row.status === "needs-recheck") summary.needsRecheck += 1;
    if (row.selectable) summary.selectable += 1;
    if (row.nextAction !== "complete"
      && !row.nextAction.startsWith("complete-")) summary.requiresAction += 1;
    if (row.evidenceType === "current-official-price") summary.currentOfficialPrice += 1;
    if (row.evidenceType === "current-platform-price") summary.currentPlatformPrice += 1;
    if (row.evidenceType === "current-room-starting-prices") summary.startingPricesOnly += 1;
    if (row.evidenceType === "current-alternative-room-available") summary.alternativeRoomAvailable += 1;
    if (row.evidenceType === "current-unmatched-room-result") summary.unmatchedRoomResult += 1;
    if (row.evidenceType === "current-availability-only") summary.availabilityOnly += 1;
    if (["stale-date-snapshot", "no-current-date-evidence"].includes(row.evidenceType)) {
      summary.staleOrMissing += 1;
    }
    groups.set(row[key], summary);
  }
  return [...groups.values()];
}

const queueColumns = [
  "region",
  "id",
  "name",
  "status",
  "placeholder",
  "dateRange",
  "engine",
  "host",
  "url",
  "searchRetained",
  "evidenceType",
  "lastChecked",
  "selectable",
  "nextAction",
];
const summaryMetricColumns = [
  "total",
  "placeholders",
  "exactRateVerified",
  "needsRecheck",
  "selectable",
  "requiresAction",
  "currentOfficialPrice",
  "currentPlatformPrice",
  "startingPricesOnly",
  "alternativeRoomAvailable",
  "unmatchedRoomResult",
  "availabilityOnly",
  "staleOrMissing",
];

printTsv("Accommodation recheck queue", rows, queueColumns);
printTsv(
  "Summary by engine",
  summarize(rows, "engine").sort(
    (left, right) => right.total - left.total || left.engine.localeCompare(right.engine),
  ),
  ["engine", ...summaryMetricColumns],
);
printTsv(
  "Summary by region",
  summarize(rows, "region").sort(
    (left, right) => regionOrder.indexOf(left.region) - regionOrder.indexOf(right.region),
  ),
  ["region", ...summaryMetricColumns],
);
