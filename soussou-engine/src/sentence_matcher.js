/**
 * Sentence Matcher - Core Translation Engine
 *
 * Uses 863 professionally translated English<->Susu sentence pairs
 * from Google SMOL dataset as verified translation source.
 *
 * Features:
 * - Exact match detection
 * - Fuzzy matching using Jaccard similarity
 * - Confidence scoring (0-1)
 * - Similar sentence suggestions
 */

const fs = require('fs');
const path = require('path');

// ============================================================================
// DATA LOADING
// ============================================================================

/**
 * Sentence pair from Google SMOL dataset
 * @typedef {Object} SentencePair
 * @property {string} src - English source sentence
 * @property {string} trg - Susu target translation
 * @property {number} id - Original dataset ID
 * @property {string[]} srcTokens - Tokenized source for matching
 */

/**
 * Match result from sentence matching
 * @typedef {Object} MatchResult
 * @property {string} english - Matched English sentence
 * @property {string} susu - Corresponding Susu translation
 * @property {number} confidence - Match confidence (0-1)
 * @property {string} matchType - 'exact' | 'fuzzy'
 * @property {number} id - Original dataset ID
 */

// Store loaded sentence pairs
let sentencePairs = [];
let isLoaded = false;

/**
 * Path to the SMOL dataset
 */
const DATA_PATH = path.join(__dirname, '../data/google_smol/smolsent_en_sus.jsonl');

/**
 * Load sentence pairs from JSONL file
 * Called automatically on first use, or can be called explicitly
 * @returns {number} Number of sentence pairs loaded
 */
function loadSentences() {
  if (isLoaded) {
    return sentencePairs.length;
  }

  try {
    const content = fs.readFileSync(DATA_PATH, 'utf-8');
    const lines = content.trim().split('\n');

    sentencePairs = lines.map(line => {
      const data = JSON.parse(line);
      return {
        src: data.src,
        trg: data.trg,
        id: data.id,
        // Pre-tokenize for faster matching
        srcTokens: tokenize(data.src)
      };
    });

    isLoaded = true;
    return sentencePairs.length;
  } catch (error) {
    console.error('Failed to load sentence pairs:', error.message);
    sentencePairs = [];
    isLoaded = true;
    return 0;
  }
}

/**
 * Ensure sentences are loaded before operations
 */
function ensureLoaded() {
  if (!isLoaded) {
    loadSentences();
  }
}

// ============================================================================
// TEXT PROCESSING
// ============================================================================

/**
 * Tokenize text into words for comparison
 * - Converts to lowercase
 * - Removes punctuation
 * - Splits into words
 * @param {string} text - Input text
 * @returns {string[]} Array of tokens
 */
function tokenize(text) {
  if (!text || typeof text !== 'string') {
    return [];
  }

  return text
    .toLowerCase()
    // Remove punctuation but keep apostrophes within words
    .replace(/[^\w\s']/g, ' ')
    // Normalize whitespace
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .filter(word => word.length > 0);
}

/**
 * Calculate Jaccard similarity between two token sets
 * Jaccard = |intersection| / |union|
 * @param {string[]} tokens1 - First token set
 * @param {string[]} tokens2 - Second token set
 * @returns {number} Similarity score (0-1)
 */
function jaccardSimilarity(tokens1, tokens2) {
  if (tokens1.length === 0 && tokens2.length === 0) {
    return 1.0;
  }
  if (tokens1.length === 0 || tokens2.length === 0) {
    return 0.0;
  }

  const set1 = new Set(tokens1);
  const set2 = new Set(tokens2);

  let intersection = 0;
  for (const token of set1) {
    if (set2.has(token)) {
      intersection++;
    }
  }

  const union = set1.size + set2.size - intersection;
  return intersection / union;
}

/**
 * Calculate weighted similarity that considers:
 * - Jaccard similarity (word overlap)
 * - Word order similarity (for very similar sentences)
 * - Length similarity
 * @param {string[]} tokens1 - First token set
 * @param {string[]} tokens2 - Second token set
 * @returns {number} Weighted similarity score (0-1)
 */
function weightedSimilarity(tokens1, tokens2) {
  // Base Jaccard similarity (60% weight)
  const jaccard = jaccardSimilarity(tokens1, tokens2);

  // Length similarity (20% weight)
  const maxLen = Math.max(tokens1.length, tokens2.length);
  const minLen = Math.min(tokens1.length, tokens2.length);
  const lengthSim = maxLen > 0 ? minLen / maxLen : 1.0;

  // Word order similarity (20% weight) - for high Jaccard matches
  let orderSim = 0;
  if (jaccard > 0.5) {
    // Count words in same relative position
    let inOrder = 0;
    for (let i = 0; i < Math.min(tokens1.length, tokens2.length); i++) {
      if (tokens1[i] === tokens2[i]) {
        inOrder++;
      }
    }
    orderSim = minLen > 0 ? inOrder / minLen : 0;
  }

  return jaccard * 0.6 + lengthSim * 0.2 + orderSim * 0.2;
}

// ============================================================================
// MATCHING FUNCTIONS
// ============================================================================

/**
 * Find matching sentences for an English input
 *
 * @param {string} englishInput - English sentence to match
 * @returns {MatchResult|null} Best match with confidence, or null if no match
 */
function findMatch(englishInput) {
  ensureLoaded();

  if (!englishInput || typeof englishInput !== 'string') {
    return null;
  }

  const inputTokens = tokenize(englishInput);
  const inputLower = englishInput.toLowerCase().trim();

  // First: Check for exact match
  for (const pair of sentencePairs) {
    if (pair.src.toLowerCase().trim() === inputLower) {
      return {
        english: pair.src,
        susu: pair.trg,
        confidence: 1.0,
        matchType: 'exact',
        id: pair.id
      };
    }
  }

  // Second: Fuzzy match using weighted similarity
  let bestMatch = null;
  let bestScore = 0;

  for (const pair of sentencePairs) {
    const score = weightedSimilarity(inputTokens, pair.srcTokens);

    if (score > bestScore) {
      bestScore = score;
      bestMatch = pair;
    }
  }

  if (bestMatch && bestScore > 0) {
    return {
      english: bestMatch.src,
      susu: bestMatch.trg,
      confidence: bestScore,
      matchType: 'fuzzy',
      id: bestMatch.id
    };
  }

  return null;
}

/**
 * Get verified Susu translation if confidence >= threshold
 *
 * @param {string} englishInput - English sentence to translate
 * @param {number} [threshold=0.7] - Minimum confidence required (0-1)
 * @returns {string|null} Susu translation if confident, null otherwise
 */
function getSusuTranslation(englishInput, threshold = 0.7) {
  const match = findMatch(englishInput);

  if (match && match.confidence >= threshold) {
    return match.susu;
  }

  return null;
}

/**
 * Suggest similar sentences from the dataset
 *
 * @param {string} englishInput - English sentence to find similar to
 * @param {number} [limit=5] - Maximum number of suggestions
 * @returns {MatchResult[]} Array of similar sentences, sorted by confidence
 */
function suggestSimilar(englishInput, limit = 5) {
  ensureLoaded();

  if (!englishInput || typeof englishInput !== 'string') {
    return [];
  }

  const inputTokens = tokenize(englishInput);

  // Score all sentences
  const scored = sentencePairs.map(pair => ({
    english: pair.src,
    susu: pair.trg,
    confidence: weightedSimilarity(inputTokens, pair.srcTokens),
    matchType: 'fuzzy',
    id: pair.id
  }));

  // Sort by confidence descending
  scored.sort((a, b) => b.confidence - a.confidence);

  // Return top N with confidence > 0
  return scored
    .filter(match => match.confidence > 0)
    .slice(0, limit);
}

/**
 * Search for sentences containing specific keywords
 *
 * @param {string[]} keywords - Keywords to search for
 * @param {number} [limit=10] - Maximum results
 * @returns {MatchResult[]} Sentences containing keywords
 */
function searchByKeywords(keywords, limit = 10) {
  ensureLoaded();

  if (!Array.isArray(keywords) || keywords.length === 0) {
    return [];
  }

  const searchTokens = keywords.map(k => k.toLowerCase());

  const results = [];

  for (const pair of sentencePairs) {
    // Check if any keyword is in the source tokens
    const matchedKeywords = searchTokens.filter(kw =>
      pair.srcTokens.includes(kw)
    );

    if (matchedKeywords.length > 0) {
      results.push({
        english: pair.src,
        susu: pair.trg,
        confidence: matchedKeywords.length / searchTokens.length,
        matchType: 'keyword',
        id: pair.id,
        matchedKeywords
      });
    }
  }

  // Sort by number of matched keywords
  results.sort((a, b) => b.confidence - a.confidence);

  return results.slice(0, limit);
}

/**
 * Get statistics about the loaded dataset
 *
 * @returns {Object} Dataset statistics
 */
function getStats() {
  ensureLoaded();

  let totalEnglishWords = 0;
  let totalSusuWords = 0;

  for (const pair of sentencePairs) {
    totalEnglishWords += pair.srcTokens.length;
    totalSusuWords += tokenize(pair.trg).length;
  }

  return {
    totalPairs: sentencePairs.length,
    totalEnglishWords,
    totalSusuWords,
    avgEnglishLength: sentencePairs.length > 0
      ? (totalEnglishWords / sentencePairs.length).toFixed(1)
      : 0,
    avgSusuLength: sentencePairs.length > 0
      ? (totalSusuWords / sentencePairs.length).toFixed(1)
      : 0,
    source: 'Google SMOL smolsent_en_sus.jsonl'
  };
}

/**
 * Get a random sentence pair (useful for learning/testing)
 *
 * @returns {SentencePair|null} Random sentence pair
 */
function getRandomPair() {
  ensureLoaded();

  if (sentencePairs.length === 0) {
    return null;
  }

  const idx = Math.floor(Math.random() * sentencePairs.length);
  const pair = sentencePairs[idx];

  return {
    english: pair.src,
    susu: pair.trg,
    id: pair.id
  };
}

// ============================================================================
// TEST CASES
// ============================================================================

/**
 * Run built-in test cases
 */
function runTests() {
  console.log('=== Sentence Matcher Tests ===\n');

  // Load data
  const count = loadSentences();
  console.log(`Loaded ${count} sentence pairs\n`);

  if (count === 0) {
    console.log('ERROR: No sentences loaded. Check data path.');
    return false;
  }

  // Test 1: Exact match with known sentence
  console.log('--- Test 1: Exact Match ---');
  const exact = findMatch("It allows me to work by following my vibes and molding my teaching style to the learning style of the audience.");
  console.log('Input: First sentence from dataset');
  console.log('Match:', exact ? 'Found' : 'Not found');
  if (exact) {
    console.log('Confidence:', exact.confidence);
    console.log('Type:', exact.matchType);
    console.log('Susu:', exact.susu.substring(0, 50) + '...');
  }
  console.log();

  // Test 2: Fuzzy match
  console.log('--- Test 2: Fuzzy Match ---');
  const fuzzy = findMatch("It allows me to work following my vibes");
  console.log('Input: "It allows me to work following my vibes"');
  console.log('Match:', fuzzy ? 'Found' : 'Not found');
  if (fuzzy) {
    console.log('Confidence:', fuzzy.confidence.toFixed(3));
    console.log('Type:', fuzzy.matchType);
    console.log('Best match:', fuzzy.english.substring(0, 60) + '...');
  }
  console.log();

  // Test 3: Get Susu translation with threshold
  console.log('--- Test 3: getSusuTranslation ---');
  const susu = getSusuTranslation("The bus, normally crowded, was stunningly nearly empty at this hour.");
  console.log('Input: "The bus, normally crowded, was stunningly nearly empty at this hour."');
  console.log('Translation:', susu ? susu.substring(0, 50) + '...' : 'Below threshold');
  console.log();

  // Test 4: Suggest similar sentences
  console.log('--- Test 4: suggestSimilar ---');
  const suggestions = suggestSimilar("I was grateful for the help", 3);
  console.log('Input: "I was grateful for the help"');
  console.log('Top 3 similar sentences:');
  suggestions.forEach((s, i) => {
    console.log(`  ${i + 1}. [${(s.confidence * 100).toFixed(0)}%] ${s.english.substring(0, 50)}...`);
  });
  console.log();

  // Test 5: Keyword search
  console.log('--- Test 5: searchByKeywords ---');
  const keywordResults = searchByKeywords(['food', 'grain', 'wheat'], 3);
  console.log('Keywords: food, grain, wheat');
  console.log('Results:');
  keywordResults.forEach((r, i) => {
    console.log(`  ${i + 1}. ${r.english.substring(0, 60)}...`);
  });
  console.log();

  // Test 6: Statistics
  console.log('--- Test 6: getStats ---');
  const stats = getStats();
  console.log('Dataset Statistics:');
  console.log('  Total pairs:', stats.totalPairs);
  console.log('  Avg English length:', stats.avgEnglishLength, 'words');
  console.log('  Avg Susu length:', stats.avgSusuLength, 'words');
  console.log();

  // Test 7: Random pair
  console.log('--- Test 7: getRandomPair ---');
  const random = getRandomPair();
  if (random) {
    console.log('Random sentence:');
    console.log('  EN:', random.english.substring(0, 60) + '...');
    console.log('  SU:', random.susu.substring(0, 60) + '...');
  }
  console.log();

  // Test 8: No match case
  console.log('--- Test 8: No Match (gibberish) ---');
  const noMatch = getSusuTranslation("xyz abc completely random gibberish text");
  console.log('Input: "xyz abc completely random gibberish text"');
  console.log('Translation:', noMatch ? noMatch : 'null (as expected)');
  console.log();

  console.log('=== All Tests Complete ===');
  return true;
}

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = {
  // Core functions
  loadSentences,
  findMatch,
  getSusuTranslation,
  suggestSimilar,

  // Additional utilities
  searchByKeywords,
  getStats,
  getRandomPair,

  // Low-level utilities (for advanced use)
  tokenize,
  jaccardSimilarity,
  weightedSimilarity,

  // Testing
  runTests
};

// ============================================================================
// CLI EXECUTION
// ============================================================================

if (require.main === module) {
  const args = process.argv.slice(2);

  if (args.length === 0 || args[0] === '--help' || args[0] === '-h') {
    console.log('Sentence Matcher - Google SMOL Translation Engine');
    console.log('\nUsage:');
    console.log('  node sentence_matcher.js --test              Run all tests');
    console.log('  node sentence_matcher.js --match "sentence"  Find matching sentence');
    console.log('  node sentence_matcher.js --translate "text"  Get Susu translation');
    console.log('  node sentence_matcher.js --similar "text"    Find similar sentences');
    console.log('  node sentence_matcher.js --stats             Show dataset statistics');
    console.log('  node sentence_matcher.js --random            Get random sentence pair');
    console.log('\nExamples:');
    console.log('  node sentence_matcher.js --match "The bus was empty"');
    console.log('  node sentence_matcher.js --translate "I was proud to beat my opponent"');
    process.exit(0);
  }

  // Load sentences first
  loadSentences();

  if (args[0] === '--test') {
    runTests();
    process.exit(0);
  }

  if (args[0] === '--stats') {
    const stats = getStats();
    console.log('Dataset Statistics:');
    console.log(JSON.stringify(stats, null, 2));
    process.exit(0);
  }

  if (args[0] === '--random') {
    const pair = getRandomPair();
    if (pair) {
      console.log('English:', pair.english);
      console.log('Susu:', pair.susu);
    } else {
      console.log('No sentences loaded');
    }
    process.exit(0);
  }

  if (args[0] === '--match' && args[1]) {
    const match = findMatch(args[1]);
    if (match) {
      console.log('Match found!');
      console.log('Confidence:', (match.confidence * 100).toFixed(1) + '%');
      console.log('Type:', match.matchType);
      console.log('English:', match.english);
      console.log('Susu:', match.susu);
    } else {
      console.log('No match found');
    }
    process.exit(0);
  }

  if (args[0] === '--translate' && args[1]) {
    const match = findMatch(args[1]);
    if (match) {
      if (match.confidence >= 0.7) {
        console.log('Translation (confidence:', (match.confidence * 100).toFixed(1) + '%):');
        console.log(match.susu);
      } else {
        console.log('Low confidence match:', (match.confidence * 100).toFixed(1) + '%');
        console.log('Closest match:', match.english);
        console.log('Susu:', match.susu);
      }
    } else {
      console.log('No translation found');
    }
    process.exit(0);
  }

  if (args[0] === '--similar' && args[1]) {
    const suggestions = suggestSimilar(args[1], 5);
    console.log('Similar sentences:');
    suggestions.forEach((s, i) => {
      console.log(`\n${i + 1}. [${(s.confidence * 100).toFixed(0)}%]`);
      console.log('   EN:', s.english);
      console.log('   SU:', s.susu);
    });
    process.exit(0);
  }

  console.error('Invalid arguments. Use --help for usage.');
  process.exit(1);
}
