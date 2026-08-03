#!/usr/bin/env node

import { readFile, readdir, stat } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const projectRoot = path.resolve(import.meta.dirname, "..");
const agentsPath = path.join(projectRoot, "AGENTS.md");
const rulesRoot = path.join(projectRoot, ".ai/rules");
const indexPath = path.join(rulesRoot, "README.md");
const docsRoot = path.join(projectRoot, ".ai/docs");
const packageJson = JSON.parse(await readFile(path.join(projectRoot, "package.json"), "utf8"));
const errors = [];
const warnings = [];

async function markdownFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(entries.map(async (entry) => {
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) return markdownFiles(absolute);
    return entry.isFile() && entry.name.endsWith(".md") ? [absolute] : [];
  }));
  return nested.flat();
}

function relative(file) {
  return path.relative(projectRoot, file).split(path.sep).join("/");
}

function parseFrontmatter(source, file) {
  if (!source.startsWith("---\n")) {
    errors.push(`${relative(file)} is missing YAML frontmatter`);
    return null;
  }

  const closing = source.indexOf("\n---\n", 4);
  if (closing === -1) {
    errors.push(`${relative(file)} has unterminated YAML frontmatter`);
    return null;
  }

  const metadata = {};
  const frontmatter = source.slice(4, closing);
  for (const line of frontmatter.split("\n")) {
    const match = line.match(/^([a-z_]+):\s*(.*)$/);
    if (!match) {
      errors.push(`${relative(file)} has unsupported frontmatter line: ${line}`);
      continue;
    }
    const [, key, rawValue] = match;
    if (rawValue.startsWith("[") && rawValue.endsWith("]")) {
      metadata[key] = rawValue
        .slice(1, -1)
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean);
    } else {
      metadata[key] = rawValue.trim();
    }
  }
  return metadata;
}

async function exists(file) {
  try {
    return (await stat(file)).isFile();
  } catch {
    return false;
  }
}

const ruleFiles = (await markdownFiles(rulesRoot)).sort();
const docsFiles = (await markdownFiles(docsRoot)).sort();
const allMarkdownFiles = [agentsPath, ...ruleFiles, ...docsFiles];
const sources = new Map(
  await Promise.all(allMarkdownFiles.map(async (file) => [file, await readFile(file, "utf8")])),
);
const agentsLines = sources.get(agentsPath).trimEnd().split("\n").length;
if (agentsLines > 80) errors.push(`AGENTS.md must remain a short routing entry (found ${agentsLines} lines; maximum 80)`);

const indexSource = sources.get(indexPath);
const agentsSource = sources.get(agentsPath);
const metadataByFile = new Map();
const idToFile = new Map();
for (const file of ruleFiles) {
  if (file === indexPath) continue;
  const route = path.relative(rulesRoot, file).split(path.sep).join("/");
  if (!indexSource.includes(`(${route})`)) errors.push(`${relative(file)} is not routed from .ai/rules/README.md`);

  const source = sources.get(file);
  const metadata = parseFrontmatter(source, file);
  if (!metadata) continue;
  metadataByFile.set(file, metadata);

  const commonFields = ["kind", "id", "triggers", "outputs", "last_reviewed"];
  const kindFields = metadata.kind === "scenario"
    ? ["reading_order", "stop_conditions", "completion_gate"]
    : ["scope", "verification"];
  for (const field of [...commonFields, ...kindFields]) {
    if (!metadata[field] || (Array.isArray(metadata[field]) && metadata[field].length === 0)) {
      errors.push(`${relative(file)} is missing non-empty frontmatter field ${field}`);
    }
  }

  if (!["rule", "scenario"].includes(metadata.kind)) {
    errors.push(`${relative(file)} has unsupported kind ${metadata.kind}`);
  }
  if (metadata.id) {
    if (idToFile.has(metadata.id)) {
      errors.push(`${relative(file)} duplicates id ${metadata.id} from ${relative(idToFile.get(metadata.id))}`);
    } else {
      idToFile.set(metadata.id, file);
    }
  }

  const lineCount = source.trimEnd().split("\n").length;
  const maximum = metadata.kind === "scenario" ? 90 : 140;
  if (lineCount > maximum) {
    errors.push(`${relative(file)} exceeds the ${maximum}-line ${metadata.kind} budget (found ${lineCount})`);
  }

  if (metadata.kind === "rule") {
    const directory = path.relative(rulesRoot, path.dirname(file)).split(path.sep)[0];
    if (metadata.scope !== directory) {
      errors.push(`${relative(file)} has scope ${metadata.scope}; expected ${directory}`);
    }
  } else if (!agentsSource.includes(`(.ai/rules/${route})`)) {
    errors.push(`${relative(file)} is not routed from AGENTS.md`);
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(metadata.last_reviewed ?? "")) {
    errors.push(`${relative(file)} has invalid last_reviewed date ${metadata.last_reviewed}`);
  } else {
    const reviewedAt = new Date(`${metadata.last_reviewed}T00:00:00Z`);
    if (Number.isNaN(reviewedAt.getTime()) || reviewedAt.toISOString().slice(0, 10) !== metadata.last_reviewed) {
      errors.push(`${relative(file)} has invalid last_reviewed date ${metadata.last_reviewed}`);
    } else {
      const ageInDays = Math.floor((Date.now() - reviewedAt.getTime()) / 86_400_000);
      if (ageInDays < 0) errors.push(`${relative(file)} has a future last_reviewed date`);
      if (ageInDays > 180) warnings.push(`${relative(file)} was last reviewed ${ageInDays} days ago`);
    }
  }
}

for (const [file, metadata] of metadataByFile) {
  if (metadata.kind !== "scenario" || !Array.isArray(metadata.reading_order)) continue;
  for (const target of metadata.reading_order) {
    const resolved = path.resolve(path.dirname(file), target);
    if (!(await exists(resolved))) {
      errors.push(`${relative(file)} reading_order target does not exist: ${target}`);
    } else if (metadataByFile.get(resolved)?.kind !== "rule") {
      errors.push(`${relative(file)} reading_order must target a rule: ${target}`);
    }
  }
}

const markdownLinkPattern = /\[[^\]]+\]\(([^)]+)\)/g;
const npmCommandPattern = /\bnpm run ([a-z0-9:_-]+)/gi;
const forbiddenEphemeralPatterns = [
  { pattern: /019f[0-9a-f-]{20,}/i, label: "thread/session id" },
  { pattern: /Documents\/Codex\//, label: "historical sandbox path" },
  { pattern: /\/tmp\/codex-browser-use/, label: "temporary browser socket path" },
  { pattern: /\bPID\s*[:=]?\s*\d{2,}\b/i, label: "temporary process id" },
];

for (const [file, source] of sources) {
  for (const match of source.matchAll(markdownLinkPattern)) {
    const target = match[1].trim();
    if (/^(?:https?:|mailto:|#)/i.test(target)) continue;
    const cleanTarget = target.split("#", 1)[0];
    const resolved = path.resolve(path.dirname(file), cleanTarget);
    if (!(await exists(resolved))) errors.push(`${relative(file)} has a broken link to ${target}`);
  }

  for (const match of source.matchAll(npmCommandPattern)) {
    if (!packageJson.scripts?.[match[1]]) errors.push(`${relative(file)} references missing npm script ${match[1]}`);
  }

  for (const { pattern, label } of forbiddenEphemeralPatterns) {
    if (pattern.test(source)) errors.push(`${relative(file)} contains an ephemeral ${label}`);
  }
}

if (errors.length) {
  console.error(`AI rule audit failed (${errors.length})`);
  errors.forEach((error) => console.error(`- ${error}`));
  process.exitCode = 1;
} else {
  console.log(`AI rule audit passed: ${metadataByFile.size} structured rules/scenarios plus ${docsFiles.length} AI design documents.`);
}

if (warnings.length) {
  console.warn(`AI rule audit warnings (${warnings.length})`);
  warnings.forEach((warning) => console.warn(`- ${warning}`));
}
