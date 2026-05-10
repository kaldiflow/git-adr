#!/usr/bin/env node
'use strict';

const { Command } = require('commander');
const { install } = require('../src/install');
const { run } = require('../src/generate');

const program = new Command();

program
  .name('git-adr')
  .description('AI-generated Architecture Decision Records from git diffs')
  .version('1.0.0');

program
  .command('install')
  .description('Install the post-commit hook in the current repo')
  .action(install);

program
  .command('run')
  .description('Generate an ADR for the latest commit (called by the git hook)')
  .action(run);

program.parse();
