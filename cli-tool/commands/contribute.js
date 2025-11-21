import inquirer from 'inquirer';
import chalk from 'chalk';
import ora from 'ora';
import { addSentence, detectPattern } from '../utils/api.js';

export async function contribute(options) {
  console.log(chalk.cyan('\n🇬🇳 ZION Soussou Contribution Tool\n'));

  // Quick mode
  if (options.quick) {
    return await quickMode(options);
  }

  // Interactive mode
  await interactiveMode();
}

async function quickMode(options) {
  const { quick: soussou, french, english } = options;

  if (!soussou || !french) {
    console.log(chalk.red('❌ Quick mode requires --quick and --french flags'));
    console.log(chalk.gray('Example: zion contribute --quick "Ma woto mafoura" --french "Ma voiture est rapide"'));
    return;
  }

  const spinner = ora('Saving contribution...').start();

  try {
    const result = await addSentence({
      soussou,
      french,
      english,
      contributed_by: 'Z-Core'
    });

    spinner.succeed(chalk.green(`✅ Saved! ID: ${result.id}`));
    console.log(chalk.gray(`Pattern detected: ${result.detected_pattern} (${Math.round(result.confidence * 100)}%)`));
    console.log(chalk.gray(`📊 Today: ${result.stats.today} | Total: ${result.stats.total}`));

  } catch (error) {
    spinner.fail(chalk.red('Failed to save'));
    console.error(chalk.red(error.message));
  }
}

async function interactiveMode() {
  const { action } = await inquirer.prompt([{
    type: 'list',
    name: 'action',
    message: 'What would you like to do?',
    choices: [
      'Teach a sentence',
      'Add a word',
      'View stats',
      'Exit'
    ]
  }]);

  if (action === 'Exit') {
    console.log(chalk.cyan('\n👋 Goodbye!\n'));
    return;
  }

  if (action === 'Teach a sentence') {
    await teachSentence();
  } else if (action === 'Add a word') {
    console.log(chalk.yellow('📝 Word addition coming soon!'));
  } else if (action === 'View stats') {
    const { stats } = await import('./stats.js');
    await stats();
  }

  // Ask to continue
  const { continue: cont } = await inquirer.prompt([{
    type: 'confirm',
    name: 'continue',
    message: 'Continue?',
    default: true
  }]);

  if (cont) {
    await interactiveMode();
  } else {
    console.log(chalk.cyan('\n👋 Goodbye!\n'));
  }
}

async function teachSentence() {
  console.log(chalk.bold('\n--- TEACH A SENTENCE ---\n'));

  const answers = await inquirer.prompt([
    {
      type: 'input',
      name: 'soussou',
      message: 'Soussou sentence:',
      validate: (input) => input.length > 0 || 'Required'
    },
    {
      type: 'input',
      name: 'french',
      message: 'French translation:',
      validate: (input) => input.length > 0 || 'Required'
    },
    {
      type: 'input',
      name: 'english',
      message: 'English translation (optional):',
    },
    {
      type: 'input',
      name: 'cultural_context',
      message: 'Cultural context (optional):',
    }
  ]);

  // Detect pattern
  const spinner = ora('Analyzing pattern...').start();
  try {
    const pattern = await detectPattern(answers.soussou);
    spinner.succeed(`Pattern detected: ${chalk.green(pattern.pattern)}`);
    console.log(chalk.gray(`  Template: ${pattern.template}`));
    console.log(chalk.gray(`  Confidence: ${Math.round(pattern.confidence * 100)}%\n`));

    // Confirm
    const { correct } = await inquirer.prompt([{
      type: 'confirm',
      name: 'correct',
      message: 'Does this pattern look correct?',
      default: true
    }]);

    if (!correct) {
      const { correction } = await inquirer.prompt([{
        type: 'input',
        name: 'correction',
        message: 'What pattern should it be?'
      }]);
      answers.pattern_hint = correction;
    }

    // Save
    const saveSpinner = ora('Saving to corpus...').start();
    const result = await addSentence({
      ...answers,
      contributed_by: 'Z-Core'
    });

    saveSpinner.succeed(chalk.green(`✅ Saved! ID: ${result.id}`));
    console.log(chalk.gray(`\n📊 Contributions today: ${result.stats.today}`));
    console.log(chalk.gray(`📈 Total corpus: ${result.stats.total}\n`));

  } catch (error) {
    spinner.fail(chalk.red('Error'));
    console.error(chalk.red(error.message));
  }
}
