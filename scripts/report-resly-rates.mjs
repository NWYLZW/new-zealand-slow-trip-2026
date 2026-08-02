#!/usr/bin/env node

import { Buffer } from "node:buffer";
import process from "node:process";

const credentialSourcePageUrl = "https://www.onlinebooking.direct/property/bella-vista-wanaka";
const availabilityUrl = "https://direct-prod-api.resly.com.au/channels/resly-direct/availability";
const requestTimeoutMs = 20_000;

const stays = [
  {
    name: "Alpine Motel Wānaka",
    propertyId: "alpine-motel-wanaka",
    checkIn: "2026-10-03",
    checkOut: "2026-10-05",
    preferredRoomTypeId: "SUP-KING-ST",
    bookingPageUrl: "https://v2.onlinebooking.direct/property/alpine-motel-wanaka",
    configFormat: "next-flight",
  },
  {
    name: "Bella Vista Wānaka",
    propertyId: "bella-vista-wanaka",
    checkIn: "2026-10-03",
    checkOut: "2026-10-05",
    preferredRoomTypeId: "SUP-STUDIO-KING",
    bookingPageUrl: "https://www.onlinebooking.direct/property/bella-vista-wanaka",
    configFormat: "next-data",
  },
  {
    name: "Bella Vista Oamaru",
    propertyId: "bella-vista-oamaru",
    checkIn: "2026-10-06",
    checkOut: "2026-10-07",
    preferredRoomName: /^Superior King(?:\/Twin)? Studio$/i,
    bookingPageUrl: "https://www.onlinebooking.direct/property/bella-vista-oamaru",
    configFormat: "next-data",
  },
];

function usage() {
  return [
    "Usage: npm run report:resly-rates -- [--json]",
    "",
    "Fetches live, read-only Resly availability and matching public rate policies",
    "for the three configured stays.",
    "Credentials are discovered from Resly's public booking frontend at runtime and",
    "are kept in memory; they are never printed or written to a file.",
  ].join("\n");
}

function parseArguments(arguments_) {
  const options = { json: false };

  for (const argument of arguments_) {
    if (argument === "--json") options.json = true;
    else if (argument === "--help" || argument === "-h") options.help = true;
    else throw new Error(`Unknown argument: ${argument}`);
  }

  return options;
}

async function fetchText(url, label) {
  const response = await fetch(url, {
    headers: { Accept: "text/html,application/javascript;q=0.9,*/*;q=0.8" },
    signal: AbortSignal.timeout(requestTimeoutMs),
  });

  if (!response.ok) {
    throw new Error(`${label} returned HTTP ${response.status}`);
  }

  return response.text();
}

function scriptUrlsFromHtml(html, pageUrl) {
  const pageOrigin = new URL(pageUrl).origin;
  return [...html.matchAll(/<script\b[^>]*\bsrc=["']([^"']+)["']/gi)]
    .map(([, source]) => new URL(source, pageUrl))
    .filter((url) => url.origin === pageOrigin)
    .map((url) => url.href);
}

function credentialsFromBundle(source) {
  if (!source.includes("direct-prod-api.resly.com.au")) return undefined;

  const matches = [...source.matchAll(
    /auth\s*:\s*\{\s*username\s*:\s*["']([^"']+)["']\s*,\s*password\s*:\s*["']([^"']+)["']\s*\}/g,
  )];
  if (matches.length !== 1) return undefined;

  return { username: matches[0][1], password: matches[0][2] };
}

async function discoverCredentials() {
  const html = await fetchText(credentialSourcePageUrl, "Resly booking page");
  const scriptUrls = scriptUrlsFromHtml(html, credentialSourcePageUrl);
  if (scriptUrls.length === 0) {
    throw new Error("Resly booking page did not expose any frontend scripts");
  }

  for (const [index, scriptUrl] of scriptUrls.entries()) {
    const source = await fetchText(scriptUrl, `Resly frontend script ${index + 1}`);
    const credentials = credentialsFromBundle(source);
    if (credentials) return credentials;
  }

  throw new Error("Could not discover Resly API credentials from the public booking frontend");
}

function configFromNextData(html, stay) {
  const match = html.match(
    /<script\s+id=["']__NEXT_DATA__["']\s+type=["']application\/json["']>([\s\S]*?)<\/script>/i,
  );
  if (!match) throw new Error(`${stay.name} booking page did not expose __NEXT_DATA__`);

  const config = JSON.parse(match[1])?.props?.pageProps?.config;
  if (!config) throw new Error(`${stay.name} booking page config had an unexpected shape`);
  return config;
}

function configFromNextFlight(html, stay) {
  const chunks = [];
  for (const match of html.matchAll(
    /<script>self\.__next_f\.push\((\[[\s\S]*?\])\)<\/script>/g,
  )) {
    const payload = JSON.parse(match[1]);
    if (typeof payload[1] === "string") chunks.push(payload[1]);
  }

  const flightData = chunks.join("");
  const marker = `},\"hotelId\":\"${stay.propertyId}\"`;
  const configLabelIndex = flightData.indexOf('"ssrConfig"');
  const start = flightData.indexOf('{"general"', configLabelIndex);
  const end = flightData.indexOf(marker, start);
  if (configLabelIndex < 0 || start < 0 || end < 0) {
    throw new Error(`${stay.name} booking page did not expose ssrConfig`);
  }

  return JSON.parse(`${flightData.slice(start, end)}}`);
}

async function fetchPublicConfig(stay) {
  const html = await fetchText(stay.bookingPageUrl, `${stay.name} booking page`);
  if (stay.configFormat === "next-data") return configFromNextData(html, stay);
  if (stay.configFormat === "next-flight") return configFromNextFlight(html, stay);
  throw new Error(`${stay.name} has an unsupported booking page format`);
}

function integerNightCount(checkIn, checkOut) {
  const milliseconds = Date.parse(`${checkOut}T00:00:00Z`)
    - Date.parse(`${checkIn}T00:00:00Z`);
  return milliseconds / 86_400_000;
}

function errorsForPlan(plan) {
  if (!Array.isArray(plan?.errors)) return [];
  return plan.errors.map((error) => (
    typeof error === "string" ? error : error?.message ?? JSON.stringify(error)
  ));
}

function cancellationWording(policy, currency) {
  if (!policy) return "Unavailable from public booking config";
  if (policy.cancellationPolicy === "custom") {
    return policy.customPolicy || "Custom cancellation policy (wording unavailable)";
  }
  if (policy.cancellationPolicy === "nonRefundable") {
    return "Non-refundable; cancellation does not qualify for a refund.";
  }
  if (policy.cancellationPolicy === "anytime") return "Free cancellation at any time.";
  if (policy.cancellationPolicy === "upto") {
    const threshold = policy.freeCancellationUpTo ?? "unknown";
    const fee = policy.cancellationFeeType === "percentage"
      ? `${policy.cancellationAmount}% of the total booking`
      : policy.cancellationFeeType === "fixed"
        ? `${currency} ${policy.cancellationAmount}`
        : policy.cancellationFeeType === "nights"
          ? `${policy.cancellationAmount} night(s)`
          : "the configured cancellation fee";
    return `Free cancellation until ${threshold} day(s) before arrival; after that, ${fee} is charged.`;
  }
  return "Unavailable from public booking config";
}

function cancellationSummary(policy, currency) {
  if (!policy) return "Unavailable";
  if (policy.cancellationPolicy === "nonRefundable") return "Non-refundable";
  if (policy.cancellationPolicy === "anytime") return "Free cancellation anytime";
  if (policy.cancellationPolicy === "upto") {
    const fee = policy.cancellationFeeType === "percentage"
      ? `${policy.cancellationAmount}% thereafter`
      : policy.cancellationFeeType === "fixed"
        ? `${currency} ${policy.cancellationAmount} thereafter`
        : policy.cancellationFeeType === "nights"
          ? `${policy.cancellationAmount} night(s) thereafter`
          : "fee thereafter";
    return `Free until ${policy.freeCancellationUpTo ?? "?"} day(s) before arrival; ${fee}`;
  }
  if (policy.cancellationPolicy === "custom") {
    const wording = String(policy.customPolicy ?? "").replaceAll(/\s+/g, " ");
    if (/48 hours notice/i.test(wording) && /100%/i.test(wording)) {
      return "Free with 48 hours' notice; 100% within 48 hours/no-show";
    }
    return wording || "Custom policy (wording unavailable)";
  }
  return "Unavailable";
}

function paymentWording(policy, generalTerms) {
  if (policy?.depositPolicy === "percentage") {
    return `${policy.depositAmount}% deposit is required at booking.`;
  }
  if (policy?.depositPolicy === "fixed") {
    return `A fixed deposit of ${policy.depositAmount} is required at booking.`;
  }
  if (policy?.depositPolicy === "nights") {
    return `A deposit equal to ${policy.depositAmount} night(s) is required at booking.`;
  }
  if (policy?.depositPolicy === "custom" && policy.customDepositPolicy) {
    return policy.customDepositPolicy;
  }

  const customPolicy = String(policy?.customPolicy ?? "").replaceAll(/\s+/g, " ").trim();
  const customPaymentMatch = customPolicy.match(
    /(?:full payment[^.]*\.|(?:your )?credit card[^.]*charged[^.]*\.)/i,
  );
  if (customPaymentMatch) return customPaymentMatch[0].trim();

  const terms = String(generalTerms ?? "").replaceAll(/\s+/g, " ").trim();
  const paymentMatch = terms.match(
    /(?:full payment[^.]*48 hours[^.]*\.|nominated credit card[^.]*48 hours[^.]*\.)/i,
  );
  if (paymentMatch) return paymentMatch[0].trim();

  if (policy?.depositPolicy === "") return "No deposit configured; exact charge timing unavailable.";
  return "Unavailable from public booking config";
}

function breakfastWording(ratePlan) {
  if (ratePlan?.googleIsBreakfastIncluded === true) return "Included";
  if (ratePlan?.googleIsBreakfastIncluded === false) return "Not included";
  return "Unavailable from public booking config";
}

function policyForRate(config, rate) {
  const ratePlan = config.ratePlans?.[rate.directRatePlanId];
  const policyId = rate.promotion?.policyId || rate.policyId || ratePlan?.policyId;
  const policy = policyId ? config.policies?.[policyId] : undefined;
  return {
    matched: Boolean(ratePlan && policy),
    directRatePlanId: rate.directRatePlanId ?? null,
    publicRatePlanName: ratePlan?.name ?? null,
    policyId: policyId ?? null,
    cancellation: cancellationWording(policy, config.general?.currency ?? "NZD"),
    cancellationSummary: cancellationSummary(policy, config.general?.currency ?? "NZD"),
    payment: paymentWording(policy, config.general?.termsAndConditions),
    breakfast: breakfastWording(ratePlan),
    taxWording: "Unavailable: the API reports a tax amount but does not state whether the total includes GST/tax.",
    noShow: policy?.noShowPolicy || "Unavailable from public booking config",
  };
}

function normalizeAvailability(stay, data, config) {
  const inventoryByRoom = new Map(
    (data.roomTypesAvailable ?? []).map((room) => [room.roomTypeId, room]),
  );
  const validityByRoom = new Map(
    (data.ratePlansValid ?? []).map((plan) => [plan.roomTypeId, plan]),
  );

  return (data.ratePlansAvailable ?? []).map((rate) => {
    const inventory = inventoryByRoom.get(rate.roomTypeId);
    const validity = validityByRoom.get(rate.roomTypeId);
    const preferred = stay.preferredRoomTypeId
      ? rate.roomTypeId === stay.preferredRoomTypeId
      : stay.preferredRoomName?.test(rate.directRoomTypeName ?? "") === true;

    return {
      roomTypeId: rate.roomTypeId,
      directRoomTypeId: rate.directRoomTypeId ?? inventory?.directRoomTypeId ?? null,
      directRatePlanId: rate.directRatePlanId ?? null,
      roomName: rate.directRoomTypeName ?? validity?.roomTypeName ?? rate.roomTypeId,
      ratePlanName: rate.directRatePlanName ?? validity?.ratePlanName ?? "",
      available: inventory?.available ?? null,
      isAvailableToSell: validity?.isAvailableToSell ?? true,
      validationErrors: errorsForPlan(validity),
      preferred,
      totalNzd: rate.rate ?? null,
      roomRateTotalNzd: rate.roomRateTotal ?? null,
      discountTotalNzd: rate.discountRateTotal ?? 0,
      taxNzd: rate.taxAmount ?? 0,
      cleaningFeeNzd: rate.feeCleaning ?? 0,
      bookingFeeNzd: rate.feeBooking ?? 0,
      dailyRate: rate.dailyRate ?? {},
      promotion: rate.promotion
        ? {
          id: rate.promotion.id ?? "",
          name: rate.promotion.name ?? "",
          autoApplied: rate.promotion.isPromotionAutoApplied === true,
        }
        : null,
      policy: policyForRate(config, rate),
    };
  });
}

async function fetchAvailability(stay, authorization, config) {
  const url = new URL(availabilityUrl);
  const parameters = {
    propertyId: stay.propertyId,
    checkIn: stay.checkIn,
    checkOut: stay.checkOut,
    adults: "2",
    children: "0",
  };
  for (const [key, value] of Object.entries(parameters)) url.searchParams.set(key, value);

  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
      Authorization: authorization,
      "Cache-Control": "no-cache",
    },
    signal: AbortSignal.timeout(requestTimeoutMs),
  });
  if (!response.ok) {
    throw new Error(`${stay.name} availability returned HTTP ${response.status}`);
  }
  if (!response.headers.get("content-type")?.includes("application/json")) {
    throw new Error(`${stay.name} availability returned a non-JSON response`);
  }

  const payload = await response.json();
  const data = payload?.data ?? payload;
  if (!data || !Array.isArray(data.ratePlansAvailable)) {
    throw new Error(`${stay.name} availability response had an unexpected shape`);
  }

  return {
    property: stay.name,
    propertyId: stay.propertyId,
    checkIn: stay.checkIn,
    checkOut: stay.checkOut,
    nights: integerNightCount(stay.checkIn, stay.checkOut),
    adults: 2,
    children: 0,
    currency: "NZD",
    policySourceUrl: stay.bookingPageUrl,
    rooms: normalizeAvailability(stay, data, config),
  };
}

function money(value) {
  if (typeof value !== "number" || !Number.isFinite(value)) return "—";
  return new Intl.NumberFormat("en-NZ", {
    style: "currency",
    currency: "NZD",
    minimumFractionDigits: 2,
  }).format(value);
}

function printTable(report) {
  const rows = report.properties.flatMap((property) => property.rooms.map((room) => ({
    property: property.property,
    dates: `${property.checkIn} → ${property.checkOut}`,
    preferred: room.preferred ? "★" : "",
    room: room.roomName,
    code: room.roomTypeId,
    inventory: room.available ?? "—",
    sellable: room.isAvailableToSell && room.validationErrors.length === 0 ? "yes" : "no",
    total: money(room.totalNzd),
    beforeDiscount: money(room.roomRateTotalNzd),
    discount: money(room.discountTotalNzd),
    ratePlan: room.ratePlanName,
    promotion: room.promotion?.name ?? "",
  })));

  console.log(`Live Resly rates · ${report.generatedAt}`);
  console.log("2 adults · prices are total NZD for the configured stay");
  console.table(rows);

  const preferredPolicies = report.properties.map((property) => {
    const room = property.rooms.find((candidate) => candidate.preferred);
    return {
      property: property.property,
      room: room?.roomName ?? "—",
      ratePlan: room?.ratePlanName ?? "—",
      cancellation: room?.policy.cancellationSummary ?? "—",
      payment: room?.policy.payment ?? "—",
      breakfast: room?.policy.breakfast ?? "—",
      taxWording: room?.policy.taxWording ?? "—",
    };
  });
  console.log("Preferred-room policies · exact public rate-plan mapping");
  console.table(preferredPolicies);
  console.log("★ preferred room for this trip");
}

async function main() {
  const options = parseArguments(process.argv.slice(2));
  if (options.help) {
    console.log(usage());
    return;
  }

  const credentials = await discoverCredentials();
  const authorization = `Basic ${Buffer.from(
    `${credentials.username}:${credentials.password}`,
    "utf8",
  ).toString("base64")}`;

  const properties = await Promise.all(
    stays.map(async (stay) => {
      const config = await fetchPublicConfig(stay);
      return fetchAvailability(stay, authorization, config);
    }),
  );
  const report = {
    generatedAt: new Date().toISOString(),
    source: "Resly Direct live availability API + each property's public booking config",
    properties,
  };

  if (options.json) console.log(JSON.stringify(report, null, 2));
  else printTable(report);
}

main().catch((error) => {
  console.error(`Resly rate report failed: ${error.message}`);
  process.exitCode = 1;
});
