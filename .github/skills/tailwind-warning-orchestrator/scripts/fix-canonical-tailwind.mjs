#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const TARGET_DIRS = ["src", "app", "components", "lib", "hooks", "types"];
const EXTS = new Set([".ts", ".tsx", ".js", ".jsx", ".css", ".mdx"]);

const DRY_RUN = process.argv.includes("--dry-run");

/** @param {string} dir */
function walk(dir) {
  if (!fs.existsSync(dir)) return [];
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith(".")) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...walk(full));
      continue;
    }
    if (EXTS.has(path.extname(entry.name))) out.push(full);
  }
  return out;
}

/** @type {[RegExp, string][]} */
const REPLACEMENTS = [
  [/\bbg-\[var\((--[a-zA-Z0-9-_]+)\)\]/g, "bg-($1)"],
  [/\btext-\[var\((--[a-zA-Z0-9-_]+)\)\]/g, "text-($1)"],
  [/\bborder-\[var\((--[a-zA-Z0-9-_]+)\)\]/g, "border-($1)"],
  [/\bring-\[var\((--[a-zA-Z0-9-_]+)\)\]/g, "ring-($1)"],
  [/\bfrom-\[var\((--[a-zA-Z0-9-_]+)\)\]/g, "from-($1)"],
  [/\bvia-\[var\((--[a-zA-Z0-9-_]+)\)\]/g, "via-($1)"],
  [/\bto-\[var\((--[a-zA-Z0-9-_]+)\)\]/g, "to-($1)"],
  [/\bbg-gradient-to-/g, "bg-linear-to-"],
  [/\baspect-\[(\d+)\/(\d+)\]/g, "aspect-$1/$2"],
  [/\bz-\[(\d+)\]/g, "z-$1"],
  [/\bduration-\[(\d+)ms\]/g, "duration-$1"],
];

const files = TARGET_DIRS.flatMap((d) => walk(path.join(ROOT, d)));
let touchedFiles = 0;

for (const file of files) {
  const original = fs.readFileSync(file, "utf8");
  let next = original;

  for (const [pattern, replacement] of REPLACEMENTS) {
    next = next.replace(pattern, replacement);
  }

  if (next !== original) {
    touchedFiles += 1;
    if (!DRY_RUN) {
      fs.writeFileSync(file, next, "utf8");
    }
    console.log(`${DRY_RUN ? "[DRY]" : "[FIX]"} ${path.relative(ROOT, file)}`);
  }
}

console.log(
  `\nDone. ${touchedFiles} file(s) ${DRY_RUN ? "would be" : "were"} updated.`,
);

if (DRY_RUN && touchedFiles > 0) {
  process.exitCode = 2;
}
