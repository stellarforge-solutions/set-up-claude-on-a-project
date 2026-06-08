#!/usr/bin/env node
// Project 1 — Definition of Done check.
//
// Walks the whole Definition of Done in three buckets:
//   • Required       — verified automatically; these decide pass/fail.
//   • Hints          — best-effort checks that flag likely problems but never block.
//   • Check yourself — needs a live Claude session or human judgement, so the
//                      script just lists them as reminders.
//
// Run any time with:  npm run check

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const required = [];
const hints = [];
const pass = (msg) => required.push({ ok: true, msg });
const fail = (msg) => required.push({ ok: false, msg });
const hint = (msg) => hints.push(msg);

function read(file) {
  const full = path.join(process.cwd(), file);
  return fs.existsSync(full) ? fs.readFileSync(full, "utf8") : null;
}

// Required: CLAUDE.md exists and has content
const claudeMd = read("CLAUDE.md");
if (claudeMd === null) {
  fail("CLAUDE.md is missing from the project root.");
} else if (claudeMd.trim().length === 0) {
  fail("CLAUDE.md exists but is empty.");
} else {
  pass("CLAUDE.md is present and has content.");

  const commandHits = (claudeMd.match(/npm (run |test|install|start)/g) || []).length;
  if (commandHits < 2) {
    hint(`CLAUDE.md mentions about ${commandHits} npm command(s); the DoD asks for at least 2 — check yours are listed.`);
  }
  const headers = (claudeMd.match(/^#{1,6}\s/gm) || []).length;
  if (headers < 2) {
    hint("CLAUDE.md has few section headers; the DoD expects Commands, Conventions, and Architecture.");
  }
  if (!/architect|server\.js|routes|db\//i.test(claudeMd)) {
    hint("CLAUDE.md doesn't obviously mention the architecture (server.js / routes / db); the DoD asks for a short architecture note.");
  }
}

// Hint: possible secrets in CLAUDE.md or NOTES.md
const secretPatterns = [
  /sk-[a-z0-9]{16,}/i,
  /AKIA[0-9A-Z]{16}/,
  /-----BEGIN [A-Z ]*PRIVATE KEY-----/,
  /(api[_-]?key|secret|token|password)\s*[:=]\s*['"]?[A-Za-z0-9_\-]{12,}/i,
];
for (const file of ["CLAUDE.md", "NOTES.md"]) {
  const text = read(file);
  if (text && secretPatterns.some((re) => re.test(text))) {
    hint(`${file} contains something that looks like a secret (key/token/password); the DoD says no secrets — double-check.`);
  }
}

// Required: .claude/settings.json valid, with >=1 allow and >=1 deny rule
const settingsRaw = read(path.join(".claude", "settings.json"));
if (settingsRaw === null) {
  fail(".claude/settings.json is missing.");
} else {
  let settings = null;
  try {
    settings = JSON.parse(settingsRaw);
  } catch (err) {
    fail(".claude/settings.json is not valid JSON: " + err.message);
  }
  if (settings) {
    const perms = settings.permissions || {};
    const allow = Array.isArray(perms.allow) ? perms.allow : [];
    const deny = Array.isArray(perms.deny) ? perms.deny : [];
    if (allow.length >= 1) pass(`.claude/settings.json has ${allow.length} allow rule(s).`);
    else fail(".claude/settings.json needs at least one allow rule.");
    if (deny.length >= 1) pass(`.claude/settings.json has ${deny.length} deny rule(s).`);
    else fail(".claude/settings.json needs at least one deny rule.");
  }
}

// Required: NOTES.md exists and has content
const notes = read("NOTES.md");
if (notes === null) {
  fail("NOTES.md is missing from the project root.");
} else if (notes.trim().length === 0) {
  fail("NOTES.md exists but is empty.");
} else {
  pass("NOTES.md is present and has content.");
}

// Hint: is Claude Code installed here? (best-effort, never blocks)
try {
  const v = execSync("claude --version", { stdio: ["ignore", "pipe", "ignore"] }).toString().trim();
  hint(`Claude Code detected here (${v}).`);
} catch {
  hint('Could not run "claude --version" here — make sure Claude Code is installed and signed in on your machine (can\'t be checked from the repo).');
}

// Report
console.log("\nProject 1 — Definition of Done check\n");
console.log("Required (these decide pass/fail):");
for (const r of required) console.log(`  ${r.ok ? "PASS" : "FAIL"}  ${r.msg}`);

if (hints.length) {
  console.log("\nHints (worth a look, not blocking):");
  for (const h of hints) console.log(`  ~  ${h}`);
}

console.log("\nCheck these yourself (a script can't verify them):");
console.log("  -  In a fresh Claude session, /memory shows your CLAUDE.md as loaded.");
console.log("  -  /permissions shows your allow / deny / ask rules.");
console.log('  -  Claude answers a project question (e.g. "How do I run the tests?") from your CLAUDE.md without you explaining.');
console.log("  -  Every line in CLAUDE.md earns its place; NOTES.md explains your real reasoning.");

const failures = required.filter((r) => !r.ok);
console.log("");
if (failures.length === 0) {
  console.log("All required checks passed. Review the hints and the manual items, then submit.\n");
  process.exit(0);
} else {
  console.log(`${failures.length} required check(s) failed — fix those before you submit.\n`);
  process.exit(1);
}
