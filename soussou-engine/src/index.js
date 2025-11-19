/**
 * Soussou Engine - Main Entry Point
 *
 * A natural language processing engine for the Soussou language.
 * Soussou is spoken by approximately 2 million people in Guinea,
 * Sierra Leone, and Guinea-Bissau.
 *
 * Core Features:
 * - Phonetic normalization (handles spelling variants)
 * - Text matching and search
 * - Language processing utilities
 */

const {
  normalize,
  normalizePhrase,
  areEquivalent,
  removeAccents,
  compressDoubleConsonants,
  runTests,
  printTestResults,
  testCases
} = require('./normalize');

/**
 * Soussou Engine main class
 */
class SoussouEngine {
  constructor(options = {}) {
    this.options = {
      caseSensitive: false,
      ...options
    };
  }

  /**
   * Normalize a word or phrase
   * @param {string} text - Input text
   * @returns {string} Normalized text
   */
  normalize(text) {
    if (text.includes(' ')) {
      return normalizePhrase(text);
    }
    return normalize(text);
  }

  /**
   * Check if two texts are phonetically equivalent
   * @param {string} a - First text
   * @param {string} b - Second text
   * @returns {boolean} True if equivalent
   */
  areEquivalent(a, b) {
    return areEquivalent(a, b);
  }

  /**
   * Find matches in a list of words/phrases
   * @param {string} query - Search query
   * @param {string[]} corpus - List of words/phrases to search
   * @returns {string[]} Matching items from corpus
   */
  findMatches(query, corpus) {
    const normalizedQuery = this.normalize(query);
    return corpus.filter(item => this.normalize(item) === normalizedQuery);
  }

  /**
   * Get the engine version
   * @returns {string} Version string
   */
  static get version() {
    return '0.1.0';
  }
}

// Export everything
module.exports = {
  // Main class
  SoussouEngine,

  // Direct function access
  normalize,
  normalizePhrase,
  areEquivalent,
  removeAccents,
  compressDoubleConsonants,

  // Testing utilities
  runTests,
  printTestResults,
  testCases
};

// CLI execution
if (require.main === module) {
  const args = process.argv.slice(2);

  if (args.length === 0 || args[0] === '--help' || args[0] === '-h') {
    console.log('Soussou Engine v' + SoussouEngine.version);
    console.log('\nUsage:');
    console.log('  node index.js --test           Run normalization tests');
    console.log('  node index.js --normalize "text"  Normalize a word/phrase');
    console.log('  node index.js --compare "a" "b"   Check if two texts are equivalent');
    console.log('\nExamples:');
    console.log('  node index.js --normalize "Nna fafé"');
    console.log('  node index.js --compare "n\'a fafé" "na fafe"');
    process.exit(0);
  }

  if (args[0] === '--test') {
    printTestResults();
    process.exit(0);
  }

  if (args[0] === '--normalize' && args[1]) {
    const result = args[1].includes(' ') ? normalizePhrase(args[1]) : normalize(args[1]);
    console.log(`"${args[1]}" → "${result}"`);
    process.exit(0);
  }

  if (args[0] === '--compare' && args[1] && args[2]) {
    const equivalent = areEquivalent(args[1], args[2]);
    console.log(`"${args[1]}" vs "${args[2]}"`);
    console.log(`Normalized: "${normalizePhrase(args[1])}" vs "${normalizePhrase(args[2])}"`);
    console.log(`Equivalent: ${equivalent ? 'YES' : 'NO'}`);
    process.exit(0);
  }

  console.error('Invalid arguments. Use --help for usage.');
  process.exit(1);
}
