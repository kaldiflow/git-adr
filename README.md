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

## Sample output

Here's an actual ADR generated from a real commit (`feat: add in-memory LRU cache with TTL eviction`):

```markdown
# ADR-0001: In-Memory LRU Cache with TTL Eviction

**Date:** 2026-05-10
**Status:** Accepted

## Context
The application needed a lightweight caching layer to reduce redundant
computation or repeated external calls. Introducing a full external cache
like Redis would add operational overhead for a use case where process-local
caching is sufficient. A simple unbounded `Map` was not viable because it
risks unbounded memory growth and cannot automatically expire stale data.

## Decision
A combined LRU + TTL cache implemented in pure JavaScript using a single
`Map`. JavaScript's `Map` preserves insertion order, which enables LRU
behavior cheaply: on every `get`, the accessed entry is deleted and
re-inserted to move it to the "most recently used" tail; on every `set`,
the first key (oldest) is evicted when the size limit is reached. TTL is
enforced lazily — expiry is checked only on `get`, avoiding the cost of
a background timer.

## Consequences

**Benefits:**
- Zero external dependencies; no Redis required.
- O(1) average-case get/set.
- TTL prevents serving arbitrarily stale data.

**Trade-offs:**
- Lazy TTL expiry means expired entries occupy memory until accessed.
- Process-local — not shared across nodes.
- No cache metrics instrumented, making it harder to tune in production.
- Delete-and-reinsert on every `get` may create GC pressure at high throughput.
```

That entire ADR was generated from the diff alone — no prompting beyond the commit message. Tiny diffs (< 10 changed lines) are skipped automatically.

## ADR format

Each generated file follows the standard [ADR format](https://adr.github.io) with these sections:

```
# ADR-NNNN: <title>
**Date:** <date>
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
