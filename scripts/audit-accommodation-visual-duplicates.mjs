#!/usr/bin/env node

import { execFile } from "node:child_process";
import { mkdtemp, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { basename, join } from "node:path";
import { promisify } from "node:util";
import process from "node:process";
import { aucklandCityHotels } from "../src/data/aucklandCityHotels.js";
import { regionalHotels } from "../src/data/regionalHotels.js";

const run = promisify(execFile);
const imagePrefix = "/new-zealand-slow-trip-2026/images/hotels/";
const maximumHammingDistance = 8;
const maximumCrossPropertyHammingDistance = 4;
// A small dHash distance is a candidate generator, not proof: different rooms
// shot from a hotel's standard camera position can legitimately share the same
// coarse geometry. Keep reviewed false positives explicit so every newly
// introduced candidate still fails the audit until a person checks it.
const reviewedDistinctPairs = new Set([
  [
    "auckland-city-grand-chancellor-deluxe-king.jpg",
    "auckland-city-grand-chancellor-room-twin.jpg",
  ].sort().join("|"),
]);
const groups = {
  "auckland-city": aucklandCityHotels,
  ...regionalHotels,
};

function isSelectable(hotel) {
  return !hotel.excludedByPreference
    && (!hotel.isAirbnb || hotel.isVerifiedListing)
    && !hotel.isResearchPlaceholder
    && hotel.officialStatus !== "exact-date-unavailable";
}

function currentPhotos(hotel) {
  return [
    ...(hotel.hotelImages ?? []),
    ...(hotel.roomTypes ?? []).flatMap((room) => room.photosVerified === true ? room.images ?? [] : []),
  ].filter((photo) => photo?.src?.startsWith(imagePrefix));
}

function hammingDistance(left, right) {
  let distance = 0;
  for (let index = 0; index < left.length; index += 1) {
    distance += (left[index] ^ right[index]).toString(2).replaceAll("0", "").length;
  }
  return distance;
}

async function differenceHash(fileName, scratchDirectory) {
  const source = new URL(`../public/images/hotels/${fileName}`, import.meta.url);
  const rawPath = join(scratchDirectory, `${basename(fileName).replaceAll(/[^a-z0-9.-]/gi, "_")}.raw`);
  await run("ffmpeg", [
    "-y", "-loglevel", "error", "-i", source.pathname,
    "-vf", "scale=9:8:force_original_aspect_ratio=disable,format=gray",
    "-frames:v", "1", "-f", "rawvideo", "-pix_fmt", "gray", rawPath,
  ]);
  const pixels = await readFile(rawPath);
  if (pixels.length !== 72) throw new Error(`${fileName}: expected 72 dHash pixels; found ${pixels.length}`);
  const hash = Buffer.alloc(8);
  for (let row = 0; row < 8; row += 1) {
    for (let column = 0; column < 8; column += 1) {
      if (pixels[row * 9 + column] > pixels[row * 9 + column + 1]) {
        hash[row] |= 1 << (7 - column);
      }
    }
  }
  return hash;
}

const scratchDirectory = await mkdtemp(join(tmpdir(), "accommodation-dhash-"));
const errors = [];
const allHashedImages = [];
let propertyCount = 0;
let imageCount = 0;

for (const [group, hotels] of Object.entries(groups)) {
  for (const hotel of hotels.filter(isSelectable)) {
    propertyCount += 1;
    const photos = currentPhotos(hotel);
    imageCount += photos.length;
    const hashed = [];
    for (const photo of photos) {
      const fileName = photo.src.slice(imagePrefix.length);
      const imageResult = {
        group,
        propertyId: hotel.id,
        fileName,
        hash: await differenceHash(fileName, scratchDirectory),
      };
      hashed.push(imageResult);
      allHashedImages.push(imageResult);
    }
    for (let left = 0; left < hashed.length; left += 1) {
      for (let right = left + 1; right < hashed.length; right += 1) {
        const distance = hammingDistance(hashed[left].hash, hashed[right].hash);
        const pairKey = [hashed[left].fileName, hashed[right].fileName].sort().join("|");
        if (distance <= maximumHammingDistance && !reviewedDistinctPairs.has(pairKey)) {
          errors.push(`${group}/${hotel.id}: possible visual duplicate at dHash distance ${distance} (${hashed[left].fileName}, ${hashed[right].fileName})`);
        }
      }
    }
  }
}

for (let left = 0; left < allHashedImages.length; left += 1) {
  for (let right = left + 1; right < allHashedImages.length; right += 1) {
    if (allHashedImages[left].propertyId === allHashedImages[right].propertyId) continue;
    const distance = hammingDistance(allHashedImages[left].hash, allHashedImages[right].hash);
    if (distance <= maximumCrossPropertyHammingDistance) {
      errors.push(
        `cross-property possible visual duplicate at dHash distance ${distance} `
        + `(${allHashedImages[left].group}/${allHashedImages[left].propertyId}/${allHashedImages[left].fileName}, `
        + `${allHashedImages[right].group}/${allHashedImages[right].propertyId}/${allHashedImages[right].fileName})`,
      );
    }
  }
}

console.log(`Accommodation visual duplicate audit: ${imageCount} current images across ${propertyCount} selectable properties checked.`);
for (const error of errors) console.log(`FAIL ${error}`);
if (errors.length) {
  console.log(`\nVisual duplicate audit failed: ${errors.length} possible duplicate pair${errors.length === 1 ? "" : "s"}.`);
  process.exitCode = 1;
} else {
  console.log("\nVisual duplicate audit passed.");
}
