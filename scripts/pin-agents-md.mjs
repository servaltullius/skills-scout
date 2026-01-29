import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import process from "node:process";
import { pathToFileURL } from "node:url";

const START_MARKER = "<!-- skills-scout:start -->";
const END_MARKER = "<!-- skills-scout:end -->";

function uniqLower(items) {
  const seen = new Set();
  const out = [];
  for (const item of items) {
    const norm = `${item}`.trim().toLowerCase();
    if (!norm) continue;
    if (seen.has(norm)) continue;
    seen.add(norm);
    out.push(norm);
  }
  return out;
}

function uniqStrings(items) {
  const seen = new Set();
  const out = [];
  for (const item of items) {
    const value = `${item}`.trim();
    if (!value) continue;
    if (seen.has(value)) continue;
    seen.add(value);
    out.push(value);
  }
  return out;
}

function tokenize(text) {
  return `${text}`
    .toLowerCase()
    .split(/[^a-z0-9]+/g)
    .filter((t) => t.length >= 3);
}

function keywordsFromPackageName(pkgName) {
  const raw = `${pkgName}`.trim().toLowerCase();
  if (!raw) return [];

  const tokens = new Set();
  for (const t of raw.split(/[@/]/g)) {
    for (const part of t.split(/[^a-z0-9]+/g)) {
      if (part.length >= 3) tokens.add(part);
    }
  }

  // Common scoped package conventions.
  if (raw === "@playwright/test" || raw.startsWith("@playwright/") || raw === "playwright") {
    tokens.add("playwright");
    tokens.add("e2e");
  }
  if (raw === "next") {
    tokens.add("next");
    tokens.add("nextjs");
    tokens.add("vercel");
  }

  return [...tokens];
}

async function fileExists(filePath) {
  try {
    await fs.stat(filePath);
    return true;
  } catch {
    return false;
  }
}

async function readJson(filePath) {
  const raw = await fs.readFile(filePath, "utf8");
  return JSON.parse(raw);
}

async function inferRepoKeywords(repoRoot) {
  const keywords = new Set();

  const packageJsonPath = path.join(repoRoot, "package.json");
  if (await fileExists(packageJsonPath)) {
    try {
      const pkg = await readJson(packageJsonPath);
      const deps = Object.keys(pkg?.dependencies ?? {});
      const devDeps = Object.keys(pkg?.devDependencies ?? {});
      for (const dep of [...deps, ...devDeps]) {
        for (const k of keywordsFromPackageName(dep)) keywords.add(k);
      }
    } catch {
      // Ignore parse errors; keyword inference is best-effort.
    }
  }

  if (await fileExists(path.join(repoRoot, ".github", "workflows"))) {
    keywords.add("github");
    keywords.add("actions");
    keywords.add("workflow");
    keywords.add("ci");
  }

  for (const lockfile of ["pnpm-lock.yaml", "yarn.lock", "package-lock.json"]) {
    if (await fileExists(path.join(repoRoot, lockfile))) keywords.add(lockfile.split("-")[0]);
  }

  for (const configPrefix of ["playwright.config", "next.config", "vite.config", "cypress.config"]) {
    for (const ext of [".js", ".cjs", ".mjs", ".ts"]) {
      if (await fileExists(path.join(repoRoot, `${configPrefix}${ext}`))) {
        for (const token of tokenize(configPrefix)) keywords.add(token);
      }
    }
  }

  return [...keywords];
}

function parseSkillFrontmatter(skillMd) {
  const match = skillMd.match(/^---\s*\n([\s\S]*?)\n---\s*\n?/);
  if (!match) return null;

  const yaml = match[1];
  const out = {};
  for (const line of yaml.split("\n")) {
    const m = line.match(/^([a-zA-Z][a-zA-Z0-9_-]*):\s*(.*)\s*$/);
    if (!m) continue;
    const key = m[1];
    let value = m[2] ?? "";
    value = value.replace(/^["']|["']$/g, "").trim();
    out[key] = value;
  }

  if (!out.name) return null;
  return {
    name: out.name,
    description: out.description ?? "",
  };
}

async function collectSkillFiles(rootDir) {
  const out = [];
  const queue = [rootDir];

  while (queue.length > 0) {
    const dir = queue.pop();
    if (!dir) continue;

    let entries;
    try {
      entries = await fs.readdir(dir, { withFileTypes: true });
    } catch {
      continue;
    }

    for (const entry of entries) {
      const entryPath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        if (entry.name === "node_modules" || entry.name === ".git") continue;
        queue.push(entryPath);
        continue;
      }

      if (entry.isFile() && entry.name === "SKILL.md") {
        out.push(entryPath);
      }
    }
  }

  return out;
}

async function loadSkills(skillRoots) {
  const skills = [];
  const seenSkillFiles = new Set();

  for (const root of skillRoots) {
    if (!root) continue;
    const resolved = root.startsWith("~")
      ? path.join(os.homedir(), root.slice(1))
      : root;
    const absRoot = path.resolve(resolved);
    if (!(await fileExists(absRoot))) continue;

    for (const skillFile of await collectSkillFiles(absRoot)) {
      let real;
      try {
        real = await fs.realpath(skillFile);
      } catch {
        real = skillFile;
      }
      if (seenSkillFiles.has(real)) continue;
      seenSkillFiles.add(real);

      let raw;
      try {
        raw = await fs.readFile(skillFile, "utf8");
      } catch {
        continue;
      }

      const meta = parseSkillFrontmatter(raw);
      if (!meta) continue;

      skills.push({
        name: meta.name,
        description: meta.description,
        skillFile: skillFile,
      });
    }
  }

  return skills;
}

function scoreSkill(skill, keywords) {
  const haystack = `${skill.name}\n${skill.description}`.toLowerCase();
  let score = 0;
  for (const keyword of keywords) {
    if (!keyword) continue;
    if (haystack.includes(keyword)) score += 1;
  }
  return score;
}

function generatePinnedSection(skills) {
  const lines = [
    "## Skills (Auto-Pinned by skills-scout)",
    "",
    "This section is generated. Re-run pinning to update.",
    "",
    "### Available skills",
  ];

  if (skills.length === 0) {
    lines.push("- (none matched this repo)");
    return lines.join("\n");
  }

  for (const skill of skills) {
    const desc = (skill.description || "").trim();
    const descPart = desc ? `: ${desc}` : "";
    lines.push(`- ${skill.name}${descPart} (file: ${skill.skillFile})`);
  }

  return lines.join("\n");
}

function upsertBlock(existing, block) {
  const startIdx = existing.indexOf(START_MARKER);
  const endIdx = existing.indexOf(END_MARKER);

  if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
    const afterEnd = endIdx + END_MARKER.length;
    const before = existing.slice(0, startIdx).replace(/\s*$/, "");
    const after = existing.slice(afterEnd).replace(/^\s*\n?/, "\n");
    return `${before}\n\n${block}\n${after}`.replace(/^\s*\n/, "");
  }

  const closeInstructionsIdx = existing.indexOf("</INSTRUCTIONS>");
  if (closeInstructionsIdx !== -1) {
    const before = existing.slice(0, closeInstructionsIdx).replace(/\s*$/, "");
    const after = existing.slice(closeInstructionsIdx);
    return `${before}\n\n${block}\n\n${after}`;
  }

  return `${existing.replace(/\s*$/, "")}\n\n${block}\n`;
}

function buildBlock(pinnedSection) {
  return [START_MARKER, pinnedSection.trimEnd(), END_MARKER].join("\n");
}

function defaultSkillRoots(repoRoot) {
  const home = os.homedir();
  return uniqStrings([
    path.join(home, ".codex", "skills"),
    path.join(home, ".agents", "skills"),
    path.join(repoRoot, ".codex", "skills"),
    path.join(repoRoot, ".agents", "skills"),
  ]);
}

export async function run({ repoRoot, skillRoots, write }) {
  const repo = path.resolve(repoRoot || process.cwd());
  const roots = (skillRoots && skillRoots.length > 0 ? skillRoots : defaultSkillRoots(repo)).map(
    (r) => r,
  );

  const keywords = uniqLower(await inferRepoKeywords(repo));
  const skills = await loadSkills(roots);

  const scored = skills
    .map((skill) => ({ skill, score: scoreSkill(skill, keywords) }))
    .filter((s) => s.score > 0)
    .sort((a, b) => (b.score !== a.score ? b.score - a.score : a.skill.name.localeCompare(b.skill.name)))
    .map((s) => s.skill);

  const pinnedSection = generatePinnedSection(scored);
  const block = buildBlock(pinnedSection);

  const agentsPath = path.join(repo, "AGENTS.md");
  const existing = (await fileExists(agentsPath)) ? await fs.readFile(agentsPath, "utf8") : null;
  const base =
    existing ??
    ["<INSTRUCTIONS>", "", "# Repo Agent Instructions", "", "</INSTRUCTIONS>", ""].join("\n");
  const next = upsertBlock(base, block);

  if (write) {
    await fs.writeFile(agentsPath, next, "utf8");
  } else {
    process.stdout.write(next);
  }

  return {
    agentsPath,
    wrote: Boolean(write),
    pinned: scored.map((s) => s.name),
  };
}

function parseArgs(argv) {
  const out = { repoRoot: process.cwd(), skillRoots: [], write: false };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--repo") {
      out.repoRoot = argv[i + 1];
      i += 1;
      continue;
    }
    if (arg === "--skill-root") {
      out.skillRoots.push(argv[i + 1]);
      i += 1;
      continue;
    }
    if (arg === "--write") {
      out.write = true;
      continue;
    }
    if (arg === "--help" || arg === "-h") {
      out.help = true;
      continue;
    }
  }

  return out;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    // eslint-disable-next-line no-console
    console.log(
      [
        "Usage: node pin-agents-md.mjs [--repo <path>] [--skill-root <path> ...] [--write]",
        "",
        "Defaults to dry-run (prints would-be AGENTS.md). Use --write to apply.",
      ].join("\n"),
    );
    return;
  }

  await run(args);
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((err) => {
    // eslint-disable-next-line no-console
    console.error(err);
    process.exitCode = 1;
  });
}
