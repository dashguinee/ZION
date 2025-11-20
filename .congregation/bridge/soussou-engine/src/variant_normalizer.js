/**
 * Soussou Variant Normalizer
 *
 * Complete variant normalization system for Soussou language.
 * Handles any spelling variant and maps to canonical lexicon entries.
 *
 * Main functions:
 * - normalizeInput(text) - Normalize user input
 * - findMatches(text) - Find all possible lexicon matches
 * - getVariants(base) - Get all variants of a word
 * - fuzzyMatch(text, threshold) - Fuzzy matching for uncertain inputs
 */

const fs = require('fs');
const path = require('path');

// Load mappings
let mappings = null;
let lexicon = null;

/**
 * Load variant mappings from JSON file
 */
function loadMappings() {
  if (mappings) return mappings;

  const mappingsPath = path.join(__dirname, '..', 'data', 'variant_mappings.json');
  mappings = JSON.parse(fs.readFileSync(mappingsPath, 'utf8'));
  return mappings;
}

/**
 * Load lexicon from JSON file
 */
function loadLexicon() {
  if (lexicon) return lexicon;

  const lexiconPath = path.join(__dirname, '..', 'data', 'lexicon.json');
  lexicon = JSON.parse(fs.readFileSync(lexiconPath, 'utf8'));
  return lexicon;
}

// =============================================================================
// CORE NORMALIZATION FUNCTIONS
// =============================================================================

/**
 * Normalize a single Soussou word to canonical form
 *
 * @param {string} input - Raw Soussou word
 * @returns {string} Normalized word
 */
function normalize(input) {
  if (!input || typeof input !== 'string') {
    return '';
  }

  let result = input
    // 1. Trim whitespace
    .trim()
    // 2. Convert to lowercase
    .toLowerCase()
    // 3. Remove apostrophes
    .replace(/['''`]/g, '')
    // 4. Remove diacritics
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    // 5. Convert IPA characters
    .replace(/ɛ/g, 'e')
    .replace(/ɔ/g, 'o')
    .replace(/ŋ/g, 'ng')
    .replace(/ɲ/g, 'ny')
    .replace(/ŭ/g, 'u')
    // 6. Remove trailing hyphen
    .replace(/-$/g, '')
    // 7. Remove trailing h
    .replace(/h$/g, '');

  // 8. Compress double consonants
  const consonants = 'bcdfghjklmnpqrstvwxyz';
  for (const c of consonants) {
    result = result.replace(new RegExp(c + c, 'g'), c);
  }

  return result;
}

/**
 * Normalize a multi-word Soussou phrase
 *
 * @param {string} phrase - Raw Soussou phrase
 * @returns {string} Normalized phrase
 */
function normalizePhrase(phrase) {
  if (!phrase || typeof phrase !== 'string') {
    return '';
  }

  return phrase
    .split(/\s+/)
    .map(word => normalize(word))
    .filter(word => word.length > 0)
    .join(' ');
}

/**
 * Normalize user input (alias for normalizePhrase)
 * Main entry point for normalizing any user input.
 *
 * @param {string} text - User input text
 * @returns {string} Normalized text
 */
function normalizeInput(text) {
  return normalizePhrase(text);
}

// =============================================================================
// MATCHING FUNCTIONS
// =============================================================================

/**
 * Find lexicon entry by normalized form
 *
 * @param {string} normalized - Normalized word
 * @returns {Object|null} Lexicon entry or null
 */
function findByNormalized(normalized) {
  const data = loadMappings();
  const base = data.normalized_to_base[normalized];

  if (!base) return null;

  const lex = loadLexicon();
  return lex.find(entry => entry.base === base) || null;
}

/**
 * Find all possible lexicon matches for input text
 * Returns matches for each word in the input.
 *
 * @param {string} text - Input text (word or phrase)
 * @returns {Array} Array of match results
 */
function findMatches(text) {
  if (!text || typeof text !== 'string') {
    return [];
  }

  const data = loadMappings();
  const lex = loadLexicon();
  const words = text.trim().split(/\s+/);
  const results = [];

  for (const word of words) {
    const normalized = normalize(word);
    const lowerWord = word.toLowerCase();

    const match = {
      original: word,
      normalized: normalized,
      found: false,
      base: null,
      entry: null,
      matchType: null
    };

    // Try exact variant match first
    if (data.variant_to_base[lowerWord]) {
      match.found = true;
      match.base = data.variant_to_base[lowerWord];
      match.matchType = 'exact';
      match.entry = lex.find(e => e.base === match.base);
    }
    // Try normalized match
    else if (data.normalized_to_base[normalized]) {
      match.found = true;
      match.base = data.normalized_to_base[normalized];
      match.matchType = 'normalized';
      match.entry = lex.find(e => e.base === match.base);
    }
    // No match found
    else {
      match.matchType = 'none';
    }

    results.push(match);
  }

  return results;
}

/**
 * Get all known variants of a base word
 *
 * @param {string} base - Base word from lexicon
 * @returns {Array} Array of variant strings
 */
function getVariants(base) {
  const data = loadMappings();

  // Get variants from base_to_variants
  const variants = data.base_to_variants[base] || [];

  // Also add synthetic variants if available
  const synthetic = data.synthetic_variants[base] || [];

  // Combine and deduplicate
  const allVariants = [...new Set([...variants, ...synthetic])];

  return allVariants;
}

/**
 * Get all possible base forms for a given input
 *
 * @param {string} input - Input word
 * @returns {Array} Array of possible base forms
 */
function getPossibleBases(input) {
  const normalized = normalize(input);
  const data = loadMappings();
  const bases = [];

  // Check exact variant
  const lowerInput = input.toLowerCase();
  if (data.variant_to_base[lowerInput]) {
    bases.push(data.variant_to_base[lowerInput]);
  }

  // Check normalized form
  if (data.normalized_to_base[normalized]) {
    const base = data.normalized_to_base[normalized];
    if (!bases.includes(base)) {
      bases.push(base);
    }
  }

  return bases;
}

// =============================================================================
// FUZZY MATCHING FUNCTIONS
// =============================================================================

/**
 * Calculate Levenshtein edit distance between two strings
 *
 * @param {string} a - First string
 * @param {string} b - Second string
 * @returns {number} Edit distance
 */
function levenshteinDistance(a, b) {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  const matrix = [];

  // Initialize matrix
  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  // Fill matrix
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

/**
 * Calculate weighted edit distance with Soussou-specific costs
 * Lower cost for common variations (vowels, double consonants)
 *
 * @param {string} a - First string (normalized)
 * @param {string} b - Second string (normalized)
 * @returns {number} Weighted edit distance
 */
function weightedDistance(a, b) {
  if (a === b) return 0;

  const vowels = 'aeiou';
  const consonants = 'bcdfghjklmnpqrstvwxyz';

  // Basic Levenshtein with weighted costs
  const m = a.length;
  const n = b.length;
  const dp = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const charA = a[i - 1];
      const charB = b[j - 1];

      if (charA === charB) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        // Calculate substitution cost
        let subCost = 1;

        // Lower cost for vowel-vowel substitution
        if (vowels.includes(charA) && vowels.includes(charB)) {
          subCost = 0.3;
        }
        // Lower cost for similar consonants
        else if (
          (charA === 'k' && charB === 'c') ||
          (charA === 'c' && charB === 'k') ||
          (charA === 'f' && charB === 'p') ||
          (charA === 'p' && charB === 'f')
        ) {
          subCost = 0.5;
        }

        dp[i][j] = Math.min(
          dp[i - 1][j - 1] + subCost,  // substitution
          dp[i][j - 1] + 0.8,           // insertion (slightly cheaper)
          dp[i - 1][j] + 0.8            // deletion (slightly cheaper)
        );
      }
    }
  }

  return dp[m][n];
}

/**
 * Calculate similarity score between two strings (0-1)
 *
 * @param {string} a - First string
 * @param {string} b - Second string
 * @returns {number} Similarity score (0-1)
 */
function similarityScore(a, b) {
  if (!a || !b) return 0;
  if (a === b) return 1;

  const normA = normalize(a);
  const normB = normalize(b);

  if (normA === normB) return 0.95;

  const maxLen = Math.max(normA.length, normB.length);
  if (maxLen === 0) return 1;

  const distance = weightedDistance(normA, normB);
  return Math.max(0, 1 - (distance / maxLen));
}

/**
 * Fuzzy match input against lexicon
 * Returns matches above the similarity threshold.
 *
 * @param {string} text - Input text to match
 * @param {number} threshold - Minimum similarity score (0-1), default 0.6
 * @returns {Array} Array of fuzzy matches sorted by score
 */
function fuzzyMatch(text, threshold = 0.6) {
  if (!text || typeof text !== 'string') {
    return [];
  }

  const normalized = normalize(text);
  const data = loadMappings();
  const matches = [];

  // Check all normalized forms
  for (const [normalizedBase, base] of Object.entries(data.normalized_to_base)) {
    const score = similarityScore(normalized, normalizedBase);

    if (score >= threshold) {
      matches.push({
        input: text,
        normalizedInput: normalized,
        base: base,
        normalizedBase: normalizedBase,
        score: score,
        matchType: score === 1 ? 'exact' : score >= 0.95 ? 'normalized' : 'fuzzy'
      });
    }
  }

  // Sort by score descending
  matches.sort((a, b) => b.score - a.score);

  // Deduplicate by base (keep highest score)
  const seen = new Set();
  const deduplicated = [];
  for (const match of matches) {
    if (!seen.has(match.base)) {
      seen.add(match.base);
      deduplicated.push(match);
    }
  }

  return deduplicated;
}

/**
 * Find closest matches for unknown input
 *
 * @param {string} text - Input text
 * @param {number} limit - Maximum number of results
 * @returns {Array} Top fuzzy matches
 */
function suggestMatches(text, limit = 5) {
  const matches = fuzzyMatch(text, 0.4);
  return matches.slice(0, limit);
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Check if two inputs are equivalent after normalization
 *
 * @param {string} a - First input
 * @param {string} b - Second input
 * @returns {boolean} True if equivalent
 */
function areEquivalent(a, b) {
  return normalizePhrase(a) === normalizePhrase(b);
}

/**
 * Get lexicon entry for a word (any variant)
 *
 * @param {string} word - Word to look up
 * @returns {Object|null} Lexicon entry or null
 */
function lookupWord(word) {
  const matches = findMatches(word);
  if (matches.length > 0 && matches[0].entry) {
    return matches[0].entry;
  }
  return null;
}

/**
 * Get complete word information including all variants
 *
 * @param {string} word - Word to look up
 * @returns {Object|null} Complete word info or null
 */
function getWordInfo(word) {
  const matches = findMatches(word);

  if (matches.length === 0 || !matches[0].found) {
    return null;
  }

  const match = matches[0];
  const variants = getVariants(match.base);

  return {
    input: word,
    normalized: match.normalized,
    base: match.base,
    variants: variants,
    entry: match.entry,
    english: match.entry?.english || '',
    french: match.entry?.french || '',
    category: match.entry?.category || 'unknown'
  };
}

/**
 * Tokenize and normalize a text into words
 *
 * @param {string} text - Input text
 * @returns {Array} Array of {original, normalized} objects
 */
function tokenize(text) {
  if (!text || typeof text !== 'string') {
    return [];
  }

  return text
    .trim()
    .split(/\s+/)
    .filter(w => w.length > 0)
    .map(word => ({
      original: word,
      normalized: normalize(word)
    }));
}

/**
 * Get statistics about the normalization system
 *
 * @returns {Object} System statistics
 */
function getStats() {
  const data = loadMappings();
  return {
    totalBases: Object.keys(data.base_to_variants).length,
    totalVariantMappings: Object.keys(data.variant_to_base).length,
    totalNormalizedMappings: Object.keys(data.normalized_to_base).length,
    generatedAt: data.metadata?.generated || 'unknown'
  };
}

// =============================================================================
// MODULE EXPORTS
// =============================================================================

module.exports = {
  // Core normalization
  normalize,
  normalizePhrase,
  normalizeInput,

  // Matching
  findMatches,
  getVariants,
  getPossibleBases,
  lookupWord,
  getWordInfo,

  // Fuzzy matching
  fuzzyMatch,
  suggestMatches,
  similarityScore,
  levenshteinDistance,
  weightedDistance,

  // Utilities
  areEquivalent,
  tokenize,
  getStats,

  // Data loading
  loadMappings,
  loadLexicon
};

// =============================================================================
// CLI TEST INTERFACE
// =============================================================================

if (require.main === module) {
  console.log('Soussou Variant Normalizer - Test Interface');
  console.log('='.repeat(50));

  // Test cases
  const testInputs = [
    "N'na fafé",
    "fafeh",
    "M'ma",
    "Khèré",
    "kɛmɛ",
    "whon'",
    "Tanna",
    "i khere ma"
  ];

  console.log('\n--- Normalization Tests ---\n');

  for (const input of testInputs) {
    const normalized = normalizeInput(input);
    const matches = findMatches(input);

    console.log(`Input: "${input}"`);
    console.log(`  Normalized: "${normalized}"`);

    if (matches.length > 0 && matches[0].found) {
      const m = matches[0];
      console.log(`  Base: "${m.base}" (${m.matchType})`);
      if (m.entry) {
        console.log(`  English: ${m.entry.english || '(none)'}`);
      }
    } else {
      console.log(`  No match found`);
      const suggestions = suggestMatches(input, 3);
      if (suggestions.length > 0) {
        console.log(`  Suggestions: ${suggestions.map(s => s.base).join(', ')}`);
      }
    }
    console.log();
  }

  console.log('--- Fuzzy Match Test ---\n');
  const fuzzyInput = 'kemer';
  const fuzzyResults = fuzzyMatch(fuzzyInput, 0.5);
  console.log(`Fuzzy match for "${fuzzyInput}":`);
  fuzzyResults.slice(0, 5).forEach(r => {
    console.log(`  ${r.base} (score: ${r.score.toFixed(2)})`);
  });

  console.log('\n--- System Stats ---\n');
  const stats = getStats();
  console.log(`Total bases: ${stats.totalBases}`);
  console.log(`Total variant mappings: ${stats.totalVariantMappings}`);
  console.log(`Total normalized mappings: ${stats.totalNormalizedMappings}`);
  console.log(`Generated: ${stats.generatedAt}`);
}
