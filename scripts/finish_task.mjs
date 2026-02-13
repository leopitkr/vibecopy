#!/usr/bin/env node
/**
 * finish_task.mjs
 *
 * Automates the "done" workflow:
 * 1) Create/update feature doc (optional)
 * 2) Commit implementation changes (feature commit)
 * 3) Append the feature commit short hash to the milestone checkbox line
 * 4) Commit milestone update (docs commit)
 *
 * Usage:
 *   node scripts/finish_task.mjs \
 *     --item "ESLint / Prettier 설정" \
 *     --milestone "require/VibeCopy_Development_Milestones.md" \
 *     --doc "docs/features/phase0/eslint_prettier_setup.md" \
 *     --msg "chore: add ESLint/Prettier setup"
 *
 * Notes:
 * - This script creates TWO commits (feature, then docs hash record).
 * - The milestone line will reference the FEATURE commit hash.
 */

import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

function getArg(name) {
  const idx = process.argv.indexOf(`--${name}`);
  if (idx === -1) return null;
  return process.argv[idx + 1] ?? null;
}

function run(cmd) {
  return execSync(cmd, { stdio: "pipe" }).toString().trim();
}

function runInherit(cmd) {
  execSync(cmd, { stdio: "inherit" });
}

const item = getArg("item");
const milestonePath = getArg("milestone") || "require/VibeCopy_Development_Milestones.md";
const docPath = getArg("doc");
const msg = getArg("msg") || `chore: complete milestone item - ${item}`;

if (!item) {
  console.error("ERROR: --item is required (exact checkbox label text).");
  process.exit(1);
}

function ensureCleanGitOrWarn() {
  const status = run("git status --porcelain");
  if (!status) {
    console.warn("WARN: git working tree is clean. Nothing to commit besides milestone/docs updates.");
  }
}

function ensureDocFile(p) {
  if (!p) return;
  const abs = path.resolve(p);
  const dir = path.dirname(abs);
  fs.mkdirSync(dir, { recursive: true });

  if (!fs.existsSync(abs)) {
    const content = `# Feature: ${item}\n\n## Milestone Item\n- Milestone: \n- Checkbox: - [ ] ${item}\n\n## Summary\n\n## Files Changed\n\n## How to Test\n\n## Edge Cases / Known Limits\n\n## Follow-ups (optional)\n`;
    fs.writeFileSync(abs, content, "utf-8");
    console.log(`Created doc: ${p}`);
  } else {
    console.log(`Doc exists: ${p}`);
  }
}

function updateMilestoneFile(p, commitHashOrNull) {
  const abs = path.resolve(p);
  if (!fs.existsSync(abs)) {
    console.error(`ERROR: milestone file not found: ${p}`);
    process.exit(1);
  }

  const raw = fs.readFileSync(abs, "utf-8").split(/\r?\n/);

  let found = false;
  const updated = raw.map((line) => {
    const unchecked = `- [ ] ${item}`;
    const checked = `- [x] ${item}`;

    if (line.startsWith(unchecked) || line.startsWith(checked)) {
      found = true;

      let newLine = line.replace(unchecked, checked).replace(checked, checked);

      if (commitHashOrNull) {
        newLine = newLine.replace(/\s*\(commit:\s*[0-9a-fA-F]+\)\s*$/, "");
        newLine = newLine.replace(/\s*\(commit:\s*<SHORT_HASH>\)\s*$/, "");
        newLine = `${newLine}  (commit: ${commitHashOrNull})`;
      } else {
        if (!/\(commit:\s*/.test(newLine)) {
          newLine = `${newLine}  (commit: <SHORT_HASH>)`;
        }
      }

      return newLine;
    }
    return line;
  });

  if (!found) {
    console.error(`ERROR: Could not find milestone checkbox line for item: "${item}"`);
    console.error(`Looked for line starting with: "- [ ] ${item}"`);
    process.exit(1);
  }

  fs.writeFileSync(abs, updated.join("\n"), "utf-8");
  console.log(`Updated milestone: ${p}`);
}

function stageFiles(files) {
  if (!files || files.length === 0) return;
  const quoted = files.map((f) => `"${f}"`).join(" ");
  runInherit(`git add ${quoted}`);
}

function safeCommit(message) {
  try {
    runInherit(`git commit -m "${message.replace(/"/g, '\\"')}"`);
    return true;
  } catch {
    console.warn("WARN: git commit failed (maybe nothing staged).");
    return false;
  }
}

function main() {
  ensureCleanGitOrWarn();
  ensureDocFile(docPath);

  // Feature commit (stages everything)
  runInherit("git add -A");
  const didCommit = safeCommit(msg);

  let featureHash = run("git rev-parse --short HEAD");
  if (!didCommit) {
    featureHash = run("git rev-parse --short HEAD");
  }

  // Milestone update commit (references feature commit hash)
  updateMilestoneFile(milestonePath, featureHash);
  stageFiles([milestonePath]);

  const docsMsg = `docs: record commit hash for milestone - ${item}`;
  safeCommit(docsMsg);

  console.log("\\nDONE ✅");
  console.log(`Feature commit: ${featureHash}`);
  console.log(`Milestone updated in: ${milestonePath}`);
}

main();
