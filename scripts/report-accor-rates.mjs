#!/usr/bin/env node

import process from "node:process";
import {
  aucklandCityHotels,
  aucklandCityStay,
} from "../src/data/aucklandCityHotels.js";
import {
  regionalHotels,
  regionalStays,
} from "../src/data/regionalHotels.js";

const requestTimeoutMs = 25_000;
const adults = 2;
const rooms = 1;
const countryMarket = "CN";
const currency = "NZD";

const rateQuery = `
query AccorRateReport(
  $hotelId: ID!
  $hotelOffersHotelId: String!
  $dateIn: Date!
  $dateOut: Date!
  $nbAdults: PositiveInt!
  $countryMarket: String!
  $currency: String!
) {
  hotel(hotelId: $hotelId) {
    id
    name
    currency { code }
    accommodations {
      code
      name
      description
      maxOccupancy { pax }
      beddingDetails { code count label }
      surface { squareMeter }
    }
  }
  hotelOffers(
    hotelId: $hotelOffersHotelId
    dateIn: $dateIn
    dateOut: $dateOut
    nbAdults: $nbAdults
    childrenAges: []
    countryMarket: $countryMarket
    currency: $currency
  ) {
    availability {
      status
      reasons { code label }
    }
    offersSelection(totalRoomInBasket: 1) {
      offers {
        type
        dateIn
        updatedRemaining
        pricing {
          currency
          aggregationType
          formattedAggregationType
          formattedTaxType
          deduction { percent formattedAmount type }
          main {
            amount
            formattedAmount
            categories
            label
            simplifiedPolicies {
              cancellation { code label }
              guarantee { code label }
            }
          }
          alternative {
            amount
            formattedAmount
            categories
            label
            bookable
          }
        }
        categories { code tag label description additionalTag }
        mealPlan { code label }
        lengthOfStay { value unit }
        product { id quantity updatedRemaining }
        rate { id label legacyId }
        occupancy { adults childrenAges childrenAgesAsAdult babies }
      }
    }
  }
}`;

function usage() {
  return [
    "Usage: npm run report:accor-rates -- [--json]",
    "",
    "Fetches live, read-only Accor availability and rates for every current",
    "needs-recheck Accor stay. Public GraphQL configuration is discovered from",
    "Accor's booking page at runtime and is never printed or written to disk.",
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

function integerNightCount(checkIn, checkOut) {
  return (Date.parse(`${checkOut}T00:00:00Z`)
    - Date.parse(`${checkIn}T00:00:00Z`)) / 86_400_000;
}

function currentAccorStays() {
  const dateRanges = {
    "auckland-city": aucklandCityStay.dates,
    ...Object.fromEntries(
      Object.entries(regionalStays).map(([region, stay]) => [region, stay.dates]),
    ),
  };
  const groups = {
    "auckland-city": aucklandCityHotels,
    ...regionalHotels,
  };

  return Object.entries(groups).flatMap(([region, hotels]) => (
    hotels.flatMap((hotel) => {
      const entryUrl = hotel.officialBookingUrl ?? hotel.officialUrl ?? "";
      let isAccor = false;
      try {
        isAccor = ["all.accor.com", "www.peppers.co.nz"].includes(
          new URL(entryUrl).hostname,
        );
      } catch {
        isAccor = false;
      }
      if (hotel.officialStatus !== "needs-recheck" || !isAccor) return [];
      const dates = dateRanges[region];
      if (!dates?.checkIn || !dates?.checkOut) {
        throw new Error(`No current stay dates configured for ${region}/${hotel.id}`);
      }
      return [{
        region,
        propertyId: hotel.id,
        expectedName: hotel.name,
        preferredRoomNames: (hotel.roomTypes ?? []).map(
          (room) => room.nameEn ?? room.name,
        ).filter(Boolean),
        hotelCode: accorHotelCode(hotel, entryUrl),
        checkIn: dates.checkIn,
        checkOut: dates.checkOut,
      }];
    })
  ));
}

function accorHotelCode(hotel, entryUrl) {
  if (hotel.officialHotelCode) return hotel.officialHotelCode;
  const buildingId = new URL(entryUrl).searchParams.get("buildingid");
  if (buildingId) return buildingId;
  const match = entryUrl.match(/\/(?:rates|hotel)\/([^/?#]+)/i);
  if (!match?.[1]) throw new Error(`Could not determine Accor hotel code for ${hotel.id}`);
  return decodeURIComponent(match[1]);
}

function bookingPageUrl(stay) {
  const url = new URL(`https://all.accor.com/booking/en/accor/hotel/${stay.hotelCode}`);
  url.searchParams.set("dateIn", stay.checkIn);
  url.searchParams.set("dateOut", stay.checkOut);
  url.searchParams.set("nights", String(integerNightCount(stay.checkIn, stay.checkOut)));
  url.searchParams.set("compositions", String(adults));
  url.searchParams.set("stayplus", "false");
  return url.toString();
}

async function fetchText(url, label) {
  const response = await fetch(url, {
    headers: {
      Accept: "text/html,*/*;q=0.8",
      "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/138 Safari/537.36",
    },
    redirect: "follow",
    signal: AbortSignal.timeout(requestTimeoutMs),
  });
  if (!response.ok) throw new Error(`${label} returned HTTP ${response.status}`);
  return response.text();
}

function runtimeValue(source, name) {
  return source.match(new RegExp(`\\b${name}\\s*:\\s*"([^"]+)"`))?.[1];
}

async function discoverPublicGraphqlConfiguration(stay) {
  const source = await fetchText(bookingPageUrl(stay), "Accor booking page");
  const configuration = {
    uri: runtimeValue(source, "gqlUri"),
    apiKey: runtimeValue(source, "gqlApiKey"),
    appId: runtimeValue(source, "gqlAppId"),
  };
  if (!configuration.uri || !configuration.apiKey || !configuration.appId) {
    throw new Error("Accor booking page did not expose complete public GraphQL configuration");
  }
  const endpoint = new URL(configuration.uri);
  if (endpoint.protocol !== "https:"
    || !(endpoint.hostname === "accor.com" || endpoint.hostname.endsWith(".accor.com"))) {
    throw new Error("Accor booking page exposed an unexpected GraphQL endpoint");
  }
  return configuration;
}

async function fetchAccorProperty(stay, configuration) {
  const sourceUrl = bookingPageUrl(stay);
  const response = await fetch(configuration.uri, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      apikey: configuration.apiKey,
      "app-id": configuration.appId,
      lang: "en",
      Origin: "https://all.accor.com",
      Referer: sourceUrl,
    },
    body: JSON.stringify({
      operationName: "AccorRateReport",
      query: rateQuery,
      variables: {
        hotelId: stay.hotelCode,
        hotelOffersHotelId: stay.hotelCode,
        dateIn: stay.checkIn,
        dateOut: stay.checkOut,
        nbAdults: adults,
        countryMarket,
        currency,
      },
    }),
    signal: AbortSignal.timeout(requestTimeoutMs),
  });
  if (!response.ok) {
    throw new Error(`${stay.expectedName} rate query returned HTTP ${response.status}`);
  }
  if (!response.headers.get("content-type")?.includes("application/json")) {
    throw new Error(`${stay.expectedName} rate query returned a non-JSON response`);
  }
  const payload = await response.json();
  if (payload.errors?.length) {
    throw new Error(`${stay.expectedName} GraphQL error: ${payload.errors.map(
      (error) => error.message,
    ).join(" | ")}`);
  }
  if (!payload.data?.hotel || !payload.data?.hotelOffers?.availability) {
    throw new Error(`${stay.expectedName} rate query returned an unexpected shape`);
  }
  return normalizeProperty(stay, sourceUrl, payload.data);
}

function normalizedRoomName(value) {
  return String(value ?? "")
    .normalize("NFKD")
    .replaceAll(/[^a-z0-9]+/gi, " ")
    .trim()
    .toLowerCase();
}

function distinctiveRoomNameTokens(value) {
  const ignoredTokens = new Set([
    "a",
    "bed",
    "beds",
    "one",
    "room",
    "size",
    "the",
    "two",
    "with",
  ]);
  return normalizedRoomName(value)
    .split(" ")
    .filter((token) => token && !ignoredTokens.has(token) && !/^\d+$/.test(token));
}

function isPreferredRoom(roomName, preferredRoomNames) {
  const normalized = normalizedRoomName(roomName);
  const actualTokens = new Set(distinctiveRoomNameTokens(roomName));
  const roomClassTokens = [
    "apartment",
    "atelier",
    "loft",
    "penthouse",
    "residence",
    "studio",
    "suite",
  ];
  return preferredRoomNames.some((preferred) => {
    const expected = normalizedRoomName(preferred);
    if (!expected) return false;
    if (normalized === expected || normalized.includes(expected) || expected.includes(normalized)) {
      return true;
    }
    const expectedTokens = distinctiveRoomNameTokens(preferred);
    const hasConflictingRoomClass = roomClassTokens.some((token) => (
      actualTokens.has(token) && !expectedTokens.includes(token)
    ));
    return expectedTokens.length >= 2
      && !hasConflictingRoomClass
      && expectedTokens.every((token) => actualTokens.has(token));
  });
}

function priceCategories(price) {
  return new Set((price?.categories ?? []).map((category) => String(category).toUpperCase()));
}

function isMemberPrice(price, deductions = []) {
  return priceCategories(price).has("MEMBER_RATE")
    || deductions.some((deduction) => deduction?.type === "MEMBER_RATE");
}

function policyLabel(policy) {
  if (!policy) return null;
  if (policy.label && policy.code) return `${policy.label} (${policy.code})`;
  return policy.label ?? policy.code ?? null;
}

function normalizeOffer(offer, roomsByCode, preferredRoomNames, availabilityStatus) {
  const pricing = offer.pricing ?? {};
  const main = pricing.main ?? {};
  const alternative = pricing.alternative?.bookable === false
    ? null
    : pricing.alternative;
  const mainIsMember = isMemberPrice(main, pricing.deduction ?? []);
  const alternativeIsMember = isMemberPrice(alternative);
  const totalStayPricing = pricing.aggregationType === "TOTAL_STAY";
  const officialRoom = roomsByCode.get(offer.product?.id) ?? null;

  return {
    productCode: offer.product?.id ?? null,
    officialRoom: officialRoom?.name ?? null,
    preferredForTrip: officialRoom
      ? isPreferredRoom(officialRoom.name, preferredRoomNames)
      : false,
    roomSizeSquareMetres: officialRoom?.surface?.squareMeter ?? null,
    bedding: (officialRoom?.beddingDetails ?? []).map((bed) => ({
      code: bed.code ?? null,
      count: bed.count ?? null,
      label: bed.label ?? null,
    })),
    availability: availabilityStatus,
    remaining: offer.product?.updatedRemaining ?? offer.updatedRemaining ?? null,
    ratePlan: offer.rate?.label ?? offer.rate?.id ?? null,
    rateCode: offer.rate?.id ?? null,
    aggregationType: pricing.aggregationType ?? null,
    aggregationLabel: pricing.formattedAggregationType ?? null,
    publicTotalNzd: totalStayPricing
      ? (mainIsMember
        ? (alternativeIsMember ? null : alternative?.amount ?? null)
        : main.amount ?? null)
      : null,
    memberTotalNzd: totalStayPricing
      ? (mainIsMember
        ? main.amount ?? null
        : (alternativeIsMember ? alternative?.amount ?? null : null))
      : null,
    displayedMainAmountNzd: main.amount ?? null,
    displayedMainAudience: mainIsMember ? "member" : "public",
    currency: pricing.currency ?? currency,
    mealPlan: offer.mealPlan?.label ?? offer.mealPlan?.code ?? null,
    mealPlanCode: offer.mealPlan?.code ?? null,
    cancellation: policyLabel(main.simplifiedPolicies?.cancellation),
    payment: policyLabel(main.simplifiedPolicies?.guarantee),
    policyAppliesTo: mainIsMember ? "displayed main member price" : "displayed main public price",
    taxWording: pricing.formattedTaxType?.trim() || null,
    taxWordingMissing: !pricing.formattedTaxType?.trim(),
  };
}

function normalizeProperty(stay, sourceUrl, data) {
  const hotel = data.hotel;
  const hotelOffers = data.hotelOffers;
  const roomsByCode = new Map(
    (hotel.accommodations ?? []).map((room) => [room.code, room]),
  );
  const offers = (hotelOffers.offersSelection?.offers ?? [])
    .filter((offer) => offer.type === "ROOM")
    .map((offer) => normalizeOffer(
      offer,
      roomsByCode,
      stay.preferredRoomNames,
      hotelOffers.availability.status,
    ));

  return {
    region: stay.region,
    propertyId: stay.propertyId,
    hotelCode: stay.hotelCode,
    property: hotel.name ?? stay.expectedName,
    checkIn: stay.checkIn,
    checkOut: stay.checkOut,
    nights: integerNightCount(stay.checkIn, stay.checkOut),
    adults,
    rooms,
    currency: hotel.currency?.code ?? currency,
    availability: {
      status: hotelOffers.availability.status,
      reasons: (hotelOffers.availability.reasons ?? []).map((reason) => ({
        code: reason.code ?? null,
        label: reason.label ?? null,
      })),
    },
    sourceUrl,
    offers,
  };
}

function money(value) {
  if (typeof value !== "number" || !Number.isFinite(value)) return "—";
  return new Intl.NumberFormat("en-NZ", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(value);
}

function printTable(report) {
  const rows = report.properties.flatMap((property) => {
    if (property.error) {
      return [{
        property: property.property,
        dates: `${property.checkIn} → ${property.checkOut}`,
        inventory: "error",
        preferred: "",
        room: property.error,
        code: "",
        remaining: "",
        rate: "",
        publicTotal: "",
        memberTotal: "",
        meal: "",
        cancellation: "",
        payment: "",
        tax: "",
      }];
    }
    if (property.offers.length === 0) {
      return [{
        property: property.property,
        dates: `${property.checkIn} → ${property.checkOut}`,
        inventory: property.availability.status,
        preferred: "",
        room: property.availability.reasons.map((reason) => reason.label ?? reason.code).join("; ") || "No room offers returned",
        code: "",
        remaining: "—",
        rate: "",
        publicTotal: "—",
        memberTotal: "—",
        meal: "—",
        cancellation: "—",
        payment: "—",
        tax: "—",
      }];
    }
    return property.offers.map((offer) => ({
      property: property.property,
      dates: `${property.checkIn} → ${property.checkOut}`,
      inventory: offer.availability,
      preferred: offer.preferredForTrip ? "★" : "",
      room: offer.officialRoom ?? "Unmapped room code",
      code: offer.productCode ?? "—",
      remaining: offer.remaining ?? "—",
      rate: offer.ratePlan ?? "—",
      publicTotal: money(offer.publicTotalNzd),
      memberTotal: money(offer.memberTotalNzd),
      meal: offer.mealPlan ?? "—",
      cancellation: offer.cancellation ?? "—",
      payment: offer.payment ?? "—",
      policyFor: offer.policyAppliesTo,
      tax: offer.taxWording ?? "not supplied",
    }));
  });

  console.log(`Live Accor rates · ${report.generatedAt}`);
  console.log(`${adults} adults · ${rooms} room · ${currency} · market ${countryMarket}`);
  console.log("Public and member prices are TOTAL_STAY amounts only; other aggregation types are not promoted to totals.");
  console.log("Cancellation and payment fields apply only to the API's displayed main-price audience shown in policyFor.");
  console.log("Tax wording 'not supplied' means the API returned no tax-inclusion wording; verify taxes and fees at checkout.");
  console.table(rows);
  console.log("★ room name matches a recommended room currently recorded in the trip data");
}

async function main() {
  const options = parseArguments(process.argv.slice(2));
  if (options.help) {
    console.log(usage());
    return;
  }

  const stays = currentAccorStays();
  if (stays.length === 0) throw new Error("No needs-recheck Accor stays were found");
  const configuration = await discoverPublicGraphqlConfiguration(stays[0]);
  const properties = [];
  let failed = false;

  // Keep requests sequential to avoid turning a read-only report into a burst
  // against Accor's public booking endpoint.
  for (const stay of stays) {
    try {
      properties.push(await fetchAccorProperty(stay, configuration));
    } catch (error) {
      failed = true;
      properties.push({
        region: stay.region,
        propertyId: stay.propertyId,
        hotelCode: stay.hotelCode,
        property: stay.expectedName,
        checkIn: stay.checkIn,
        checkOut: stay.checkOut,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  const report = {
    generatedAt: new Date().toISOString(),
    source: "Accor public booking GraphQL (live, read-only)",
    request: { adults, rooms, countryMarket, currency },
    runtimeConfiguration: {
      discoveredFromPublicBookingPage: true,
      persisted: false,
    },
    notes: [
      "Only API prices explicitly marked TOTAL_STAY are reported as stay totals.",
      "Cancellation and payment describe pricing.main only; policyAppliesTo identifies whether that main price is public or member.",
      "An empty taxWording is not evidence that taxes are included or excluded; verify taxes and fees at checkout.",
      "Offer identifiers are intentionally omitted because they are ephemeral.",
    ],
    properties,
  };

  if (options.json) console.log(JSON.stringify(report, null, 2));
  else printTable(report);
  if (failed) process.exitCode = 1;
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
