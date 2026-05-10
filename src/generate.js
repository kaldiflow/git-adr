'use strict';

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const Anthropic = require('@anthropic-ai/sdk');

const SYSTEM_PROMPT = `You are an expert software architect. Analyze git commits and generate concise Architecture Decision Records (ADRs) in standard markdown format.

Focus on the WHY behind changes — the reasoning, patterns used, trade-offs, and consequences — not just a summary of what changed. Be direct and concrete. Aim for 200-400 words total.`;

const MAX_DIFF_CHARS = 12000;

function getGitRoot() {
  return execSync('git rev-parse --show-toplevel', { encoding: 'utf8' }).trim();
}

function getDiff() {
  try {
    return execSync('git diff HEAD~1 HEAD', { encoding: 'utf8' });
  } catch {
    // First commit in the repo — no parent exists
    return execSync('git show HEAD', { encoding: 'utf8' });
  }
}

async function run() {
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error('git-adr: ANTHROPIC_API_KEY is not set — skipping.');
    process.exit(0);
  }

  let gitRoot;
  try {
    gitRoot = getGitRoot();
  } catch {
    process.exit(0);
  }

  const commitHash = execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim().slice(0, 8);
  const commitMsg = execSync('git log -1 --pretty=%s', { encoding: 'utf8' }).trim();
  const diff = getDiff();

  if (!diff.trim()) {
    console.log('git-adr: empty diff, skipping.');
    process.exit(0);
  }

  const truncatedDiff = diff.length > MAX_DIFF_CHARS
    ? diff.slice(0, MAX_DIFF_CHARS) + '\n\n[diff truncated]'
    : diff;

  const decisionsDir = path.join(gitRoot, 'docs', 'decisions');
  fs.mkdirSync(decisionsDir, { recursive: true });

  const existingCount = fs.readdirSync(decisionsDir).filter(f => /^\d{4}-/.test(f)).length;
  const adrNumber = String(existingCount + 1).padStart(4, '0');
  const today = new Date().toISOString().slice(0, 10);

  const client = new Anthropic();

  console.log('git-adr: generating ADR...');

  const response = await client.messages.create({
    model: 'claude-opus-4-7',
    max_tokens: 1024,
    system: [
      {
        type: 'text',
        text: SYSTEM_PROMPT,
        cache_control: { type: 'ephemeral' },
      },
    ],
    messages: [
      {
        role: 'user',
        content: `Generate ADR-${adrNumber} for this commit.

Commit: ${commitHash}
Message: ${commitMsg}

Git diff:
\`\`\`
${truncatedDiff}
\`\`\`

Use exactly this structure:

# ADR-${adrNumber}: {concise title}

**Date:** ${today}
**Status:** Accepted

## Context
What situation or problem prompted this change?

## Decision
What was decided? What pattern or approach was chosen and why?

## Consequences
Trade-offs, risks, and benefits of this decision.

## Files Changed
Key files and what changed in each.`,
      },
    ],
  });

  const adrContent = response.content[0].text;

  const slug = commitMsg
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 50);
  const filename = `${adrNumber}-${slug}.md`;
  const filepath = path.join(decisionsDir, filename);

  fs.writeFileSync(filepath, adrContent);

  execSync(`git add "${filepath}"`, { cwd: gitRoot });
  execSync(`git commit -m "docs(adr): ${adrNumber} - ${commitMsg}"`, { cwd: gitRoot });

  console.log(`git-adr: ADR written → docs/decisions/${filename}`);
}

module.exports = { run };
