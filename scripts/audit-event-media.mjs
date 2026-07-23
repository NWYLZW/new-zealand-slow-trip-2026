import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { eventMediaByTitle } from "../src/eventMedia.js";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const publicBase = "/new-zealand-slow-trip-2026/";

const expectedEventTitles = [
  "乘机前往新西兰",
  "飞往皇后镇",
  "南岛取车入住",
  "皇后镇适应日",
  "格林诺奇湖岸公路",
  "Walter Peak 湖上巡游",
  "箭镇与 Crown Range",
  "抵达瓦纳卡",
  "瓦纳卡湖边慢游",
  "自驾前往库克山",
  "冰川直升机",
  "库克山观星夜",
  "库克山候补安排",
  "蒂卡波到基督城",
  "基督城城市半日",
  "还车飞奥克兰",
  "奥克兰购物日",
  "取车前往霍比屯",
  "霍比屯游览",
  "前往罗托鲁瓦",
  "Te Puia 地热文化",
  "返回奥克兰机场",
  "办理返程值机",
  "返程回深圳",
];

function getDimensions(buffer, extension) {
  if (extension === ".jpg" || extension === ".jpeg") {
    if (buffer[0] !== 0xff || buffer[1] !== 0xd8 || buffer[2] !== 0xff) return null;
    let offset = 2;
    while (offset + 9 < buffer.length) {
      if (buffer[offset] !== 0xff) {
        offset += 1;
        continue;
      }
      const marker = buffer[offset + 1];
      const segmentLength = buffer.readUInt16BE(offset + 2);
      const isStartOfFrame = [0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf].includes(marker);
      if (isStartOfFrame) {
        return {
          height: buffer.readUInt16BE(offset + 5),
          width: buffer.readUInt16BE(offset + 7),
        };
      }
      if (!segmentLength || marker === 0xda || marker === 0xd9) break;
      offset += segmentLength + 2;
    }
    return null;
  }

  if (extension === ".webp") {
    if (buffer.toString("ascii", 0, 4) !== "RIFF" || buffer.toString("ascii", 8, 12) !== "WEBP") return null;
    const chunk = buffer.toString("ascii", 12, 16);
    if (chunk === "VP8X") {
      return {
        width: 1 + buffer.readUIntLE(24, 3),
        height: 1 + buffer.readUIntLE(27, 3),
      };
    }
    if (chunk === "VP8 ") {
      return {
        width: buffer.readUInt16LE(26) & 0x3fff,
        height: buffer.readUInt16LE(28) & 0x3fff,
      };
    }
    if (chunk === "VP8L" && buffer[20] === 0x2f) {
      const bits = buffer.readUInt32LE(21);
      return {
        width: 1 + (bits & 0x3fff),
        height: 1 + ((bits >>> 14) & 0x3fff),
      };
    }
  }

  return null;
}

function getEventImages(media) {
  const candidates = media?.images?.length ? media.images : (media?.image ? [media] : []);
  return candidates.map((candidate) => typeof candidate === "string" ? candidate : candidate.image);
}

const failures = [];
const auditedFiles = new Map();

async function auditLocalImage(relativePath, context) {
  const filePath = path.join(projectRoot, "public", relativePath);
  if (!filePath.startsWith(path.join(projectRoot, "public") + path.sep)) {
    failures.push(`${context}: 图片路径越界 (${relativePath})`);
    return;
  }

  try {
    const fileStat = await stat(filePath);
    if (!fileStat.isFile() || fileStat.size === 0) {
      failures.push(`${context}: 图片文件为空或不是文件 (${relativePath})`);
      return;
    }
    const buffer = await readFile(filePath);
    const dimensions = getDimensions(buffer, path.extname(filePath).toLowerCase());
    if (!dimensions?.width || !dimensions?.height) {
      failures.push(`${context}: 图片文件无法识别或缺少有效尺寸 (${relativePath})`);
      return;
    }
    auditedFiles.set(relativePath, { ...dimensions, size: fileStat.size });
  } catch (error) {
    failures.push(`${context}: 图片文件不存在 (${relativePath}) · ${error.code ?? error.message}`);
  }
}

for (const title of expectedEventTitles) {
  const media = eventMediaByTitle[title];
  const images = getEventImages(media);
  if (!images.length) {
    failures.push(`${title}: 没有 hero 图片`);
    continue;
  }

  for (const imageUrl of images) {
    if (!imageUrl.startsWith(publicBase)) {
      failures.push(`${title}: hero 不是站内本地资源 (${imageUrl})`);
      continue;
    }

    const relativePath = imageUrl.slice(publicBase.length);
    await auditLocalImage(relativePath, `${title} hero`);
  }
}

// Gallery and section heroes are separate from event dialogs, but use the
// same local media contract. Keep them in this audit so the page cannot ship a
// valid event carousel alongside a broken overview or panel image.
const sourceFilesWithSiteMedia = [
  "src/eventMedia.js",
  "src/tripData.js",
  "src/components/panels/BookingPanel.jsx",
  "src/components/panels/NotesPanel.jsx",
  "src/components/panels/SouthPanel.jsx",
];

for (const sourceFile of sourceFilesWithSiteMedia) {
  const source = await readFile(path.join(projectRoot, sourceFile), "utf8");
  for (const match of source.matchAll(/assetPath\(["'](images\/[^"']+)["']\)/g)) {
    await auditLocalImage(match[1], sourceFile);
  }
}

const stylesheet = await readFile(path.join(projectRoot, "src/styles.css"), "utf8");
for (const match of stylesheet.matchAll(/url\(["']?\/new-zealand-slow-trip-2026\/(images\/[^)"']+)["']?\)/g)) {
  await auditLocalImage(match[1], "src/styles.css");
}

const unexpectedTitles = Object.keys(eventMediaByTitle).filter((title) => !expectedEventTitles.includes(title));
if (unexpectedTitles.length) failures.push(`存在未纳入审计的事件: ${unexpectedTitles.join("、")}`);

if (failures.length) {
  console.error(`事件图片审计失败 (${failures.length})`);
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exitCode = 1;
} else {
  console.log(`事件图片审计通过：${expectedEventTitles.length}/24 个事件，页面共 ${auditedFiles.size} 个本地行程图片文件。`);
  for (const [relativePath, result] of [...auditedFiles].sort(([left], [right]) => left.localeCompare(right))) {
    console.log(`- ${relativePath}: ${result.width}×${result.height}, ${result.size} bytes`);
  }
}
