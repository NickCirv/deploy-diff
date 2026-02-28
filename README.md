# deploy-diff

See exactly what is about to deploy — file-by-file diff with risk scoring before you ship.

<p align="center">
  <img src="https://img.shields.io/npm/v/deploy-diff.svg" alt="npm version" />
  <img src="https://img.shields.io/badge/node-%3E%3D18-brightgreen.svg" alt="node >= 18" />
  <img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="MIT license" />
</p>

## Why

You're about to run `git push` to production. Do you know what's in it? `deploy-diff` shows every changed file with added/removed line counts, classifies each one as LOW / MEDIUM / HIGH risk, and gives you a plain-English summary before anything ships. No surprises, no "I thought that was already deployed."

## Quick Start

```bash
npx deploy-diff
```

Auto-detects the last deploy ref from tags, deploy commits, or platform marker files. Diffs against HEAD.

## What It Does

- **Auto-detect last deploy** — checks for `deploy-*` / `release-*` / `v*` tags, deploy-tagged commits, platform marker files (`.render-deploy`, `.vercel-deploy`, `DEPLOY_REF`), falls back to `HEAD~1`
- **File-by-file diff** — shows every changed file with added lines, removed lines, and change type (added / modified / deleted / renamed)
- **Risk classification per file** — HIGH: env files, migrations, auth files, secrets, Docker configs, `package.json`; MEDIUM: API routes, controllers, models, webhook/payment handlers, YAML configs; LOW: docs, tests, assets, style files
- **Large change detection** — files with 200+ line changes automatically escalate to HIGH risk
- **Plain-English summary** — "This deploy changes 12 files, adds 340 lines, removes 80 lines. 2 HIGH risk changes (Database migration, Auth file). Overall risk: HIGH. Stop and review."
- **New API endpoint detection** — flags new files in `routes/`, `api/`, or `endpoints/` directories

## Example Output

```
  deploy-diff
  Comparing v1.4.2 → HEAD (auto-detected from tag v1.4.2)

  ────────────────────────────────────────────────────────────
  Files Changed   12
  Lines Added     +340
  Lines Removed   −80

  HIGH RISK
  [HIGH] migrations/0023_add_user_roles.sql     (Database migration)  +45 −0
  [HIGH] src/auth/jwt.ts                        (Auth file)           +28 −12

  MEDIUM RISK
  [MED]  src/api/users.ts                       (API handler)         +60 −15
  [MED]  src/controllers/payment.ts             (Payment logic)       +34 −8

  LOW RISK
  [LOW]  README.md                              (Documentation)       +20 −3
  [LOW]  src/components/Button.tsx              (General change)      +15 −5
  ... 6 more low-risk files

  ────────────────────────────────────────────────────────────
  Summary: This deploy changes 12 files, adds 340 lines, removes 80 lines.
  2 HIGH risk changes (Database migration, Auth file).
  Overall risk: HIGH. Stop and review.
  Comparing v1.4.2 → HEAD.
```

## Options

| Flag | Description | Default |
|------|-------------|---------|
| `--from <ref>` | Git ref to diff from (tag, commit, branch) | auto-detected |
| `--to <ref>` | Git ref to diff to | `HEAD` |

## Use in CI

```yaml
- name: Pre-deploy diff
  run: npx deploy-diff --from $LAST_DEPLOY_SHA --to HEAD
```

## Install Globally

```bash
npm i -g deploy-diff
```

## License

MIT
