# skills-scout

Codex skill for discovering relevant agent skills and installing them **only after**:

1) quick project scan (stack/package manager/framework/CI)
2) hard-mode vetting (repo metadata + risky commands)
3) explicit user consent

## Install (Codex)

Global install for Codex:

```bash
npx -y skills add servaltullius/skills-scout -g -a codex -y
```

List installed global skills for Codex:

```bash
npx -y skills ls -g -a codex
```

