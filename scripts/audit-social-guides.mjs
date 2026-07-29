#!/usr/bin/env node

import { readFile, stat } from "node:fs/promises";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { socialGuidesByEvent } from "../src/socialGuides.js";

const routeMapUrl = new URL("../src/components/RouteMap.jsx", import.meta.url);
const requiredStances = ["positive", "pitfall"];
const minimumGuidesPerEvent = 5;
const socialGuideOptionalEvents = new Set([
  "接驳前往霍比屯",
  "接驳前往罗托鲁瓦",
  "接驳返回奥克兰机场",
]);
const forbiddenBrowserScreenshotDimensions = new Set(["1280x720", "1136x863", "1159x863", "1122x863", "436x863"]);
const forbiddenBrowserScreenshotMedia = new Set([
  "/new-zealand-slow-trip-2026/images/xhs-klia-smooth-transfer.jpg",
  "/new-zealand-slow-trip-2026/images/xhs-south-island-passing-lane.jpg",
]);

function hasText(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function normalizeAuthor(guide) {
  if (hasText(guide.author)) return guide.author.trim();
  if (guide.author && typeof guide.author === "object") {
    return guide.author.name ?? guide.author.handle;
  }
  return guide.authorName ?? guide.authorHandle;
}

function isDirectXiaohongshuExploreUrl(value) {
  if (!hasText(value)) return false;
  try {
    const url = new URL(value);
    return /(^|\.)xiaohongshu\.com$/i.test(url.hostname)
      && /^\/explore\/[A-Za-z0-9]+\/?$/.test(url.pathname);
  } catch {
    return false;
  }
}

function xiaohongshuNoteId(value) {
  if (!hasText(value)) return null;
  try {
    const match = new URL(value).pathname.match(/^\/explore\/([A-Za-z0-9]+)\/?$/);
    return match?.[1]?.toLowerCase() ?? null;
  } catch {
    return null;
  }
}

function hasBilingualSummary(guide) {
  return hasText(guide.excerpt) && hasText(guide.excerptEn);
}

function extractCalendarEventTitles(source) {
  const marker = "const calendarEventGroupsByDate =";
  const markerIndex = source.indexOf(marker);
  if (markerIndex < 0) throw new Error(`Unable to find ${marker} in ${fileURLToPath(routeMapUrl)}`);

  const objectStart = source.indexOf("{", markerIndex);
  let depth = 0;
  let objectEnd = -1;
  for (let index = objectStart; index < source.length; index += 1) {
    if (source[index] === "{") depth += 1;
    if (source[index] === "}") {
      depth -= 1;
      if (depth === 0) {
        objectEnd = index;
        break;
      }
    }
  }
  if (objectEnd < 0) throw new Error("Unable to determine the calendar event data boundary");

  const titles = [];
  const titlePattern = /\btitle:\s*(["'])(.*?)\1/g;
  const calendarSource = source.slice(objectStart, objectEnd + 1);
  for (const match of calendarSource.matchAll(titlePattern)) titles.push(match[2]);
  return [...new Set(titles)];
}

function validateGuide(guide, index) {
  const errors = [];
  const prefix = `guide ${index + 1}${hasText(guide?.title) ? ` “${guide.title}”` : ""}`;
  if (!guide || typeof guide !== "object") return [`${prefix}: must be an object`];
  if (guide.platform !== "小红书") errors.push(`${prefix}: platform must be 小红书`);
  if (guide.verified !== true) errors.push(`${prefix}: verified must be true`);
  if (!isDirectXiaohongshuExploreUrl(guide.sourceUrl ?? guide.url)) errors.push(`${prefix}: requires a direct xiaohongshu.com/explore/<id> URL`);
  if (!hasText(normalizeAuthor(guide))) errors.push(`${prefix}: author is missing`);
  if (!hasText(guide.title)) errors.push(`${prefix}: Chinese title is missing`);
  if (!hasText(guide.titleEn) || guide.titleEn.trim() === guide.title?.trim()) errors.push(`${prefix}: distinct English title is missing`);
  if (!hasBilingualSummary(guide)) errors.push(`${prefix}: excerpt and excerptEn are required`);
  if (!hasText(guide.tip) || !hasText(guide.tipEn)) errors.push(`${prefix}: tip and tipEn are required`);
  if (!hasText(guide.coverImage) && !hasText(guide.videoThumbnail)) errors.push(`${prefix}: coverImage or videoThumbnail is required`);
  if (guide.mediaType === "video" && !hasText(guide.videoThumbnail)) errors.push(`${prefix}: video posts require videoThumbnail`);
  if (!requiredStances.includes(guide.stance ?? guide.sentiment)) errors.push(`${prefix}: stance must be positive or pitfall`);
  return errors;
}

async function validateLocalMedia(guide, index) {
  const errors = [];
  const prefix = `guide ${index + 1}${hasText(guide?.title) ? ` “${guide.title}”` : ""}`;
  const mediaPath = guide.coverImage ?? guide.videoThumbnail;
  if (!hasText(mediaPath) || !mediaPath.startsWith("/new-zealand-slow-trip-2026/images/")) return errors;
  if (forbiddenBrowserScreenshotMedia.has(mediaPath)) {
    errors.push(`${prefix}: media is a known browser-window capture, not original post media`);
  }
  const filePath = new URL(`../public${mediaPath.replace("/new-zealand-slow-trip-2026", "")}`, import.meta.url);
  try {
    const info = await stat(filePath);
    if (!info.isFile() || info.size === 0) errors.push(`${prefix}: local media file is empty`);
    const bytes = await readFile(filePath);
    let width;
    let height;
    if (bytes[0] === 0xff && bytes[1] === 0xd8) {
      for (let offset = 2; offset + 9 < bytes.length;) {
        if (bytes[offset] !== 0xff) { offset += 1; continue; }
        const marker = bytes[offset + 1];
        const size = bytes.readUInt16BE(offset + 2);
        if ([0xc0, 0xc1, 0xc2].includes(marker)) {
          height = bytes.readUInt16BE(offset + 5);
          width = bytes.readUInt16BE(offset + 7);
          break;
        }
        if (size < 2) break;
        offset += size + 2;
      }
    } else if (bytes.toString("ascii", 0, 4) === "RIFF" && bytes.toString("ascii", 8, 12) === "WEBP") {
      const chunk = bytes.toString("ascii", 12, 16);
      if (chunk === "VP8 ") {
        width = bytes.readUInt16LE(26) & 0x3fff;
        height = bytes.readUInt16LE(28) & 0x3fff;
      }
    }
    if (width && height && forbiddenBrowserScreenshotDimensions.has(`${width}x${height}`)) {
      errors.push(`${prefix}: media is a browser-window screenshot (${width}x${height}), not original post media`);
    }
  } catch {
    errors.push(`${prefix}: local media file does not exist`);
  }
  return errors;
}

async function auditEvent(eventTitle, guides) {
  const errors = [];
  const xiaohongshuGuides = Array.isArray(guides)
    ? guides.filter((guide) => guide?.platform === "小红书")
    : [];
  const qualifiedGuides = xiaohongshuGuides.filter((guide) => validateGuide(guide, 0).length === 0);
  const noteIds = xiaohongshuGuides
    .map((guide) => xiaohongshuNoteId(guide.sourceUrl ?? guide.url))
    .filter(Boolean);
  const duplicateNoteIds = [...new Set(noteIds.filter((noteId, index) => noteIds.indexOf(noteId) !== index))];
  if (qualifiedGuides.length < minimumGuidesPerEvent) {
    errors.push(`requires at least ${minimumGuidesPerEvent} qualifying Xiaohongshu guides; found ${qualifiedGuides.length} (${xiaohongshuGuides.length} total Xiaohongshu entries)`);
  }
  xiaohongshuGuides.forEach((guide, index) => errors.push(...validateGuide(guide, index)));
  const mediaErrors = await Promise.all(xiaohongshuGuides.map((guide, index) => validateLocalMedia(guide, index)));
  mediaErrors.forEach((items) => errors.push(...items));
  duplicateNoteIds.forEach((noteId) => errors.push(`reuses Xiaohongshu note ${noteId} within the same event`));
  for (const stance of requiredStances) {
    if (!qualifiedGuides.some((guide) => (guide.stance ?? guide.sentiment) === stance)) {
      errors.push(`requires one qualifying ${stance} Xiaohongshu guide`);
    }
  }
  return errors;
}

const routeMapSource = await readFile(routeMapUrl, "utf8");
const calendarEventTitles = extractCalendarEventTitles(routeMapSource);
const calendarEventTitleSet = new Set(calendarEventTitles);
const report = await Promise.all(calendarEventTitles.map(async (eventTitle) => ({
  eventTitle,
  errors: socialGuideOptionalEvents.has(eventTitle)
    ? []
    : await auditEvent(eventTitle, socialGuidesByEvent[eventTitle]),
})));
const orphanedEvents = Object.keys(socialGuidesByEvent).filter((title) => !calendarEventTitleSet.has(title));
const failed = report.filter(({ errors }) => errors.length > 0);
const noteEvents = new Map();
for (const eventTitle of calendarEventTitles) {
  for (const guide of socialGuidesByEvent[eventTitle] ?? []) {
    if (guide?.platform !== "小红书") continue;
    const noteId = xiaohongshuNoteId(guide.sourceUrl ?? guide.url);
    if (!noteId) continue;
    const events = noteEvents.get(noteId) ?? new Set();
    events.add(eventTitle);
    noteEvents.set(noteId, events);
  }
}
const reusedNotes = [...noteEvents.entries()].filter(([, events]) => events.size > 1);

console.log(`Social guide audit: ${calendarEventTitles.length - failed.length}/${calendarEventTitles.length} calendar events pass.`);
for (const { eventTitle, errors } of failed) {
  console.log(`\nFAIL ${eventTitle}`);
  errors.forEach((error) => console.log(`  - ${error}`));
}
if (orphanedEvents.length) {
  console.log("\nWARN social guide keys with no calendar event:");
  orphanedEvents.forEach((title) => console.log(`  - ${title}`));
}
if (reusedNotes.length) {
  console.log("\nWARN Xiaohongshu posts reused across events:");
  reusedNotes.forEach(([noteId, events]) => console.log(`  - ${noteId}: ${[...events].join(" / ")}`));
}

if (failed.length) {
  console.log(`\nAudit failed: ${failed.length} event${failed.length === 1 ? "" : "s"} need curated coverage.`);
  process.exitCode = 1;
} else {
  console.log("\nAudit passed: every event has verified positive and pitfall Xiaohongshu coverage.");
}
