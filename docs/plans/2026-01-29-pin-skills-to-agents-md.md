# Pin Installed Skills Into Repo AGENTS.md Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Scan globally/repo installed skills, select relevant ones for the current repository, and write/update a pinned section in repo root `AGENTS.md` (create if missing).

**Architecture:** Add a small Node.js script (`scripts/pin-agents-md.mjs`) that (1) scans the project to infer stack keywords, (2) scans skill roots for `SKILL.md`, (3) scores skill relevance by keyword match, and (4) upserts a generated block in `AGENTS.md` using start/end markers. Default is dry-run; `--write` applies changes.

**Tech Stack:** Node.js (no external deps), `node:test` for tests.

---

### Task 1: Write failing test for AGENTS.md pinning

**Files:**
- Create: `test/pin-agents-md.test.mjs`

**Step 1: Write the failing test**
- Create a temp repo with `package.json` (includes `next`, `@playwright/test`) and `.github/workflows/`.
- Create a temp “skills root” with a `SKILL.md` named `playwright-expert`.
- Import `run()` from `scripts/pin-agents-md.mjs` and assert that `AGENTS.md` gets created with markers and includes `playwright-expert`.

**Step 2: Run test to verify it fails**

Run:
```bash
node --test test/pin-agents-md.test.mjs
```

Expected: FAIL with “Cannot find module …/scripts/pin-agents-md.mjs” (or missing export).

---

### Task 2: Implement the pinning script (minimal)

**Files:**
- Create: `scripts/pin-agents-md.mjs`

**Step 1: Implement minimal `run()`**
- Accept `{ repoRoot, skillRoots, write }`.
- Detect keywords from repo files (`package.json`, lockfiles, `.github/workflows`).
- Find skill directories (child dirs containing `SKILL.md`).
- Parse `name:` and `description:` from frontmatter.
- Score by keyword match; keep only `score > 0`.
- Generate a pinned block and upsert between markers:
  - `<!-- skills-scout:start -->`
  - `<!-- skills-scout:end -->`
- If `write` is true, write `AGENTS.md`; else print the would-be content.

**Step 2: Run test to verify it passes**
```bash
node --test test/pin-agents-md.test.mjs
```

Expected: PASS.

---

### Task 3: Add idempotency coverage

**Files:**
- Modify: `test/pin-agents-md.test.mjs`
- Modify: `scripts/pin-agents-md.mjs`

**Step 1: Test re-run does not duplicate**
- Run `run()` twice.
- Assert the markers appear once and pinned skill appears once.

**Step 2: Run test**
```bash
node --test test/pin-agents-md.test.mjs
```

Expected: PASS.

---

### Task 4: Document usage in the skill + README

**Files:**
- Modify: `SKILL.md`
- Modify: `README.md`

**Step 1: Add an optional workflow step**
- Add: “Scan installed skills and pin to repo `AGENTS.md`”.
- Provide commands:
  - Dry-run: `node ~/.codex/skills/skills-scout/scripts/pin-agents-md.mjs --repo .`
  - Write: `node ~/.codex/skills/skills-scout/scripts/pin-agents-md.mjs --repo . --write`

**Step 2: Verify manual run**
- In any repo, run dry-run and confirm output looks correct.

