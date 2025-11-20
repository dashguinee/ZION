#!/usr/bin/env node

/**
 * Soussou Engine - Interactive CLI
 *
 * Interactive command-line interface for testing Soussou language processing.
 * Features:
 * - Real-time normalization
 * - Context detection
 * - Response generation
 * - Translation display
 */

const readline = require('readline');
const fs = require('fs');
const path = require('path');

// Load modules
const variantNormalizer = require('./src/variant_normalizer');
const { normalize, normalizePhrase } = require('./src/normalize');

// Load training examples for response matching
const trainingPath = path.join(__dirname, 'data', 'training_examples.json');
let trainingExamples = [];

try {
  trainingExamples = JSON.parse(fs.readFileSync(trainingPath, 'utf8'));
} catch (e) {
  console.error('Warning: Could not load training examples');
}

// =============================================================================
// RESPONSE MATCHING
// =============================================================================

/**
 * Find matching training example for input
 */
function findMatchingExample(input) {
  const normalizedInput = variantNormalizer.normalizeInput(input);

  // Try exact match first
  for (const example of trainingExamples) {
    const exNorm = variantNormalizer.normalizeInput(example.soussou);
    if (exNorm === normalizedInput) {
      return example;
    }
  }

  // Try fuzzy match
  let bestMatch = null;
  let bestScore = 0;

  for (const example of trainingExamples) {
    const exNorm = variantNormalizer.normalizeInput(example.soussou);
    const score = variantNormalizer.similarityScore(normalizedInput, exNorm);

    if (score > bestScore && score > 0.7) {
      bestScore = score;
      bestMatch = example;
    }
  }

  return bestMatch;
}

/**
 * Detect sentence type from input
 */
function detectSentenceType(input) {
  const normalized = variantNormalizer.normalizeInput(input);

  // Question patterns
  if (input.includes('?')) {
    if (normalized.includes('minde')) return 'location_question';
    if (normalized.includes('songo yiri') || normalized.includes('songo')) return 'price_question';
    if (normalized.includes('wakhati yiri') || normalized.includes('tuma yiri')) return 'time_question';
    if (normalized.includes('di ra')) return 'what_question';
    if (normalized.includes('khafe mu ra')) return 'why_question';
    if (normalized.includes('nomma') || normalized.includes('no\'mma')) return 'ability_question';
    if (normalized.includes('eske')) return 'formal_question';
    if (normalized.includes('lafia')) return 'health_question';
    return 'yes_no_question';
  }

  // Command patterns
  const commandVerbs = ['fa', 'siga', 'dokho', 'mmeme', 'alou', 'keli', 'mato', 'khili'];
  const firstWord = normalized.split(' ')[0];
  if (commandVerbs.includes(firstWord)) {
    return 'imperative';
  }

  // Greeting patterns
  if (normalized.includes('kena') || normalized.includes('suba')) return 'greeting';
  if (normalized.includes('ala xa baraka') || normalized.includes('ala xa')) return 'blessing';

  // Statement with negation
  if (normalized.includes('mma')) return 'negative_statement';

  return 'declarative';
}

/**
 * Analyze input and generate response
 */
function analyzeInput(input) {
  // Normalize
  const normalized = variantNormalizer.normalizeInput(input);

  // Find word matches
  const matches = variantNormalizer.findMatches(input);

  // Detect type
  const sentenceType = detectSentenceType(input);

  // Find matching example
  const example = findMatchingExample(input);

  return {
    original: input,
    normalized,
    sentenceType,
    matches,
    example,
    response: example?.response || null,
    context: example?.context || 'unknown'
  };
}

// =============================================================================
// DISPLAY FUNCTIONS
// =============================================================================

function displayAnalysis(analysis) {
  console.log('\n' + '-'.repeat(50));

  // Input analysis
  console.log(`Input: "${analysis.original}"`);
  console.log(`Normalized: "${analysis.normalized}"`);
  console.log(`Type: ${analysis.sentenceType}`);
  console.log(`Context: ${analysis.context}`);

  // Word matches
  const foundWords = analysis.matches.filter(m => m.found);
  const unknownWords = analysis.matches.filter(m => !m.found);

  if (foundWords.length > 0) {
    console.log('\nRecognized words:');
    for (const match of foundWords) {
      const entry = match.entry;
      const english = entry?.english || '';
      const french = entry?.french || '';
      console.log(`  ${match.original} -> ${match.base} (${english || french})`);
    }
  }

  if (unknownWords.length > 0) {
    console.log('\nUnrecognized words:');
    for (const match of unknownWords) {
      // Try to suggest
      const suggestions = variantNormalizer.suggestMatches(match.original, 3);
      if (suggestions.length > 0) {
        const suggStr = suggestions.map(s => s.base).join(', ');
        console.log(`  ${match.original} (suggestions: ${suggStr})`);
      } else {
        console.log(`  ${match.original}`);
      }
    }
  }

  // Response
  if (analysis.response) {
    console.log('\nResponse:');
    console.log(`  Soussou: "${analysis.response.soussou}"`);
    console.log(`  English: "${analysis.response.english}"`);
    console.log(`  French:  "${analysis.response.french}"`);
  } else {
    console.log('\nNo matching response found');
  }

  console.log('-'.repeat(50) + '\n');
}

function displayHelp() {
  console.log(`
Soussou Engine - Interactive CLI

Commands:
  /help          Show this help message
  /stats         Show system statistics
  /examples      Show example sentences
  /contexts      Show available contexts
  /normalize <text>  Normalize text without analysis
  /lookup <word>     Look up a word in the lexicon
  /fuzzy <text>      Find fuzzy matches
  /quit or /exit     Exit the CLI

Usage:
  Type any Soussou text and press Enter to analyze it.
  The system will show:
  - Normalized form
  - Detected sentence type
  - Recognized/unrecognized words
  - Suggested response with translation
`);
}

function displayStats() {
  const stats = variantNormalizer.getStats();
  console.log('\nSoussou Engine Statistics:');
  console.log(`  Lexicon bases: ${stats.totalBases}`);
  console.log(`  Variant mappings: ${stats.totalVariantMappings}`);
  console.log(`  Normalized mappings: ${stats.totalNormalizedMappings}`);
  console.log(`  Training examples: ${trainingExamples.length}`);
  console.log(`  Generated: ${stats.generatedAt}`);
  console.log();
}

function displayExamples() {
  console.log('\nExample sentences:\n');

  const samples = trainingExamples.slice(0, 10);
  for (const ex of samples) {
    console.log(`  [${ex.context}]`);
    console.log(`  > ${ex.soussou}`);
    console.log(`    ${ex.english}`);
    console.log();
  }

  console.log(`... and ${trainingExamples.length - 10} more examples\n`);
}

function displayContexts() {
  const contexts = [...new Set(trainingExamples.map(ex => ex.context))].sort();

  console.log('\nAvailable contexts:\n');

  for (const ctx of contexts) {
    const count = trainingExamples.filter(ex => ex.context === ctx).length;
    console.log(`  ${ctx}: ${count} example(s)`);
  }

  console.log(`\nTotal: ${contexts.length} contexts\n`);
}

// =============================================================================
// COMMAND HANDLING
// =============================================================================

function handleCommand(input) {
  const parts = input.slice(1).split(' ');
  const cmd = parts[0].toLowerCase();
  const args = parts.slice(1).join(' ');

  switch (cmd) {
    case 'help':
      displayHelp();
      return true;

    case 'stats':
      displayStats();
      return true;

    case 'examples':
      displayExamples();
      return true;

    case 'contexts':
      displayContexts();
      return true;

    case 'normalize':
      if (args) {
        const normalized = variantNormalizer.normalizeInput(args);
        console.log(`\n"${args}" -> "${normalized}"\n`);
      } else {
        console.log('\nUsage: /normalize <text>\n');
      }
      return true;

    case 'lookup':
      if (args) {
        const info = variantNormalizer.getWordInfo(args);
        if (info) {
          console.log('\nWord Info:');
          console.log(`  Input: ${info.input}`);
          console.log(`  Base: ${info.base}`);
          console.log(`  English: ${info.english}`);
          console.log(`  French: ${info.french}`);
          console.log(`  Category: ${info.category}`);
          console.log(`  Variants: ${info.variants.slice(0, 5).join(', ')}${info.variants.length > 5 ? '...' : ''}`);
          console.log();
        } else {
          console.log(`\nWord "${args}" not found in lexicon\n`);
        }
      } else {
        console.log('\nUsage: /lookup <word>\n');
      }
      return true;

    case 'fuzzy':
      if (args) {
        const matches = variantNormalizer.fuzzyMatch(args, 0.5);
        console.log(`\nFuzzy matches for "${args}":\n`);
        if (matches.length > 0) {
          for (const match of matches.slice(0, 10)) {
            console.log(`  ${match.base} (score: ${match.score.toFixed(2)})`);
          }
        } else {
          console.log('  No matches found');
        }
        console.log();
      } else {
        console.log('\nUsage: /fuzzy <text>\n');
      }
      return true;

    case 'quit':
    case 'exit':
      console.log('\nAla xa baraka! (God bless!)\n');
      process.exit(0);

    default:
      console.log(`\nUnknown command: ${cmd}\nType /help for available commands.\n`);
      return true;
  }
}

// =============================================================================
// MAIN INTERACTIVE LOOP
// =============================================================================

function startInteractive() {
  console.log('='.repeat(50));
  console.log('  Soussou Engine - Interactive CLI');
  console.log('='.repeat(50));
  console.log('\nType Soussou text to analyze, or /help for commands.');
  console.log('Type /quit to exit.\n');

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: '> '
  });

  rl.prompt();

  rl.on('line', (line) => {
    const input = line.trim();

    if (!input) {
      rl.prompt();
      return;
    }

    if (input.startsWith('/')) {
      handleCommand(input);
    } else {
      const analysis = analyzeInput(input);
      displayAnalysis(analysis);
    }

    rl.prompt();
  });

  rl.on('close', () => {
    console.log('\nAla xa baraka! (God bless!)\n');
    process.exit(0);
  });
}

// =============================================================================
// BATCH MODE
// =============================================================================

function processBatch(inputs) {
  console.log('Soussou Engine - Batch Processing\n');
  console.log('='.repeat(50));

  for (const input of inputs) {
    const analysis = analyzeInput(input);
    displayAnalysis(analysis);
  }
}

// =============================================================================
// ENTRY POINT
// =============================================================================

const args = process.argv.slice(2);

if (args.length === 0) {
  // Interactive mode
  startInteractive();
} else if (args[0] === '--help' || args[0] === '-h') {
  displayHelp();
} else if (args[0] === '--batch' || args[0] === '-b') {
  // Batch mode from file
  if (args[1]) {
    try {
      const content = fs.readFileSync(args[1], 'utf8');
      const inputs = content.split('\n').filter(line => line.trim());
      processBatch(inputs);
    } catch (e) {
      console.error(`Error reading file: ${e.message}`);
      process.exit(1);
    }
  } else {
    console.error('Usage: cli.js --batch <filename>');
    process.exit(1);
  }
} else {
  // Single input mode
  const input = args.join(' ');
  const analysis = analyzeInput(input);
  displayAnalysis(analysis);
}

module.exports = {
  analyzeInput,
  findMatchingExample,
  detectSentenceType
};
