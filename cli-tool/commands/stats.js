import chalk from 'chalk';
import ora from 'ora';
import { getStats } from '../utils/api.js';

export async function stats() {
  const spinner = ora('Fetching statistics...').start();

  try {
    const data = await getStats();
    spinner.stop();

    console.log(chalk.bold('\n📊 ZION CORPUS STATISTICS\n'));

    console.log(chalk.cyan('Corpus:'));
    console.log(`  Sentences: ${chalk.bold(data.corpus.total_sentences)}`);
    console.log(`  Verified: ${chalk.green(data.corpus.verified_sentences)}`);
    console.log(`  Contributors: ${data.corpus.contributors}`);
    if (data.corpus.top_contributor) {
      console.log(`  Top: ${chalk.yellow(data.corpus.top_contributor)}`);
    }

    console.log(chalk.cyan('\nLexicon:'));
    console.log(`  Total words: ${chalk.bold(data.lexicon.total_words)}`);
    console.log(`  Verified: ${chalk.green(data.lexicon.verified_words)}`);
    console.log(`  Rate: ${chalk.yellow(data.lexicon.verification_rate)}`);

    console.log(chalk.cyan('\nPatterns:'));
    console.log(`  Templates: ${chalk.bold(data.templates.total_patterns)}`);

    console.log(chalk.gray(`\nLast updated: ${new Date(data.last_updated).toLocaleString()}`));
    console.log();

  } catch (error) {
    spinner.fail(chalk.red('Failed to fetch stats'));
    console.error(chalk.red(error.message));
  }
}
