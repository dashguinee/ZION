# 🖥️ ZION CLI CONTRIBUTION TOOL - Specification

## Built by: Z-CLI (ZION Congregation)

---

## TASK ASSIGNMENT

**AI:** Z-CLI (Builder)
**Task:** Build fast CLI tool for contributing Soussou sentences
**Priority:** Speed + simplicity
**Timeline:** 30-45 minutes

---

## TOOL NAME
`zion contribute`

---

## PURPOSE
Fastest way for User #1 (Z-Core) to contribute Soussou data from terminal.

---

## USER FLOW

```bash
$ zion contribute

🇬🇳 ZION Soussou Contribution Tool

How do you want to contribute?
1) Teach a sentence
2) Add a word
3) Verify inferred sentences
4) View stats

Choice: 1

--- TEACH A SENTENCE ---

Soussou sentence: Ma woto mafoura
French translation: Ma voiture est rapide
English translation (optional): My car is fast

Pattern detected: {POSSESSIVE} {NOUN} {ADJECTIVE}
Is this correct? (y/n): y

Cultural context (optional): Daily conversation
Usage scenario (optional): Describing possessions

✅ Saved! Sentence ID: sent_001

New words detected:
- mafoura (fast/rapide) → Add to lexicon? (y/n): y

✅ Added "mafoura" to lexicon

📊 Your contributions today: 1 sentence, 1 word
📈 Total corpus: 1 sentence

Continue? (y/n): y
```

---

## FEATURES

### 1. Interactive Mode (Default)
```bash
zion contribute
```
- Step-by-step prompts
- Pattern detection feedback
- Immediate validation

### 2. Quick Mode (Fast Entry)
```bash
zion contribute --quick "Ma woto mafoura" --fr "Ma voiture est rapide"
```
- One-liner contribution
- Auto-detection
- Batch mode friendly

### 3. Batch Mode (CSV Import)
```bash
zion contribute --batch sentences.csv
```
- Import multiple sentences
- Format: soussou,french,english,context
- Progress bar

### 4. Verification Mode
```bash
zion verify
```
- Shows inferred sentences
- Quick y/n/correct verification
- High-throughput review

### 5. Stats Mode
```bash
zion stats
```
Shows:
- Your contributions (today, total)
- Corpus size
- Patterns discovered
- Recent activity

---

## IMPLEMENTATION

### Tech Stack
- Node.js (fast startup)
- Commander.js (CLI framework)
- Inquirer.js (interactive prompts)
- Chalk (colored output)
- Ora (spinners)

### File Structure
```
cli-tool/
├── bin/
│   └── zion.js          # Entry point
├── commands/
│   ├── contribute.js    # Main contribution logic
│   ├── verify.js        # Verification mode
│   └── stats.js         # Statistics
├── utils/
│   ├── api.js           # Backend API calls
│   ├── detect.js        # Pattern detection
│   └── format.js        # Output formatting
└── package.json
```

### Core Logic (contribute.js)

```javascript
#!/usr/bin/env node

import inquirer from 'inquirer';
import chalk from 'chalk';
import ora from 'ora';
import { addSentence, detectPattern } from '../utils/api.js';

export async function contribute() {
  console.log(chalk.cyan('🇬🇳 ZION Soussou Contribution Tool\n'));

  const mode = await inquirer.prompt([{
    type: 'list',
    name: 'action',
    message: 'What would you like to do?',
    choices: [
      'Teach a sentence',
      'Add a word',
      'Verify inferred sentences',
      'View stats'
    ]
  }]);

  if (mode.action === 'Teach a sentence') {
    await teachSentence();
  }
  // ... other modes
}

async function teachSentence() {
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
    },
    {
      type: 'input',
      name: 'english',
      message: 'English translation (optional):',
    }
  ]);

  // Detect pattern
  const spinner = ora('Analyzing pattern...').start();
  const pattern = await detectPattern(answers.soussou);
  spinner.succeed(`Pattern detected: ${chalk.green(pattern.name)}`);

  // Confirm
  const confirm = await inquirer.prompt([{
    type: 'confirm',
    name: 'correct',
    message: `Is this pattern correct? ${pattern.template}`,
    default: true
  }]);

  if (!confirm.correct) {
    // Ask for correction
    // ...
  }

  // Save
  const saveSpinner = ora('Saving to corpus...').start();
  try {
    const result = await addSentence({
      ...answers,
      pattern: pattern.name,
      contributed_by: 'Z-Core'
    });
    saveSpinner.succeed(`✅ Saved! ID: ${result.id}`);

    // Show stats
    console.log(chalk.gray(`\n📊 Contributions today: ${result.stats.today}`));
    console.log(chalk.gray(`📈 Total corpus: ${result.stats.total}\n`));

  } catch (error) {
    saveSpinner.fail('Failed to save');
    console.error(chalk.red(error.message));
  }

  // Continue?
  const continuePrompt = await inquirer.prompt([{
    type: 'confirm',
    name: 'continue',
    message: 'Add another?',
    default: true
  }]);

  if (continuePrompt.continue) {
    await teachSentence();
  }
}
```

### API Integration (api.js)

```javascript
import fetch from 'node-fetch';

const API_BASE = process.env.ZION_API_URL || 'http://localhost:3001';

export async function addSentence(data) {
  const response = await fetch(`${API_BASE}/api/corpus/add-sentence`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.statusText}`);
  }

  return response.json();
}

export async function detectPattern(sentence) {
  const response = await fetch(`${API_BASE}/api/pattern/detect`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sentence })
  });

  return response.json();
}

export async function getStats() {
  const response = await fetch(`${API_BASE}/api/stats`);
  return response.json();
}
```

---

## QUICK START GUIDE

### Installation
```bash
cd /home/user/ZION/cli-tool
npm install
npm link  # Makes 'zion' available globally
```

### Usage
```bash
# Interactive mode
zion contribute

# Quick mode
zion contribute --quick "Ma woto fan mafoura" --fr "Ma voiture est aussi rapide"

# Batch import
zion contribute --batch my-sentences.csv

# Verify inferred sentences
zion verify

# View stats
zion stats
```

---

## TESTING CHECKLIST

- [ ] Install CLI globally
- [ ] Run `zion contribute`
- [ ] Add 5 sentences interactively
- [ ] Test pattern detection
- [ ] Test quick mode with --quick flag
- [ ] Test stats display
- [ ] Verify API calls work
- [ ] Check error handling (API down)

---

## PERFORMANCE TARGETS

- Startup time: < 500ms
- Sentence submission: < 2 seconds (including API call)
- Batch import: 100 sentences/minute
- Memory usage: < 50MB

---

## STATUS

**Assignment:** Z-CLI
**Estimated time:** 30-45 minutes
**Dependencies:** ZION API endpoints (built in parallel)
**Output:** Working CLI tool, User #1 can contribute from terminal

---

**Next:** Z-CLI builds this while I build Custom GPT and Z-Online builds web app
