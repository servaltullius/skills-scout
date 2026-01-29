# skills-scout

한국어(KR) / English(EN)

---

## 소개 (KR)

`skills-scout`는 Codex에서 작업을 진행할 때, 필요한 “에이전트 스킬(Agent Skills)”을 찾아서 **검증한 뒤** 사용자에게 옵션을 안내하고, **명시적 동의가 있을 때만** 전역으로 설치하도록 돕는 스킬입니다.

핵심 목표는 “스킬을 빨리 찾되, 무분별하게 설치하지 않기”입니다.

### 동작 방식 (요약)

1) **프로젝트 빠른 스캔**: 현재 프로젝트의 스택/패키지 매니저/프레임워크/CI 등을 빠르게 확인해서 검색어를 정교화합니다.  
2) **스킬 검색**: `npx skills find "<query>"`로 후보를 찾습니다.  
3) **Hard mode 검증**: 추천 전에 아래를 확인합니다.
   - GitHub API로 `archived`, `license`, `pushed_at`, `stars` 등 메타데이터 확인
   - `SKILL.md`/스크립트에서 위험 신호 스캔(예: `rm -rf`, `sudo`, `curl | sh`, 비밀키/토큰 요구 등)
4) **옵션 제시 → 동의 확인**: `skills.sh` 링크 + 정확한 설치 명령을 번호로 보여주고, 사용자가 선택한 것만 설치합니다.

### 설치 (Codex)

Codex에 전역 설치:

```bash
npx -y skills add servaltullius/skills-scout -g -a codex -y
```

전역으로 설치된 Codex 스킬 목록:

```bash
npx -y skills ls -g -a codex
```

### 사용

Superpowers 시스템을 쓰는 환경이라면, 아래처럼 스킬을 로드해 사용할 수 있습니다:

```bash
~/.codex/superpowers/.codex/superpowers-codex use-skill skills-scout
```

> 참고: 이 스킬은 “설치 자동화”가 목적이 아니라, **검색→검증→동의→설치**의 안전한 절차를 강제하는 것이 목적입니다.

### (권장) 프로젝트 시작 시 준자동 루틴 켜기 (`~/.codex/AGENTS.md`)

처음 설치한 사람이라면, 아래 “프로젝트 시작 루틴”을 전역 `~/.codex/AGENTS.md`에 추가해두는 것을 권장합니다(파일 수정은 항상 사용자 동의 후):

1) 어떤 스킬이 이 레포에 맞는지 미리보기(dry-run)
   - `node ~/.codex/skills/skills-scout/scripts/pin-agents-md.mjs --repo .`
2) 출력 내용을 사용자에게 보여주고 적용할지 물어보기
3) 동의 시 레포 `AGENTS.md`에 반영(재실행해도 중복 없음)
   - `node ~/.codex/skills/skills-scout/scripts/pin-agents-md.mjs --repo . --write`

### (선택) 설치된 스킬을 레포 `AGENTS.md`에 자동으로 핀(pin)하기

전역으로 스킬을 설치해도, 해당 레포의 `AGENTS.md`에 명시되어 있지 않으면 Codex가 “사용 가능한 스킬 목록”으로 인식하지 못할 수 있습니다.

`skills-scout`에는 설치된 스킬(전역 + 레포 로컬)을 스캔해서, 현재 레포에 관련 있어 보이는 스킬을 골라 `AGENTS.md`에 자동으로 적어주는 스크립트가 포함되어 있습니다.

드라이런(미적용, 출력만):

```bash
node ~/.codex/skills/skills-scout/scripts/pin-agents-md.mjs --repo .
```

적용(파일 수정):

```bash
node ~/.codex/skills/skills-scout/scripts/pin-agents-md.mjs --repo . --write
```

### `find-skills`(vercel-labs/skills)와의 차이

`skills-scout`는 아래의 공식 스킬과 목표가 겹치지만, **Codex 환경에서 “더 보수적으로” 스킬을 설치/운영**하기 위해 추가 규칙을 강제합니다.

- 참고(원본): https://github.com/vercel-labs/skills/blob/main/skills/find-skills/SKILL.md

차이점 요약:
- `find-skills`는 Skills CLI 사용법과 “검색→옵션 제시→설치”의 기본 흐름을 안내하는 **범용** 스킬입니다.
- `skills-scout`는 **Hard mode 검증(메타데이터/위험 커맨드) + 명시적 동의 게이트 + Codex 전역 설치(-g -a codex)**를 기본값으로 강제합니다.
- `skills-scout`는 추가로, 설치된 스킬을 레포 `AGENTS.md`에 자동으로 핀해서 **레포 단위로 스킬이 실제로 ‘보이도록’** 하는 보조 스크립트를 제공합니다.

---

## Overview (EN)

`skills-scout` is a Codex skill that helps you discover relevant agent skills and install them **only after**:

1) a quick project scan (stack/package manager/framework/CI)
2) hard‑mode vetting (repo metadata + risky commands)
3) explicit user consent

The goal is to “find fast, install safely” — search broadly, but do not trust or install blindly.

## Install (Codex)

Global install for Codex:

```bash
npx -y skills add servaltullius/skills-scout -g -a codex -y
```

List installed global skills for Codex:

```bash
npx -y skills ls -g -a codex
```

## Recommended: enable the “project start” semi-auto routine (`~/.codex/AGENTS.md`)

For first-time installs, it’s recommended to add a small “project start” routine to your global `~/.codex/AGENTS.md`, so each new repo begins by pinning relevant installed skills into that repo’s `AGENTS.md` (always ask before writing):

1) Preview (dry-run):
   - `node ~/.codex/skills/skills-scout/scripts/pin-agents-md.mjs --repo .`
2) Show output and ask whether to apply
3) If approved, write/update repo `AGENTS.md` (idempotent):
   - `node ~/.codex/skills/skills-scout/scripts/pin-agents-md.mjs --repo . --write`

## Optional: Pin installed skills into a repo `AGENTS.md`

Even if you install skills globally, Codex may not “see” them for a given repo unless they are listed in that repo’s `AGENTS.md`.

This repo includes a helper script that scans installed skills (global + repo-local), picks relevant ones for the current repo, and writes/updates a generated pinned block in `<repo>/AGENTS.md` (creates it if missing).

Dry-run (prints would-be `AGENTS.md`):

```bash
node ~/.codex/skills/skills-scout/scripts/pin-agents-md.mjs --repo .
```

Apply changes:

```bash
node ~/.codex/skills/skills-scout/scripts/pin-agents-md.mjs --repo . --write
```

## How this differs from `find-skills` (vercel-labs/skills)

`skills-scout` overlaps with the upstream skill below, but it is intentionally **stricter for Codex** (install safely, not blindly).

- Reference: https://github.com/vercel-labs/skills/blob/main/skills/find-skills/SKILL.md

Summary:
- `find-skills` is a general guide for using the Skills CLI and presenting/installing options.
- `skills-scout` adds **hard‑mode vetting + explicit consent gates + Codex global install defaults (-g -a codex)**.
- `skills-scout` also includes an optional helper to pin installed skills into a repo `AGENTS.md` so they are actually “visible” per repo.
