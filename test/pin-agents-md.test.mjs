import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import { run } from "../scripts/pin-agents-md.mjs";

async function writeFile(filePath, contents) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, contents, "utf8");
}

test("pins relevant installed skills into repo AGENTS.md", async () => {
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "skills-scout-"));
  const repoRoot = path.join(tmpDir, "repo");
  const skillsRoot = path.join(tmpDir, "skills");

  await fs.mkdir(repoRoot, { recursive: true });
  await fs.mkdir(skillsRoot, { recursive: true });

  await writeFile(
    path.join(repoRoot, "package.json"),
    JSON.stringify(
      {
        name: "temp-repo",
        private: true,
        devDependencies: {
          "@playwright/test": "^1.0.0",
          next: "^15.0.0",
        },
      },
      null,
      2,
    ),
  );
  await writeFile(path.join(repoRoot, ".github", "workflows", "ci.yml"), "name: CI\n");

  await writeFile(
    path.join(skillsRoot, "playwright-expert", "SKILL.md"),
    [
      "---",
      "name: playwright-expert",
      "description: Use when a repo uses Playwright for end-to-end testing.",
      "---",
      "",
      "# Playwright Expert",
      "",
    ].join("\n"),
  );

  await run({ repoRoot, skillRoots: [skillsRoot], write: true });

  const agentsMd = await fs.readFile(path.join(repoRoot, "AGENTS.md"), "utf8");
  assert.match(agentsMd, /<!-- skills-scout:start -->/);
  assert.match(agentsMd, /<!-- skills-scout:end -->/);
  assert.match(agentsMd, /\bplaywright-expert\b/);
});

test("pinning is idempotent", async () => {
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "skills-scout-"));
  const repoRoot = path.join(tmpDir, "repo");
  const skillsRoot = path.join(tmpDir, "skills");

  await fs.mkdir(repoRoot, { recursive: true });
  await fs.mkdir(skillsRoot, { recursive: true });

  await writeFile(
    path.join(repoRoot, "package.json"),
    JSON.stringify(
      {
        name: "temp-repo",
        private: true,
        devDependencies: {
          "@playwright/test": "^1.0.0",
        },
      },
      null,
      2,
    ),
  );
  await writeFile(
    path.join(skillsRoot, "playwright-expert", "SKILL.md"),
    ["---", "name: playwright-expert", "description: Use when a repo uses Playwright.", "---", ""].join(
      "\n",
    ),
  );

  await run({ repoRoot, skillRoots: [skillsRoot], write: true });
  const first = await fs.readFile(path.join(repoRoot, "AGENTS.md"), "utf8");

  await run({ repoRoot, skillRoots: [skillsRoot], write: true });
  const second = await fs.readFile(path.join(repoRoot, "AGENTS.md"), "utf8");

  assert.equal(second, first);
  assert.equal((second.match(/skills-scout:start/g) ?? []).length, 1);
  assert.equal((second.match(/^- playwright-expert\b/gm) ?? []).length, 1);
});
