import inquirer from 'inquirer';
import chalk from 'chalk';
import ora from 'ora';
import { getPendingVerification, verifySentence } from '../utils/api.js';

export async function verify() {
  console.log(chalk.cyan('\n🔍 VERIFY INFERRED SENTENCES\n'));

  const spinner = ora('Loading pending verifications...').start();

  try {
    const { pending, sentences } = await getPendingVerification();
    spinner.stop();

    if (pending === 0) {
      console.log(chalk.green('✅ No sentences need verification! 🎉\n'));
      return;
    }

    console.log(chalk.bold(`${pending} sentences pending verification\n`));

    for (const sentence of sentences) {
      await verifySingle(sentence);
    }

    console.log(chalk.green('\n✅ Verification complete!\n'));

  } catch (error) {
    spinner.fail(chalk.red('Failed to load'));
    console.error(chalk.red(error.message));
  }
}

async function verifySingle(sentence) {
  console.log(chalk.bold(`\n"${sentence.soussou}"`));
  console.log(chalk.gray(`French: ${sentence.french}`));
  if (sentence.english) {
    console.log(chalk.gray(`English: ${sentence.english}`));
  }
  console.log(chalk.gray(`Pattern: ${sentence.pattern} | Confidence: ${Math.round(sentence.confidence_score * 100)}%`));

  const { verdict } = await inquirer.prompt([{
    type: 'list',
    name: 'verdict',
    message: 'Is this correct?',
    choices: [
      { name: '✓ Correct', value: 'correct' },
      { name: '✗ Wrong', value: 'wrong' },
      { name: '→ Skip', value: 'skip' }
    ]
  }]);

  if (verdict === 'skip') {
    return;
  }

  if (verdict === 'correct') {
    const spinner = ora('Verifying...').start();
    try {
      await verifySentence(sentence.id, 'correct', null, 'Z-Core');
      spinner.succeed(chalk.green('Verified!'));
    } catch (error) {
      spinner.fail(chalk.red('Failed'));
    }
  } else {
    console.log(chalk.yellow('📝 Correction coming soon!'));
  }
}
