#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import path from "node:path";

const root = process.cwd();
const scriptsDir = path.join(root, ".github", "skills", "tailwind-warning-orchestrator", "scripts");

const dryRun = process.argv.includes("--dry-run");

function run(scriptName, extraArgs = []) {
  const scriptPath = path.join(scriptsDir, scriptName);
  const res = spawnSync(process.execPath, [scriptPath, ...extraArgs], {
    stdio: "inherit",
    cwd: root,
  });

  if (typeof res.status === "number" && res.status !== 0) {
    return res.status;
  }
  return 0;
}

console.log("[1/2] Canonical tailwind class fixer running...");
const code1 = run("fix-canonical-tailwind.mjs", dryRun ? ["--dry-run"] : []);
if (code1 !== 0 && !dryRun) process.exit(code1);

console.log("\n[2/2] Inline style report running...");
const code2 = run("report-inline-styles.mjs");

if (dryRun) {
  process.exit(code1 || code2);
}

// report-inline-styles intentionally returns non-zero when findings exist.
process.exit(0);
