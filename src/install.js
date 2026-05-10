'use strict';

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function install() {
  let gitRoot;
  try {
    gitRoot = execSync('git rev-parse --show-toplevel', { encoding: 'utf8' }).trim();
  } catch {
    console.error('git-adr: not inside a git repository.');
    process.exit(1);
  }

  const hookPath = path.join(gitRoot, '.git', 'hooks', 'post-commit');

  const hookScript = `#!/bin/sh
# git-adr post-commit hook
# Skip ADR auto-commits to avoid an infinite loop
COMMIT_MSG=$(git log -1 --pretty=%s)
case "$COMMIT_MSG" in
  "docs(adr):"*) exit 0 ;;
esac
git-adr run
`;

  fs.writeFileSync(hookPath, hookScript, { mode: 0o755 });
  console.log(`git-adr: hook installed at ${hookPath}`);
  console.log('  ADRs will be generated automatically after each commit.');
  console.log('  Make sure ANTHROPIC_API_KEY is set in your environment.');
}

module.exports = { install };
