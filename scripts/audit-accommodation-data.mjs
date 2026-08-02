#!/usr/bin/env node

import { createHash } from "node:crypto";
import { readFile, stat } from "node:fs/promises";
import process from "node:process";
import {
  agodaUrlForStay,
  bookingUrlForStay,
} from "../src/data/aucklandAirportHotels.js";
import {
  aucklandCityHotels,
  aucklandCityStay,
} from "../src/data/aucklandCityHotels.js";
import { regionalHotels, regionalStays } from "../src/data/regionalHotels.js";
import { accommodationImageSources } from "../src/data/accommodationImageSources.js";

const imagePrefix = "/new-zealand-slow-trip-2026/images/hotels/";
const dataFiles = [
  new URL("../src/data/aucklandAirportHotels.js", import.meta.url),
  new URL("../src/data/aucklandCityHotels.js", import.meta.url),
  new URL("../src/data/aucklandCityAdditionalHotels.js", import.meta.url),
  new URL("../src/data/christchurchHotels.js", import.meta.url),
  new URL("../src/data/christchurchHomeAdditionalHotels.js", import.meta.url),
  new URL("../src/data/oamaruHomeAdditionalHotels.js", import.meta.url),
  new URL("../src/data/queenstownAdditionalHotels.js", import.meta.url),
  new URL("../src/data/regionalHotels.js", import.meta.url),
  new URL("../src/components/HotelComparisonDialog.jsx", import.meta.url),
];
const forbiddenPhotoClaims = [
  "平台未提供可核验的对应房型图",
  "平台没有对应房型图",
  "平台未提供房型图",
];
const allowedOfficialStatuses = new Set([
  "needs-recheck",
  "exact-rate-verified",
  "exact-date-unavailable",
  "no-independent-official-found",
  "official-inquiry-only",
  "official-unreachable",
]);
const minimumResearchedOptionsPerRegion = 10;
// Three images only show that a listing exists; they are not enough to compare
// the room, bathroom and shared facilities. Five is the minimum useful gallery.
const minimumReviewedPhotosPerProperty = 5;
const allowedStayTypes = new Set(["hotel", "motel", "home"]);

const hotelGroups = {
  "auckland-city": aucklandCityHotels,
  ...regionalHotels,
};
const officialStayRanges = {
  "auckland-city": `${aucklandCityStay.dates.checkIn}/${aucklandCityStay.dates.checkOut}`,
  ...Object.fromEntries(
    Object.entries(regionalStays).map(([group, stay]) => [
      group,
      `${stay.dates.checkIn}/${stay.dates.checkOut}`,
    ]),
  ),
};

const errors = [];
const warnings = [];
const seenHotelIds = new Set();
const seenHotelNames = new Map();
const seenPropertyEntryUrls = new Map();
const reviewedImageHashesByProperty = new Map();
const hotelDialogSource = await readFile(
  new URL("../src/components/HotelComparisonDialog.jsx", import.meta.url),
  "utf8",
);
const bookingPanelSource = await readFile(
  new URL("../src/components/panels/BookingPanel.jsx", import.meta.url),
  "utf8",
);
const accommodationMapSource = await readFile(
  new URL("../src/components/AccommodationMap.jsx", import.meta.url),
  "utf8",
);

function hasText(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function hasEnglishText(value) {
  return hasText(value) && !/[\u3400-\u9fff]/u.test(value);
}

function auditBilingualTextPair(chinese, english, path) {
  if (!hasText(chinese)) errors.push(`${path}: Chinese text is required`);
  if (!hasEnglishText(english)) errors.push(`${path}: independently written English text is required`);
}

function auditBilingualList(chinese, english, path, { minimum = 1 } = {}) {
  if (!Array.isArray(chinese) || chinese.length < minimum || chinese.some((item) => !hasText(item))) {
    errors.push(`${path}: requires at least ${minimum} valid Chinese item${minimum === 1 ? "" : "s"}`);
    return;
  }
  if (!Array.isArray(english)
    || english.length !== chinese.length
    || english.some((item) => !hasEnglishText(item))) {
    errors.push(`${path}: English items must be complete, independently written, and aligned one-to-one`);
  }
}

function rateHasPrice(rate) {
  const legacyPrice = [rate.nonRefundableNzd, rate.refundableNzd].some(
    (value) => typeof value === "number" && Number.isFinite(value) && value > 0,
  );
  const optionPrice = (rate.rateOptions ?? []).some(
    (option) => typeof option?.nzd === "number" && Number.isFinite(option.nzd) && option.nzd > 0,
  );
  return legacyPrice || optionPrice;
}

function countOfficialRates(hotel) {
  let count = 0;
  for (const snapshot of Object.values(hotel.rateSnapshots ?? {})) {
    for (const platforms of Object.values(snapshot?.roomRates ?? {})) {
      if (platforms?.official) count += 1;
    }
  }
  return count;
}

function countOfficialRatesForRange(hotel, dateRange) {
  const snapshot = hotel.rateSnapshots?.[dateRange];
  return Object.values(snapshot?.roomRates ?? {}).filter(
    (platforms) => platforms?.official,
  ).length;
}

function isValidHttpUrl(value) {
  if (!hasText(value)) return false;
  try {
    return ["http:", "https:"].includes(new URL(value).protocol);
  } catch {
    return false;
  }
}

function isIsoDate(value) {
  return /^\d{4}-\d{2}-\d{2}(?:T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z)?$/.test(value ?? "")
    && !Number.isNaN(Date.parse(value));
}

function isNonFutureIsoDate(value) {
  if (!isIsoDate(value)) return false;
  // Research is maintained in Asia/Shanghai. UTC can still be on the previous
  // calendar day shortly after midnight locally, which would reject a valid
  // same-day verification date.
  const today = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
  return value.slice(0, 10) <= today;
}

function distanceMetres([lat1, lon1], [lat2, lon2]) {
  const toRadians = (degrees) => degrees * Math.PI / 180;
  const earthRadius = 6371000;
  const latitudeDelta = toRadians(lat2 - lat1);
  const longitudeDelta = toRadians(lon2 - lon1);
  const a = Math.sin(latitudeDelta / 2) ** 2
    + Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2))
    * Math.sin(longitudeDelta / 2) ** 2;
  return earthRadius * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function isConcreteImageSourceUrl(value) {
  if (!isValidHttpUrl(value)) return false;
  const url = new URL(value);
  if (/(^|\.)booking\.com$/i.test(url.hostname)) return url.pathname.includes("/hotel/");
  if (/(^|\.)agoda\.com$/i.test(url.hostname)) return url.pathname.includes("/hotel/");
  if (/(^|\.)airbnb\.[^/]+$/i.test(url.hostname)) return /\/rooms\/\d+/i.test(url.pathname);
  return url.pathname !== "/";
}

function normalizedPropertyName(value) {
  return value
    ?.normalize("NFKC")
    .toLocaleLowerCase("en-NZ")
    .replace(/[^a-z0-9\p{L}]+/gu, " ")
    .trim();
}

function normalizedPropertyEntryUrl(value) {
  if (!isValidHttpUrl(value)) return undefined;
  const url = new URL(value);
  for (const key of [...url.searchParams.keys()]) {
    if ([
      "checkin", "checkout", "checkIn", "checkOut", "dateIn", "nights",
      "adults", "children", "infants", "rooms", "no_rooms", "group_adults",
      "group_children", "compositions", "currency", "los",
    ].includes(key)) url.searchParams.delete(key);
  }
  url.hash = "";
  return `${url.hostname.toLowerCase()}${url.pathname.replace(/\/+$/, "")}${url.search}`;
}

function embeddedHttpUrl(value) {
  if (!hasText(value)) return undefined;
  const matches = value.match(/https?:\/\/\S+/g) ?? [];
  return matches.length === 1 ? matches[0] : undefined;
}

function imageProvenance(photo, fileName) {
  const manifest = accommodationImageSources[fileName] ?? {};
  return {
    propertyId: photo.propertyId ?? manifest.propertyId,
    reviewedAt: photo.reviewedAt ?? manifest.reviewedAt,
    sourceUrl: photo.sourceUrl
      ?? (isValidHttpUrl(photo.source) ? photo.source : undefined)
      ?? embeddedHttpUrl(photo.source)
      ?? manifest.sourceUrl,
  };
}

function auditGeneratedPlatformUrl(rate, path, hotel, checkIn, checkOut) {
  try {
    if (/Booking\.com/i.test(rate.source ?? "")) {
      if (!hasText(hotel.bookingUrl)) {
        errors.push(`${path}: Booking.com rate requires a real listing URL`);
        return;
      }
      const url = new URL(bookingUrlForStay(hotel, checkIn, checkOut));
      if (!/(^|\.)booking\.com$/i.test(url.hostname) || !url.pathname.includes("/hotel/")) errors.push(`${path}: invalid Booking.com hotel URL`);
      if (url.searchParams.get("checkin") !== checkIn || url.searchParams.get("checkout") !== checkOut) errors.push(`${path}: Booking.com URL dates do not match the rate snapshot`);
      if (url.searchParams.get("group_adults") !== "2" || url.searchParams.get("no_rooms") !== "1") errors.push(`${path}: Booking.com URL must carry 2 adults and 1 room`);
    }
    if (/Agoda/i.test(rate.source ?? "")) {
      if (!hasText(hotel.agodaUrl)) {
        errors.push(`${path}: Agoda rate requires a real listing URL`);
        return;
      }
      const url = new URL(agodaUrlForStay(hotel, checkIn, checkOut));
      if (!/(^|\.)agoda\.com$/i.test(url.hostname) || !url.pathname.includes("/hotel/")) errors.push(`${path}: invalid Agoda hotel URL`);
      if (url.searchParams.get("checkIn") !== checkIn || url.searchParams.get("checkOut") !== checkOut) errors.push(`${path}: Agoda URL dates do not match the rate snapshot`);
      if (url.searchParams.get("adults") !== "2" || url.searchParams.get("rooms") !== "1") errors.push(`${path}: Agoda URL must carry 2 adults and 1 room`);
    }
  } catch (error) {
    errors.push(`${path}: platform URL could not be generated (${error.message})`);
  }
}

function auditRate(rate, path, hotel, checkIn, checkOut, expectedRoomKey) {
  if (!rate || typeof rate !== "object") {
    errors.push(`${path}: rate must be an object`);
    return;
  }
  if (!hasText(rate.source)) errors.push(`${path}: source is required`);
  if (!hasEnglishText(rate.sourceEn)) errors.push(`${path}: independently written English source label is required`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(rate.quotedAt ?? "")) errors.push(`${path}: quotedAt must be an ISO date`);
  if (/^\d{4}-\d{2}-\d{2}$/.test(rate.quotedAt ?? "") && !isNonFutureIsoDate(rate.quotedAt)) {
    errors.push(`${path}: quotedAt cannot be in the future`);
  }
  if (!rateHasPrice(rate)) errors.push(`${path}: requires a verified total price`);
  auditBilingualTextPair(rate.room, rate.roomEn, `${path}/room`);
  auditBilingualTextPair(rate.payment, rate.paymentEn, `${path}/payment`);
  auditBilingualTextPair(rate.breakfast, rate.breakfastEn, `${path}/breakfast`);
  for (const [optionIndex, option] of (rate.rateOptions ?? []).entries()) {
    if (!hasText(option?.label) || !hasText(option?.labelEn)) errors.push(`${path}/rate option ${optionIndex + 1}: bilingual labels are required`);
    if (!hasText(option?.detail) || !hasText(option?.detailEn)) errors.push(`${path}/rate option ${optionIndex + 1}: bilingual details are required`);
    if (typeof option?.nzd !== "number" || !Number.isFinite(option.nzd) || option.nzd <= 0) errors.push(`${path}/rate option ${optionIndex + 1}: nzd must be a positive number`);
  }
  if (expectedRoomKey && rate.roomKey !== expectedRoomKey) errors.push(`${path}: rate roomKey must match ${expectedRoomKey}`);
  auditGeneratedPlatformUrl(rate, path, hotel, checkIn, checkOut);
}

async function auditImage(photo, path, { propertyId, requireProvenance = false } = {}) {
  if (!hasText(photo?.src)) {
    errors.push(`${path}: src is required`);
    return null;
  }
  if (!hasText(photo.label)) errors.push(`${path}: label is required`);
  if (!hasEnglishText(photo.labelEn)) errors.push(`${path}: independently written English label is required`);
  if (!hasText(photo.source)) errors.push(`${path}: source is required`);
  if (!hasEnglishText(photo.sourceEn)) errors.push(`${path}: independently written English source label is required`);
  if (!photo.src.startsWith(imagePrefix)) {
    errors.push(`${path}: hotel photos must use a local reviewed asset`);
    return null;
  }
  const fileName = photo.src.slice(imagePrefix.length);
  const fileUrl = new URL(`../public/images/hotels/${fileName}`, import.meta.url);
  let hash;
  try {
    const info = await stat(fileUrl);
    if (!info.isFile() || info.size === 0) errors.push(`${path}: local image is empty`);
    if (info.isFile() && info.size > 0) {
      hash = createHash("sha256").update(await readFile(fileUrl)).digest("hex");
    }
  } catch {
    errors.push(`${path}: local image file is missing (${fileName})`);
  }
  let provenanceValid = !requireProvenance;
  if (requireProvenance) {
    const provenance = imageProvenance(photo, fileName);
    provenanceValid = true;
    if (!isConcreteImageSourceUrl(provenance.sourceUrl)) {
      errors.push(`${path}: reviewed image requires an exact concrete http(s) source URL`);
      provenanceValid = false;
    }
    if (!isIsoDate(provenance.reviewedAt)) {
      errors.push(`${path}: reviewed image requires an ISO reviewedAt date`);
      provenanceValid = false;
    } else if (!isNonFutureIsoDate(provenance.reviewedAt)) {
      errors.push(`${path}: reviewed image reviewedAt cannot be in the future`);
      provenanceValid = false;
    }
    if (provenance.propertyId !== propertyId) {
      errors.push(`${path}: reviewed image propertyId must match ${propertyId}`);
      provenanceValid = false;
    }
  }
  return { fileName, hash, provenanceValid };
}

const imagePropertyIds = new Map();
// The airport comparison is archived after the itinerary changed to an
// overnight terminal wait. Keep validating its saved image provenance without
// treating those hotels as current stay options or current rate targets.
const provenanceHotelGroups = {
  "auckland-airport-archive": (await import("../src/data/aucklandAirportHotels.js")).aucklandAirportHotels,
  ...hotelGroups,
};
for (const hotels of Object.values(provenanceHotelGroups)) {
  for (const hotel of hotels) {
    const photos = [
      ...(hotel.hotelImages ?? []),
      ...(hotel.roomTypes ?? []).flatMap((room) => room.images ?? []),
    ];
    for (const photo of photos) {
      if (!photo?.src?.startsWith(imagePrefix)) continue;
      const fileName = photo.src.slice(imagePrefix.length);
      const owners = imagePropertyIds.get(fileName) ?? new Set();
      owners.add(hotel.id);
      imagePropertyIds.set(fileName, owners);
    }
  }
}

for (const [fileName, provenance] of Object.entries(accommodationImageSources)) {
  if (!isConcreteImageSourceUrl(provenance?.sourceUrl)) {
    errors.push(`image provenance/${fileName}: sourceUrl must be a concrete http(s) source`);
  }
  if (!isIsoDate(provenance?.reviewedAt)) {
    errors.push(`image provenance/${fileName}: reviewedAt must be an ISO date`);
  } else if (!isNonFutureIsoDate(provenance.reviewedAt)) {
    errors.push(`image provenance/${fileName}: reviewedAt cannot be in the future`);
  }
  if (!hasText(provenance?.propertyId)) {
    errors.push(`image provenance/${fileName}: propertyId is required`);
  } else if (!imagePropertyIds.get(fileName)?.has(provenance.propertyId)) {
    errors.push(`image provenance/${fileName}: propertyId does not match a current image owner`);
  }
}

for (const [group, hotels] of Object.entries(hotelGroups)) {
  const visibleHotels = hotels.filter(
    (hotel) => !hotel.excludedByPreference && (!hotel.isAirbnb || hotel.isVerifiedListing),
  );
  const selectableHotels = visibleHotels.filter(
    (hotel) => !hotel.isResearchPlaceholder && hotel.officialStatus !== "exact-date-unavailable",
  );
  if (visibleHotels.length < minimumResearchedOptionsPerRegion) {
    errors.push(`${group}: requires at least ${minimumResearchedOptionsPerRegion} researched visible options; found ${visibleHotels.length}`);
  }
  const representedStayTypes = new Set(
    selectableHotels.flatMap((hotel) => hotel.stayTypes ?? [hotel.stayType]).filter(Boolean),
  );
  for (const requiredStayType of ["hotel", "home"]) {
    if (!representedStayTypes.has(requiredStayType)) {
      errors.push(`${group}: selectable options must include at least one ${requiredStayType}; found ${[...representedStayTypes].join(", ") || "none"}`);
    }
  }

  for (const hotel of hotels) {
    const hotelPath = `${group}/${hotel.id ?? hotel.name}`;
    if (!hasText(hotel.id)) errors.push(`${hotelPath}: hotel id is required`);
    if (seenHotelIds.has(hotel.id)) errors.push(`${hotelPath}: duplicate hotel id`);
    seenHotelIds.add(hotel.id);

    const normalizedName = normalizedPropertyName(hotel.name);
    if (normalizedName) {
      const previous = seenHotelNames.get(normalizedName);
      if (previous && previous !== hotel.id) {
        errors.push(`${hotelPath}: duplicate accommodation name already used by ${previous}`);
      } else {
        seenHotelNames.set(normalizedName, hotel.id);
      }
    }
    const entryUrl = normalizedPropertyEntryUrl(
      hotel.officialBookingUrl ?? hotel.officialUrl ?? hotel.bookingUrl,
    );
    if (entryUrl) {
      const previous = seenPropertyEntryUrls.get(entryUrl);
      if (previous && previous !== hotel.id) {
        errors.push(`${hotelPath}: duplicate accommodation entry URL already used by ${previous}`);
      } else {
        seenPropertyEntryUrls.set(entryUrl, hotel.id);
      }
    }

    const isVisible = visibleHotels.includes(hotel);
    if (hotel.isResearchPlaceholder && hotel.rateSnapshots != null) {
      errors.push(`${hotelPath}: research placeholder cannot carry a selectable rate or availability snapshot`);
    }
    if (isVisible && hotel.officialStatus !== "exact-date-unavailable") {
      for (const [field, value] of Object.entries({ name: hotel.name, mapQuery: hotel.mapQuery })) {
        if (!hasText(value)) errors.push(`${hotelPath}: visible option requires ${field}`);
      }
      if (!hasEnglishText(hotel.name) && !hasEnglishText(hotel.nameEn)) {
        errors.push(`${hotelPath}: a display name containing Han text requires an independent English nameEn`);
      }
      auditBilingualTextPair(hotel.recommendation, hotel.recommendationEn, `${hotelPath}/recommendation`);
      auditBilingualTextPair(hotel.summary, hotel.summaryEn, `${hotelPath}/summary`);
      auditBilingualTextPair(hotel.access, hotel.accessEn, `${hotelPath}/access`);
      auditBilingualTextPair(hotel.parking, hotel.parkingEn, `${hotelPath}/parking`);
      if (!Array.isArray(hotel.position)
        || hotel.position.length !== 2
        || !hotel.position.every((coordinate) => typeof coordinate === "number" && Number.isFinite(coordinate))) {
        errors.push(`${hotelPath}: visible option requires a valid [latitude, longitude] position`);
      }
      auditBilingualList(hotel.strengths, hotel.strengthsEn, `${hotelPath}/strengths`, { minimum: 2 });
      auditBilingualList(hotel.cautions, hotel.cautionsEn, `${hotelPath}/cautions`, { minimum: 2 });
      if (!Array.isArray(hotel.nearbyAttractions) || hotel.nearbyAttractions.length < 2) {
        errors.push(`${hotelPath}: visible option requires at least two itinerary-relevant nearby attractions`);
      } else {
        for (const [attractionIndex, attraction] of hotel.nearbyAttractions.entries()) {
          const attractionPath = `${hotelPath}/attraction ${attractionIndex + 1}`;
          auditBilingualTextPair(attraction.name, attraction.nameEn, `${attractionPath}/name`);
          auditBilingualTextPair(attraction.distance, attraction.distanceEn, `${attractionPath}/distance`);
          auditBilingualTextPair(attraction.travelTime, attraction.travelTimeEn, `${attractionPath}/travel time`);
          if (!hasText(attraction.destinationQuery)) errors.push(`${attractionPath}: destinationQuery is required`);
        }
      }
      if (!Array.isArray(hotel.roomTypes) || hotel.roomTypes.length === 0) {
        errors.push(`${hotelPath}: visible option requires at least one recommended room type`);
      }
      if (selectableHotels.includes(hotel)) {
        auditBilingualTextPair(hotel.availabilityNote, hotel.availabilityNoteEn, `${hotelPath}/availability note`);
      }
      if (hotel.research?.verdict) {
        auditBilingualTextPair(hotel.research.verdict, hotel.research.verdictEn, `${hotelPath}/destination research verdict`);
      }
      if (!allowedStayTypes.has(hotel.stayType)) {
        errors.push(`${hotelPath}: visible option requires an explicit stayType of hotel, motel, or home`);
      }
      if (hotel.stayTypes !== undefined) {
        if (!Array.isArray(hotel.stayTypes) || hotel.stayTypes.length < 2) {
          errors.push(`${hotelPath}: stayTypes must be an array with at least two filter categories`);
        } else {
          const uniqueStayTypes = new Set(hotel.stayTypes);
          if (uniqueStayTypes.size !== hotel.stayTypes.length) {
            errors.push(`${hotelPath}: stayTypes cannot contain duplicate categories`);
          }
          for (const stayType of hotel.stayTypes) {
            if (!allowedStayTypes.has(stayType)) {
              errors.push(`${hotelPath}: stayTypes contains unsupported category ${stayType}`);
            }
          }
          if (!uniqueStayTypes.has(hotel.stayType)) {
            errors.push(`${hotelPath}: stayTypes must include the primary stayType ${hotel.stayType}`);
          }
        }
      }
      if (!Array.isArray(hotel.ratings) || hotel.ratings.length === 0) {
        errors.push(`${hotelPath}: visible option requires at least one source-labelled guest rating`);
      } else if (!hotel.ratings.some((rating) => /\d+(?:\.\d+)?/.test(rating?.score ?? "")
        && /\d[\d,]*/.test(rating?.reviews ?? ""))) {
        errors.push(`${hotelPath}: visible option requires a numeric guest score and review count; availability or editorial labels are not ratings`);
      }
      if (![hotel.officialBookingUrl, hotel.officialUrl, hotel.bookingUrl].some(isValidHttpUrl)) {
        errors.push(`${hotelPath}: visible option requires a valid official or Booking.com entry URL`);
      }
    }

    const officialRateCount = countOfficialRates(hotel);
    const officialEntryUrl = hotel.officialBookingUrl ?? hotel.officialUrl;
    const expectedStayRange = officialStayRanges[group];
    if (selectableHotels.includes(hotel)) {
      const expectedSnapshot = hotel.rateSnapshots?.[expectedStayRange];
      const hasCurrentDateEvidence = expectedSnapshot && (
        Object.keys(expectedSnapshot.roomRates ?? {}).length > 0
        || hasText(expectedSnapshot.roomKey)
      );
      if (!hasCurrentDateEvidence) {
        errors.push(`${hotelPath}: selectable option requires a rate or availability snapshot for current stay ${expectedStayRange}`);
      }
      if (!/^\d{4}-\d{2}-\d{2}$/.test(hotel.officialVerifiedAt ?? "")) {
        errors.push(`${hotelPath}: selectable option requires an ISO availability verification date`);
      }
      if (!hasText(hotel.officialStatusDetail) || !hasText(hotel.officialStatusEn)) {
        errors.push(`${hotelPath}: selectable option requires bilingual current-date availability status`);
      }
    }
    if (hotel.officialLinkRetainsSearch === false) {
      if (!hasText(hotel.officialLinkNote) || !hasText(hotel.officialLinkNoteEn)) {
        errors.push(`${hotelPath}: an official link that does not retain the search requires bilingual reselection guidance`);
      }
      if (!hasText(hotel.officialLinkLabel) || !hasText(hotel.officialLinkLabelEn)) {
        errors.push(`${hotelPath}: an official link that does not retain the search requires bilingual link labels`);
      }
    }
    if (hotel.officialStatus != null && !allowedOfficialStatuses.has(hotel.officialStatus)) {
      errors.push(`${hotelPath}: officialStatus must be one of ${[...allowedOfficialStatuses].join(", ")}`);
    }
    if (hotel.officialStatus === "exact-date-unavailable") {
      if (!hasText(hotel.officialStatusDetail)) errors.push(`${hotelPath}: exact-date-unavailable requires officialStatusDetail`);
      if (!hasText(hotel.officialStatusEn)) errors.push(`${hotelPath}: exact-date-unavailable requires officialStatusEn`);
      if (!/^\d{4}-\d{2}-\d{2}$/.test(hotel.officialVerifiedAt ?? "")) errors.push(`${hotelPath}: exact-date-unavailable requires an ISO officialVerifiedAt date`);
      if (!isValidHttpUrl(officialEntryUrl)) errors.push(`${hotelPath}: exact-date-unavailable requires a valid officialBookingUrl or officialUrl`);
      if (officialRateCount > 0) errors.push(`${hotelPath}: exact-date-unavailable cannot carry an official rate`);
    }
    if (hotel.officialStatus === "official-unreachable") {
      if (!hasText(hotel.officialStatusDetail)) errors.push(`${hotelPath}: official-unreachable requires officialStatusDetail`);
      if (!hasText(hotel.officialStatusEn)) errors.push(`${hotelPath}: official-unreachable requires officialStatusEn`);
      if (!/^\d{4}-\d{2}-\d{2}$/.test(hotel.officialVerifiedAt ?? "")) errors.push(`${hotelPath}: official-unreachable requires an ISO officialVerifiedAt date`);
      if (!isValidHttpUrl(hotel.officialUrl)) errors.push(`${hotelPath}: official-unreachable requires a valid officialUrl`);
      if (officialRateCount > 0) errors.push(`${hotelPath}: official-unreachable cannot carry an official rate`);
    }
    if (hotel.officialStatus === "official-inquiry-only") {
      if (!hasText(hotel.officialStatusDetail)) errors.push(`${hotelPath}: official-inquiry-only requires officialStatusDetail`);
      if (!hasText(hotel.officialStatusEn)) errors.push(`${hotelPath}: official-inquiry-only requires officialStatusEn`);
      if (!/^\d{4}-\d{2}-\d{2}$/.test(hotel.officialVerifiedAt ?? "")) errors.push(`${hotelPath}: official-inquiry-only requires an ISO officialVerifiedAt date`);
      if (!isValidHttpUrl(hotel.officialUrl)) errors.push(`${hotelPath}: official-inquiry-only requires a valid officialUrl`);
      if (officialRateCount > 0) errors.push(`${hotelPath}: official-inquiry-only cannot carry an official rate`);
    }
    if (hotel.officialStatus === "no-independent-official-found") {
      if (!hasText(hotel.officialStatusDetail)) errors.push(`${hotelPath}: no-independent-official-found requires officialStatusDetail`);
      if (!hasText(hotel.officialStatusEn)) errors.push(`${hotelPath}: no-independent-official-found requires officialStatusEn`);
      if (!/^\d{4}-\d{2}-\d{2}$/.test(hotel.officialVerifiedAt ?? "")) errors.push(`${hotelPath}: no-independent-official-found requires an ISO officialVerifiedAt date`);
      if (officialRateCount > 0) errors.push(`${hotelPath}: no-independent-official-found cannot carry an official rate`);
    }
    if (hotel.officialStatus === "exact-rate-verified") {
      if (!hasText(hotel.officialStatusDetail)) errors.push(`${hotelPath}: exact-rate-verified requires officialStatusDetail`);
      if (!hasText(hotel.officialStatusEn)) errors.push(`${hotelPath}: exact-rate-verified requires officialStatusEn`);
      if (!/^\d{4}-\d{2}-\d{2}$/.test(hotel.officialVerifiedAt ?? "")) errors.push(`${hotelPath}: exact-rate-verified requires an ISO officialVerifiedAt date`);
      if (!isValidHttpUrl(officialEntryUrl)) errors.push(`${hotelPath}: exact-rate-verified requires a valid officialBookingUrl or officialUrl`);
      if (officialRateCount === 0) errors.push(`${hotelPath}: exact-rate-verified requires at least one official rate`);
      if (expectedStayRange && countOfficialRatesForRange(hotel, expectedStayRange) === 0) {
        errors.push(`${hotelPath}: exact-rate-verified requires an official rate for current stay ${expectedStayRange}`);
      }
    }

    if (hotel.isAirbnb) {
      if (hotel.isVerifiedListing !== true) errors.push(`${hotelPath}: Airbnb must be marked as a verified concrete listing`);
      const listingUrl = hotel.officialUrl ?? hotel.bookingUrl;
      if (!hasText(listingUrl) || !/airbnb\.[^/]+\/rooms\/\d+/i.test(listingUrl)) {
        errors.push(`${hotelPath}: Airbnb requires a direct /rooms/<id> URL`);
      } else {
        const url = new URL(listingUrl);
        if (!url.searchParams.get("check_in") || !url.searchParams.get("check_out")) errors.push(`${hotelPath}: Airbnb URL requires exact dates`);
        if (url.searchParams.get("adults") !== "2") errors.push(`${hotelPath}: Airbnb URL requires 2 adults`);
      }
    }

    if (hotel.research?.url) {
      const researchUrl = new URL(hotel.research.url);
      if (!/(^|\.)xiaohongshu\.com$/i.test(researchUrl.hostname)) errors.push(`${hotelPath}: social research must use a Xiaohongshu URL`);
      if (!researchUrl.pathname.startsWith("/search_result")) errors.push(`${hotelPath}: accommodation research must link to a durable Xiaohongshu search page, not a single post`);
      if (!hasText(researchUrl.searchParams.get("keyword"))) errors.push(`${hotelPath}: Xiaohongshu research URL requires a keyword`);
    }

    const roomKeys = new Set();
    const countedReviewedImages = [];
    const shouldCountReviewedImages = isVisible && hotel.officialStatus !== "exact-date-unavailable";
    for (const [roomIndex, room] of (hotel.roomTypes ?? []).entries()) {
      const roomPath = `${hotelPath}/room ${roomIndex + 1} (${room.name ?? "unnamed"})`;
      if (!hasText(room.rateKey)) errors.push(`${roomPath}: rateKey is required`);
      if (roomKeys.has(room.rateKey)) errors.push(`${roomPath}: duplicate rateKey`);
      roomKeys.add(room.rateKey);
      auditBilingualTextPair(room.name, room.nameEn, `${roomPath}/name`);
      auditBilingualTextPair(room.bed, room.bedEn, `${roomPath}/bed`);
      if (selectableHotels.includes(hotel)) {
        auditBilingualTextPair(room.size, room.sizeEn, `${roomPath}/size`);
      } else if (room.size != null || room.sizeEn != null) {
        auditBilingualTextPair(room.size, room.sizeEn, `${roomPath}/size`);
      }
      auditBilingualList(room.facilities, room.facilitiesEn, `${roomPath}/facilities`);
      if (room.photoNote != null || room.photoNoteEn != null) {
        auditBilingualTextPair(room.photoNote, room.photoNoteEn, `${roomPath}/photo note`);
      }
      if (!Array.isArray(room.images)) errors.push(`${roomPath}: images must be an array`);
      if (room.photosVerified === true && !(room.images?.length > 0)) errors.push(`${roomPath}: photosVerified requires room photos`);
      if (isVisible && hotel.officialStatus !== "exact-date-unavailable") {
        if (room.photosVerified !== true) {
          errors.push(`${roomPath}: every displayed room for a selectable stay requires verified room-specific photos`);
        } else if (!(room.images?.length > 0)) {
          errors.push(`${roomPath}: every displayed room for a selectable stay requires at least one verified room-specific photo`);
        }
      } else if (room.photosVerified !== true) {
        warnings.push(`${roomPath}: non-selectable reference room has no verified room-specific photos`);
      }
      for (const [imageIndex, photo] of (room.images ?? []).entries()) {
        const counted = shouldCountReviewedImages && room.photosVerified === true;
        const result = await auditImage(photo, `${roomPath}/image ${imageIndex + 1}`, {
          propertyId: hotel.id,
          requireProvenance: counted,
        });
        if (counted && result) countedReviewedImages.push(result);
      }
    }
    for (const [ratingIndex, rating] of (hotel.ratings ?? []).entries()) {
      const ratingPath = `${hotelPath}/rating ${ratingIndex + 1}`;
      auditBilingualTextPair(rating.platform, rating.platformEn, `${ratingPath}/platform`);
      auditBilingualTextPair(rating.score, rating.scoreEn, `${ratingPath}/score`);
      auditBilingualTextPair(rating.reviews, rating.reviewsEn, `${ratingPath}/reviews`);
      if (!/\d+(?:\.\d+)?/.test(rating?.score ?? "")) {
        errors.push(`${ratingPath}: score must be a numeric guest score, not an availability or editorial label`);
      }
      if (!/\d[\d,]*/.test(rating?.reviews ?? "")) {
        errors.push(`${ratingPath}: reviews must include a numeric guest review count`);
      }
      if (!isConcreteImageSourceUrl(rating.sourceUrl)) {
        errors.push(`${ratingPath}: guest rating requires an exact concrete source URL for this property`);
      }
      if (!isIsoDate(rating.reviewedAt)) {
        errors.push(`${ratingPath}: guest rating requires an ISO reviewedAt date`);
      } else if (!isNonFutureIsoDate(rating.reviewedAt)) {
        errors.push(`${ratingPath}: guest rating reviewedAt cannot be in the future`);
      }
      if (rating.verifiedPosition != null) {
        if (!Array.isArray(rating.verifiedPosition)
          || rating.verifiedPosition.length !== 2
          || !rating.verifiedPosition.every((coordinate) => Number.isFinite(coordinate))) {
          errors.push(`${ratingPath}: verifiedPosition must be a valid [latitude, longitude] pair`);
        } else if (Array.isArray(hotel.position)
          && hotel.position.length === 2
          && distanceMetres(hotel.position, rating.verifiedPosition) > 1500) {
          errors.push(`${ratingPath}: verified rating coordinates are more than 1.5 km from the accommodation map position`);
        }
      }
    }
    for (const [imageIndex, photo] of (hotel.hotelImages ?? []).entries()) {
      const result = await auditImage(photo, `${hotelPath}/hotel image ${imageIndex + 1}`, {
        propertyId: hotel.id,
        requireProvenance: shouldCountReviewedImages,
      });
      if (shouldCountReviewedImages && result) countedReviewedImages.push(result);
    }
    if (shouldCountReviewedImages) {
      const hashes = new Map();
      for (const imageResult of countedReviewedImages) {
        if (!imageResult.hash) continue;
        const matchingFiles = hashes.get(imageResult.hash) ?? [];
        matchingFiles.push(imageResult.fileName);
        hashes.set(imageResult.hash, matchingFiles);
      }
      for (const matchingFiles of hashes.values()) {
        if (matchingFiles.length > 1) {
          errors.push(`${hotelPath}: duplicate SHA-256 image content cannot be counted twice (${matchingFiles.join(", ")})`);
        }
      }
      const reviewedPhotoCount = new Set(
        countedReviewedImages
          .filter((imageResult) => imageResult.hash && imageResult.provenanceValid)
          .map((imageResult) => imageResult.hash),
      ).size;
      if (reviewedPhotoCount < minimumReviewedPhotosPerProperty) {
        errors.push(`${hotelPath}: visible option requires at least ${minimumReviewedPhotosPerProperty} unique, source-traceable reviewed local photos; found ${reviewedPhotoCount}`);
      }
      for (const imageResult of countedReviewedImages) {
        if (!imageResult.hash || !imageResult.provenanceValid) continue;
        const owners = reviewedImageHashesByProperty.get(imageResult.hash) ?? new Map();
        const files = owners.get(hotel.id) ?? new Set();
        files.add(imageResult.fileName);
        owners.set(hotel.id, files);
        reviewedImageHashesByProperty.set(imageResult.hash, owners);
      }
    }

    for (const [dateRange, snapshot] of Object.entries(hotel.rateSnapshots ?? {})) {
      const snapshotPath = `${hotelPath}/${dateRange}`;
      if (!/^\d{4}-\d{2}-\d{2}\/\d{4}-\d{2}-\d{2}$/.test(dateRange)) errors.push(`${snapshotPath}: invalid exact-date key`);
      const [checkIn, checkOut] = dateRange.split("/");
      if (!(Date.parse(checkOut) > Date.parse(checkIn))) errors.push(`${snapshotPath}: checkout must be after check-in`);
      if (snapshot.availabilityChecked === true) {
        if (hotel.officialStatus !== "needs-recheck") errors.push(`${snapshotPath}: an availability-only check must remain needs-recheck`);
        if (!hasText(snapshot.roomKey) || !roomKeys.has(snapshot.roomKey)) errors.push(`${snapshotPath}: availability-only check requires a known roomKey`);
        if (!/^\d{4}-\d{2}-\d{2}$/.test(snapshot.quotedAt ?? "")) errors.push(`${snapshotPath}: availability-only check requires an ISO quotedAt date`);
        continue;
      }
      if (snapshot.roomRates) {
        const hasAgodaRate = Object.values(snapshot.roomRates).some((platforms) => platforms.agoda);
        if (hotel.agodaSoldOut === true && hasAgodaRate) errors.push(`${snapshotPath}: a sold-out Agoda hotel cannot also carry a bookable Agoda rate`);
        for (const [roomKey, platforms] of Object.entries(snapshot.roomRates)) {
          if (!roomKeys.has(roomKey)) errors.push(`${snapshotPath}: rate points to unknown room ${roomKey}`);
          for (const [platform, rate] of Object.entries(platforms)) auditRate(rate, `${snapshotPath}/${roomKey}/${platform}`, hotel, checkIn, checkOut, roomKey);
        }
      } else {
        if (!roomKeys.has(snapshot.roomKey)) errors.push(`${snapshotPath}: rate points to unknown room ${snapshot.roomKey}`);
        auditRate(snapshot, snapshotPath, hotel, checkIn, checkOut, snapshot.roomKey);
      }
    }
  }
}

for (const owners of reviewedImageHashesByProperty.values()) {
  if (owners.size < 2) continue;
  const usages = [...owners.entries()]
    .map(([propertyId, files]) => `${propertyId}: ${[...files].join(", ")}`)
    .join("; ");
  errors.push(`cross-property image reuse is not allowed (${usages})`);
}

if (!hotelDialogSource.includes('tone: "is-unmatched"')
  || !hotelDialogSource.includes('官网 · 本房型未映射')
  || !hotelDialogSource.includes("roomOfficialPresentation")) {
  errors.push("HotelComparisonDialog: rooms without a matched direct rate must keep a neutral unmatched state");
}
if (!hotelDialogSource.includes("isEnglish ? room.nameEn : room.name")
  || !bookingPanelSource.includes("hotelEn: selected.nameEn ?? selected.name")
  || !accommodationMapSource.includes("hotel.hotelEn ?? hotel.hotel")) {
  errors.push("Accommodation English UI: room galleries, calendar, and overview map must use localized names");
}

for (const fileUrl of dataFiles) {
  const source = await readFile(fileUrl, "utf8");
  for (const claim of forbiddenPhotoClaims) {
    if (source.includes(claim)) errors.push(`${fileUrl.pathname}: contains misleading photo claim “${claim}”`);
  }
}

console.log(`Accommodation audit: ${seenHotelIds.size} concrete options checked.`);
for (const warning of warnings) console.log(`WARN ${warning}`);
for (const error of errors) console.log(`FAIL ${error}`);

if (errors.length) {
  console.log(`\nAudit failed: ${errors.length} accommodation data issue${errors.length === 1 ? "" : "s"}.`);
  process.exitCode = 1;
} else {
  console.log(`\nAudit passed with ${warnings.length} transparent photo-verification warning${warnings.length === 1 ? "" : "s"}.`);
}
