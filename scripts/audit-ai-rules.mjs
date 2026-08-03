#!/usr/bin/env node

import { readFile, readdir, stat } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const projectRoot = path.resolve(import.meta.dirname, "..");
const agentsPath = path.join(projectRoot, "AGENTS.md");
const rulesRoot = path.join(projectRoot, ".ai/rules");
const indexPath = path.join(rulesRoot, "README.md");
const packageJson = JSON.parse(await readFile(path.join(projectRoot, "package.json"), "utf8"));
const errors = [];

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

async function exists(file) {
  try {
    return (await stat(file)).isFile();
  } catch {
    return false;
  }
}

const ruleFiles = (await markdownFiles(rulesRoot)).sort();
const allMarkdownFiles = [agentsPath, ...ruleFiles];
const sources = new Map(
  await Promise.all(allMarkdownFiles.map(async (file) => [file, await readFile(file, "utf8")])),
);
const agentsLines = sources.get(agentsPath).trimEnd().split("\n").length;
if (agentsLines > 80) errors.push(`AGENTS.md must remain a short routing entry (found ${agentsLines} lines; maximum 80)`);

const indexSource = sources.get(indexPath);
for (const file of ruleFiles) {
  if (file === indexPath) continue;
  const route = path.relative(rulesRoot, file).split(path.sep).join("/");
  if (!indexSource.includes(`(${route})`)) errors.push(`${relative(file)} is not routed from .ai/rules/README.md`);
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
  console.log(`AI rule audit passed: AGENTS.md plus ${ruleFiles.length} progressively disclosed rule documents.`);
}
