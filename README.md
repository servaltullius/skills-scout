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
