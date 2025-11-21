#!/usr/bin/env node

/**
 * ZION CLI Tool
 * Fast contribution interface for User #1
 */

import { program } from 'commander';
import { contribute } from '../commands/contribute.js';
import { verify } from '../commands/verify.js';
import { stats } from '../commands/stats.js';

program
  .name('zion')
  .description('ZION Soussou Learning CLI')
  .version('1.0.0');

program
  .command('contribute')
  .description('Contribute Soussou sentences')
  .option('-q, --quick <sentence>', 'Quick mode: add sentence directly')
  .option('-f, --french <translation>', 'French translation')
  .option('-e, --english <translation>', 'English translation')
  .action(contribute);

program
  .command('verify')
  .description('Verify inferred sentences')
  .action(verify);

program
  .command('stats')
  .description('View contribution statistics')
  .action(stats);

program.parse();
