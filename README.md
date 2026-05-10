# git-adr

Automatically generates Architecture Decision Records (ADRs) from your git diffs using Claude AI.

After every commit, `git-adr` captures the diff, sends it to Claude, and commits a structured markdown ADR to `docs/decisions/` in your repo — so the *why* behind every change is documented without any extra effort.

## Prerequisites

- Node.js 18+
- An [Anthropic API key](https://console.anthropic.com) with credits

## Install

```sh
npm install -g git-adr
```

## Setup

In any git repository you want to track:

```sh
git-adr install
```

This writes a `post-commit` hook to `.git/hooks/post-commit`. Make sure `ANTHROPIC_API_KEY` is exported in your shell profile (`.zprofile`, `.bash_profile`, etc.) so the hook can pick it up:

```sh
export ANTHROPIC_API_KEY="sk-ant-..."
```

## Usage

Just commit normally. After each commit, `git-adr` will:

1. Capture the diff
2. Send it to Claude
3. Write a markdown ADR to `docs/decisions/NNNN-<commit-slug>.md`
4. Auto-commit the ADR file

```sh
git commit -m "Add rate limiting to API endpoints"
# git-adr: generating ADR...
# git-adr: ADR written → docs/decisions/0004-add-rate-limiting-to-api-endpoints.md
```

## ADR format

Each generated file follows the standard [ADR format](https://adr.github.io):

```markdown
# ADR-0004: Add Rate Limiting to API Endpoints

**Date:** 2026-05-10
**Status:** Accepted

## Context
## Decision
## Consequences
## Files Changed
```

## Cost

Uses `claude-sonnet-4-6`. A typical ADR costs **$0.01–0.05** depending on diff size. Large diffs are truncated at 12,000 characters.

## License

MIT
