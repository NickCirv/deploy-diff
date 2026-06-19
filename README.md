<div align="center">

# deploy-diff

**See exactly what's in your next deploy — file-by-file diff with risk scoring before you ship.**

[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg?labelColor=0B0A09)](LICENSE)
[![Node >=18](https://img.shields.io/badge/node-%3E%3D18-brightgreen.svg?labelColor=0B0A09)](package.json)

</div>

## Install

> **Note:** Not yet published on npm. Run directly from GitHub:

```bash
npx github:NickCirv/deploy-diff
```

Or clone and run locally:

```bash
git clone https://github.com/NickCirv/deploy-diff
cd deploy-diff
npm install
node bin/diff.js
```

## Usage

```bash
# Auto-detect last deploy ref and diff against HEAD
npx github:NickCirv/deploy-diff

# Diff from a specific tag or commit
npx github:NickCirv/deploy-diff --from v1.4.2
npx github:NickCirv/deploy-diff --from v1.4.2 --to HEAD
```

| Flag | Description |
|------|-------------|
| `--from <ref>` | Git ref to diff from (tag, commit SHA, or branch). Auto-detected if omitted. |
| `--to <ref>` | Git ref to diff to. Defaults to `HEAD`. |

## What it does

Auto-detects your last deploy ref from tags (`v*`, `deploy-*`, `release-*`), deploy-tagged commits, or platform marker files (`.render-deploy`, `.vercel-deploy`, `DEPLOY_REF`), then diffs against HEAD. Every changed file is classified as **LOW / MEDIUM / HIGH** risk based on path patterns — migrations, auth files, env configs, and Docker files escalate to HIGH automatically. A plain-English summary prints at the end so you know whether to stop and review before pushing to production.

### Use in CI

```yaml
- name: Pre-deploy diff
  run: npx github:NickCirv/deploy-diff --from $LAST_DEPLOY_SHA --to HEAD
```

---
<sub>Dependencies: chalk · commander · Node >=18 · MIT · by <a href="https://github.com/NickCirv">NickCirv</a></sub>
