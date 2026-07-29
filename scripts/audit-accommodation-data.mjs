#!/usr/bin/env node

import { readFile, stat } from "node:fs/promises";
import process from "node:process";
import {
  agodaUrlForStay,
  aucklandAirportHotels,
  bookingUrlForStay,
} from "../src/data/aucklandAirportHotels.js";
import {
  aucklandCityHotels,
  aucklandCityStay,
} from "../src/data/aucklandCityHotels.js";
import { regionalHotels, regionalStays } from "../src/data/regionalHotels.js";

const imagePrefix = "/new-zealand-slow-trip-2026/images/hotels/";
const dataFiles = [
  new URL("../src/data/aucklandAirportHotels.js", import.meta.url),
  new URL("../src/data/aucklandCityHotels.js", import.meta.url),
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

const hotelGroups = {
  "auckland-airport": aucklandAirportHotels,
  "auckland-city": aucklandCityHotels,
  ...regionalHotels,
};
const officialStayRanges = {
  "auckland-airport": "2026-09-28/2026-09-29",
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
const hotelDialogSource = await readFile(
  new URL("../src/components/HotelComparisonDialog.jsx", import.meta.url),
  "utf8",
);

function hasText(value) {
  return typeof value === "string" && value.trim().length > 0;
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
  if (!/^\d{4}-\d{2}-\d{2}$/.test(rate.quotedAt ?? "")) errors.push(`${path}: quotedAt must be an ISO date`);
  if (!rateHasPrice(rate)) errors.push(`${path}: requires a verified total price`);
  for (const [optionIndex, option] of (rate.rateOptions ?? []).entries()) {
    if (!hasText(option?.label) || !hasText(option?.labelEn)) errors.push(`${path}/rate option ${optionIndex + 1}: bilingual labels are required`);
    if (!hasText(option?.detail) || !hasText(option?.detailEn)) errors.push(`${path}/rate option ${optionIndex + 1}: bilingual details are required`);
    if (typeof option?.nzd !== "number" || !Number.isFinite(option.nzd) || option.nzd <= 0) errors.push(`${path}/rate option ${optionIndex + 1}: nzd must be a positive number`);
  }
  if (expectedRoomKey && rate.roomKey !== expectedRoomKey) errors.push(`${path}: rate roomKey must match ${expectedRoomKey}`);
  auditGeneratedPlatformUrl(rate, path, hotel, checkIn, checkOut);
}

async function auditImage(photo, path) {
  if (!hasText(photo?.src)) {
    errors.push(`${path}: src is required`);
    return;
  }
  if (!hasText(photo.label)) errors.push(`${path}: label is required`);
  if (!hasText(photo.source)) errors.push(`${path}: source is required`);
  if (!photo.src.startsWith(imagePrefix)) {
    errors.push(`${path}: hotel photos must use a local reviewed asset`);
    return;
  }
  const fileName = photo.src.slice(imagePrefix.length);
  const fileUrl = new URL(`../public/images/hotels/${fileName}`, import.meta.url);
  try {
    const info = await stat(fileUrl);
    if (!info.isFile() || info.size === 0) errors.push(`${path}: local image is empty`);
  } catch {
    errors.push(`${path}: local image file is missing (${fileName})`);
  }
}

for (const [group, hotels] of Object.entries(hotelGroups)) {
  for (const hotel of hotels) {
    const hotelPath = `${group}/${hotel.id ?? hotel.name}`;
    if (!hasText(hotel.id)) errors.push(`${hotelPath}: hotel id is required`);
    if (seenHotelIds.has(hotel.id)) errors.push(`${hotelPath}: duplicate hotel id`);
    seenHotelIds.add(hotel.id);

    const officialRateCount = countOfficialRates(hotel);
    const officialEntryUrl = hotel.officialBookingUrl ?? hotel.officialUrl;
    const expectedStayRange = officialStayRanges[group];
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
    for (const [roomIndex, room] of (hotel.roomTypes ?? []).entries()) {
      const roomPath = `${hotelPath}/room ${roomIndex + 1} (${room.name ?? "unnamed"})`;
      if (!hasText(room.rateKey)) errors.push(`${roomPath}: rateKey is required`);
      if (roomKeys.has(room.rateKey)) errors.push(`${roomPath}: duplicate rateKey`);
      roomKeys.add(room.rateKey);
      if (!hasText(room.bed)) errors.push(`${roomPath}: bed is required`);
      if (!Array.isArray(room.images)) errors.push(`${roomPath}: images must be an array`);
      if (room.photosVerified === true && !(room.images?.length > 0)) errors.push(`${roomPath}: photosVerified requires room photos`);
      if (room.photosVerified !== true) warnings.push(`${roomPath}: room-specific photos are still being verified and must stay hidden`);
      for (const [imageIndex, photo] of (room.images ?? []).entries()) {
        await auditImage(photo, `${roomPath}/image ${imageIndex + 1}`);
      }
    }
    for (const [imageIndex, photo] of (hotel.hotelImages ?? []).entries()) {
      await auditImage(photo, `${hotelPath}/hotel image ${imageIndex + 1}`);
    }

    for (const [dateRange, snapshot] of Object.entries(hotel.rateSnapshots ?? {})) {
      const snapshotPath = `${hotelPath}/${dateRange}`;
      if (!/^\d{4}-\d{2}-\d{2}\/\d{4}-\d{2}-\d{2}$/.test(dateRange)) errors.push(`${snapshotPath}: invalid exact-date key`);
      const [checkIn, checkOut] = dateRange.split("/");
      if (!(Date.parse(checkOut) > Date.parse(checkIn))) errors.push(`${snapshotPath}: checkout must be after check-in`);
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

if (!hotelDialogSource.includes('tone: "is-unmatched"')
  || !hotelDialogSource.includes('官网 · 本房型未映射')
  || !hotelDialogSource.includes("roomOfficialPresentation")) {
  errors.push("HotelComparisonDialog: rooms without a matched direct rate must keep a neutral unmatched state");
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
