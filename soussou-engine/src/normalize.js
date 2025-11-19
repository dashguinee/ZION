/**
 * Soussou Phonetic Normalization Engine
 *
 * Soussou has no official spelling - people write the same word differently:
 * - "Nna fafé" / "Na Fafé" / "n'a Fafé" / "na fafeh"
 *
 * This module normalizes all variants to a canonical form for matching.
 */

/**
 * Remove diacritical marks (accents) from a string
 * é → e, à → a, ô → o, etc.
 *
 * @param {string} str - Input string
 * @returns {string} String with accents removed
 */
function removeAccents(str) {
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

/**
 * Compress double consonants to single
 * nn → n, ff → f, ss → s, etc.
 *
 * @param {string} str - Input string
 * @returns {string} String with compressed consonants
 */
function compressDoubleConsonants(str) {
  // Match any consonant followed by itself (case-insensitive after lowercase)
  // Consonants in Soussou context
  const consonants = 'bcdfghjklmnpqrstvwxyz';
  let result = str;

  for (const c of consonants) {
    // Replace double consonant with single
    const pattern = new RegExp(c + c, 'g');
    result = result.replace(pattern, c);
  }

  return result;
}

/**
 * Normalize a single Soussou word to canonical form
 *
 * Normalization steps:
 * 1. Trim whitespace
 * 2. Convert to lowercase
 * 3. Remove apostrophes (n'a → na)
 * 4. Remove accents (é → e)
 * 5. Compress double consonants (nn → n)
 * 6. Remove trailing 'h' (fafeh → fafe)
 *
 * @param {string} input - Raw Soussou word
 * @returns {string} Normalized word
 */
function normalize(input) {
  if (!input || typeof input !== 'string') {
    return '';
  }

  let result = input;

  // 1. Trim whitespace
  result = result.trim();

  // 2. Convert to lowercase
  result = result.toLowerCase();

  // 3. Remove apostrophes
  result = result.replace(/[''`]/g, '');

  // 4. Remove accents
  result = removeAccents(result);

  // 5. Compress double consonants
  result = compressDoubleConsonants(result);

  // 6. Remove trailing 'h' (common in Soussou spelling variants)
  result = result.replace(/h$/, '');

  return result;
}

/**
 * Normalize a multi-word Soussou phrase
 * Each word is normalized individually, then joined with single space
 *
 * @param {string} phrase - Raw Soussou phrase
 * @returns {string} Normalized phrase
 */
function normalizePhrase(phrase) {
  if (!phrase || typeof phrase !== 'string') {
    return '';
  }

  // Split on whitespace, normalize each word, filter empty, rejoin
  return phrase
    .split(/\s+/)
    .map(word => normalize(word))
    .filter(word => word.length > 0)
    .join(' ');
}

/**
 * Check if two Soussou words/phrases are phonetically equivalent
 *
 * @param {string} a - First word/phrase
 * @param {string} b - Second word/phrase
 * @returns {boolean} True if they normalize to the same form
 */
function areEquivalent(a, b) {
  return normalizePhrase(a) === normalizePhrase(b);
}

// =============================================================================
// TEST CASES - Demonstrating variant normalization
// =============================================================================

const testCases = [
  // Single word variants → same base
  {
    variants: ['Nna', 'nna', 'Na', 'na', "N'a", "n'a"],
    expected: 'na',
    meaning: 'mother/my'
  },
  {
    variants: ['fafé', 'Fafé', 'fafe', 'fafeh', 'faffé', 'faffeh'],
    expected: 'fafe',
    meaning: 'father'
  },
  {
    variants: ['Khèré', 'khere', 'khérè', 'khereh'],
    expected: 'khere',
    meaning: 'peace/hello'
  },
  {
    variants: ['Tanna', 'tana', 'Tana', 'tannah'],
    expected: 'tana',
    meaning: 'three'
  },
  {
    variants: ['Sàkkà', 'sakka', 'saka', 'Sàkà'],
    expected: 'saka',
    meaning: 'to buy'
  },

  // Multi-word phrase variants
  {
    variants: [
      'Nna fafé',
      'Na Fafé',
      "n'a Fafé",
      'na fafeh',
      'Nna faffé',
      "N'a fafeh"
    ],
    expected: 'na fafe',
    meaning: 'my father'
  },
  {
    variants: [
      'I khèré ma',
      'i khere ma',
      'I khérè mà',
      "I' khereh ma"
    ],
    expected: 'i khere ma',
    meaning: 'peace to you'
  },
  {
    variants: [
      'Wo tanna',
      'wó tana',
      'wo tannah',
      'Wò Tanna'
    ],
    expected: 'wo tana',
    meaning: 'you three'
  }
];

/**
 * Run test cases to verify normalization
 *
 * @returns {Object} Test results with pass/fail counts
 */
function runTests() {
  let passed = 0;
  let failed = 0;
  const results = [];

  for (const test of testCases) {
    const isPhrase = test.expected.includes(' ');
    const normalizer = isPhrase ? normalizePhrase : normalize;

    for (const variant of test.variants) {
      const result = normalizer(variant);
      const success = result === test.expected;

      if (success) {
        passed++;
      } else {
        failed++;
        results.push({
          variant,
          expected: test.expected,
          got: result,
          meaning: test.meaning
        });
      }
    }
  }

  return {
    passed,
    failed,
    total: passed + failed,
    failures: results
  };
}

/**
 * Print test results to console
 */
function printTestResults() {
  console.log('Soussou Phonetic Normalization - Test Results');
  console.log('='.repeat(50));

  const results = runTests();

  console.log(`\nTotal tests: ${results.total}`);
  console.log(`Passed: ${results.passed}`);
  console.log(`Failed: ${results.failed}`);

  if (results.failed > 0) {
    console.log('\nFailures:');
    for (const failure of results.failures) {
      console.log(`  "${failure.variant}" → got "${failure.got}", expected "${failure.expected}"`);
    }
  }

  console.log('\nExample normalizations:');
  for (const test of testCases.slice(0, 3)) {
    console.log(`\n  ${test.meaning}:`);
    for (const variant of test.variants.slice(0, 3)) {
      const isPhrase = test.expected.includes(' ');
      const result = isPhrase ? normalizePhrase(variant) : normalize(variant);
      console.log(`    "${variant}" → "${result}"`);
    }
  }

  return results;
}

// Module exports
module.exports = {
  normalize,
  normalizePhrase,
  areEquivalent,
  removeAccents,
  compressDoubleConsonants,
  runTests,
  printTestResults,
  testCases
};

// Run tests if executed directly
if (require.main === module) {
  printTestResults();
}
