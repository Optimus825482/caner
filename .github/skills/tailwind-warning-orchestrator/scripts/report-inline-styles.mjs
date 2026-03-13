#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const TARGET_DIRS = ["src", "app", "components", "lib", "hooks"];
const EXTS = new Set([".ts", ".tsx", ".js", ".jsx"]);

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

const files = TARGET_DIRS.flatMap((d) => walk(path.join(ROOT, d)));
const regex = /style\s*=\s*\{\{/g;

/** @type {{file:string,line:number,snippet:string}[]} */
const findings = [];

for (const file of files) {
  const text = fs.readFileSync(file, "utf8");
  let match;
  while ((match = regex.exec(text)) !== null) {
    const idx = match.index;
    const line = text.slice(0, idx).split("\n").length;
    const lineText = text.split("\n")[line - 1] ?? "";
    findings.push({
      file: path.relative(ROOT, file),
      line,
      snippet: lineText.trim().slice(0, 200),
    });
  }
}

if (findings.length === 0) {
  console.log("No inline style usages found.");
  process.exit(0);
}

console.log(`Found ${findings.length} inline style usage(s):\n`);
for (const f of findings) {
  console.log(`- ${f.file}:${f.line}`);
  if (f.snippet) console.log(`  ${f.snippet}`);
}

const reportPath = path.join(ROOT, "tailwind-inline-style-report.json");
fs.writeFileSync(reportPath, JSON.stringify(findings, null, 2), "utf8");
console.log(`\nJSON report written: ${path.relative(ROOT, reportPath)}`);
process.exitCode = 1;
