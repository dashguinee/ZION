/**
 * Soussou Orthography Converter
 *
 * Converts between Google SMOL spelling conventions and our engine's normalized form.
 *
 * Google SMOL uses:
 * - "E" or "e" for open-mid front vowel (IPA: ɛ)
 * - "O" or "o" for open-mid back vowel (IPA: ɔ)
 * - "gn" for palatal nasal (IPA: ɲ) - French influence
 * - Apostrophes: N'tan, M'ma
 * - Diacritics: è, é, ê, à, ô
 *
 * Our engine uses:
 * - "e" normalized (no distinction)
 * - "o" normalized (no distinction)
 * - "ny" for palatal nasal
 * - No apostrophes: Ntan, Mma
 * - No diacritics: normalized base letters
 *
 * ESSENTIAL for merging Google SMOL data with our lexicon.
 */

// =============================================================================
// MAPPING DEFINITIONS
// =============================================================================

/**
 * Google SMOL to Our Form mappings
 * Order matters - process longer patterns first
 */
const GOOGLE_TO_OURS = {
  // Palatal nasal: gn -> ny (French-style to our style)
  patterns: [
    { from: /gn/gi, to: 'ny' },
  ],

  // Vowel mappings (IPA characters if present)
  vowels: {
    'ɛ': 'e',
    'ɔ': 'o',
    'ŋ': 'ng',
    'ɲ': 'ny',
  },

  // Diacritics - handled via NFD normalization
  diacritics: {
    'è': 'e',
    'é': 'e',
    'ê': 'e',
    'ë': 'e',
    'à': 'a',
    'á': 'a',
    'â': 'a',
    'ô': 'o',
    'ó': 'o',
    'ò': 'o',
    'î': 'i',
    'í': 'i',
    'ì': 'i',
    'û': 'u',
    'ú': 'u',
    'ù': 'u',
  },

  // Apostrophe variants to remove
  apostrophes: ["'", "'", "'", "`"],
};

/**
 * Our Form to Google SMOL mappings
 * Used when we need to output in Google-style format
 */
const OURS_TO_GOOGLE = {
  // Palatal nasal: ny -> gn
  patterns: [
    { from: /ny/gi, to: 'gn' },
  ],

  // Prefix patterns that typically get apostrophes in Google style
  // N' and M' before vowels
  prefixPatterns: [
    { from: /^n([aeiou])/i, to: "N'$1" },
    { from: /^m([aeiou])/i, to: "M'$1" },
    { from: /\bn([aeiou])/gi, to: "n'$1" },
    { from: /\bm([aeiou])/gi, to: "m'$1" },
  ],
};

// =============================================================================
// CORE CONVERSION FUNCTIONS
// =============================================================================

/**
 * Convert Google SMOL spelling to our normalized form
 *
 * @param {string} text - Text in Google SMOL spelling
 * @returns {string} Text in our normalized form
 *
 * @example
 * googleToOurs("N'tan") // => "ntan"
 * googleToOurs("M'ma") // => "mma" (then further normalized to "ma" by main normalizer)
 * googleToOurs("signè") // => "sinye"
 * googleToOurs("Bôgné") // => "bonye"
 */
function googleToOurs(text) {
  if (!text || typeof text !== 'string') {
    return '';
  }

  let result = text;

  // Step 1: Lowercase everything
  result = result.toLowerCase();

  // Step 2: Remove apostrophes
  for (const apos of GOOGLE_TO_OURS.apostrophes) {
    result = result.split(apos).join('');
  }

  // Step 3: Convert gn -> ny (before diacritic removal to preserve position)
  for (const pattern of GOOGLE_TO_OURS.patterns) {
    result = result.replace(pattern.from, pattern.to);
  }

  // Step 4: Remove diacritics using NFD normalization
  result = result.normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  // Step 5: Convert any remaining IPA/special vowels
  for (const [from, to] of Object.entries(GOOGLE_TO_OURS.vowels)) {
    result = result.split(from).join(to);
  }

  // Step 6: Trim and clean up whitespace
  result = result.trim().replace(/\s+/g, ' ');

  return result;
}

/**
 * Convert our normalized form to Google SMOL style
 *
 * @param {string} text - Text in our normalized form
 * @returns {string} Text in Google SMOL style
 *
 * @example
 * oursToGoogle("ntan") // => "N'tan"
 * oursToGoogle("mma") // => "M'ma"
 * oursToGoogle("sinye") // => "signè" (approximation)
 */
function oursToGoogle(text) {
  if (!text || typeof text !== 'string') {
    return '';
  }

  let result = text;

  // Step 1: Convert ny -> gn
  for (const pattern of OURS_TO_GOOGLE.patterns) {
    result = result.replace(pattern.from, pattern.to);
  }

  // Step 2: Add apostrophes after initial N/M in words
  // Google SMOL uses N'tan, M'ma style - apostrophe after N or M at word start
  // Process word by word to handle properly
  const words = result.split(/\s+/);
  const processedWords = words.map((word, index) => {
    let processed = word;

    // Add apostrophe after initial N or M if followed by another letter
    // Examples: ntan -> N'tan, mma -> M'ma, na -> N'a
    if (/^[nm].+/i.test(processed)) {
      const first = processed[0].toUpperCase();
      const rest = processed.slice(1);
      processed = first + "'" + rest;
    }

    return processed;
  });

  result = processedWords.join(' ');

  return result;
}

/**
 * Normalize text from either Google SMOL or our format to our canonical form
 * Accepts any spelling variant and outputs consistent normalized form
 *
 * @param {string} text - Text in any spelling variant
 * @returns {string} Normalized text in our canonical form
 *
 * @example
 * normalizeEither("N'tan") // => "ntan"
 * normalizeEither("ntan") // => "ntan"
 * normalizeEither("Bôgné") // => "bonye"
 * normalizeEither("bonye") // => "bonye"
 */
function normalizeEither(text) {
  if (!text || typeof text !== 'string') {
    return '';
  }

  // Apply Google-to-ours conversion first (handles all cases)
  // This works because:
  // - If already in our format: gn->ny won't match (no gn), apostrophes won't be there, etc.
  // - If in Google format: all conversions apply
  // - Mixed format: still works

  let result = googleToOurs(text);

  // Additional normalization for edge cases
  // Compress double consonants (common in both formats)
  const consonants = 'bcdfghjklmnpqrstvwxyz';
  for (const c of consonants) {
    const pattern = new RegExp(c + c, 'g');
    result = result.replace(pattern, c);
  }

  // Remove trailing h (common variant spelling)
  result = result.replace(/h$/, '');

  return result;
}

/**
 * Detect which orthography style a text is likely using
 *
 * @param {string} text - Text to analyze
 * @returns {string} 'google' | 'ours' | 'mixed' | 'unknown'
 */
function detectOrthography(text) {
  if (!text || typeof text !== 'string') {
    return 'unknown';
  }

  const hasApostrophe = /['''`]/.test(text);
  const hasGn = /gn/i.test(text);
  const hasNy = /ny/i.test(text);
  const hasDiacritics = /[èéêàâôîùú]/i.test(text);
  const hasIPA = /[ɛɔŋɲ]/.test(text);

  // Strong Google indicators
  // Check for N' or M' pattern (with any apostrophe variant) - vowel not required
  // Google uses apostrophes like N'tan, M'ma, etc.
  const hasNMApostrophePattern = /[NM]['''`]/i.test(text);
  if ((hasApostrophe && hasNMApostrophePattern) || hasGn || hasDiacritics) {
    if (hasNy) {
      return 'mixed';
    }
    return 'google';
  }

  // Strong "ours" indicators
  if (hasNy || hasIPA) {
    if (hasGn || hasApostrophe) {
      return 'mixed';
    }
    return 'ours';
  }

  // No strong indicators either way
  return 'unknown';
}

/**
 * Check if two texts are equivalent after orthography normalization
 *
 * @param {string} a - First text
 * @param {string} b - Second text
 * @returns {boolean} True if texts normalize to same form
 */
function areOrthographicallyEquivalent(a, b) {
  return normalizeEither(a) === normalizeEither(b);
}

// =============================================================================
// BATCH PROCESSING
// =============================================================================

/**
 * Convert an array of texts from Google to our format
 *
 * @param {string[]} texts - Array of texts in Google format
 * @returns {string[]} Array of texts in our format
 */
function batchGoogleToOurs(texts) {
  if (!Array.isArray(texts)) {
    return [];
  }
  return texts.map(googleToOurs);
}

/**
 * Convert an object's string values from Google to our format
 * Useful for processing lexicon entries
 *
 * @param {Object} obj - Object with string values
 * @param {string[]} keys - Keys to convert (default: all string keys)
 * @returns {Object} Object with converted values
 */
function convertObjectValues(obj, keys = null) {
  if (!obj || typeof obj !== 'object') {
    return obj;
  }

  const result = { ...obj };
  const keysToProcess = keys || Object.keys(result);

  for (const key of keysToProcess) {
    if (typeof result[key] === 'string') {
      result[key] = normalizeEither(result[key]);
    }
  }

  return result;
}

// =============================================================================
// TEST CASES
// =============================================================================

const testCases = {
  googleToOurs: [
    // Apostrophe handling
    { input: "N'tan", expected: "ntan", description: "Apostrophe removal - N'" },
    { input: "M'ma", expected: "mma", description: "Apostrophe removal - M'" },
    { input: "N'na", expected: "nna", description: "Apostrophe with double n" },
    { input: "i'", expected: "i", description: "Trailing apostrophe" },

    // Diacritic handling
    { input: "fafè", expected: "fafe", description: "Grave accent" },
    { input: "fafé", expected: "fafe", description: "Acute accent" },
    { input: "fafê", expected: "fafe", description: "Circumflex" },
    { input: "Bôgô", expected: "bogo", description: "Multiple circumflex" },
    { input: "khèré", expected: "khere", description: "Mixed accents" },

    // gn -> ny conversion
    { input: "signè", expected: "sinye", description: "gn to ny in middle" },
    { input: "Bôgné", expected: "bonye", description: "gn with diacritics" },
    { input: "gnome", expected: "nyome", description: "gn at start" },
    { input: "magnifique", expected: "manyifique", description: "gn in loanword" },

    // Combined cases
    { input: "N'gné", expected: "nnye", description: "Apostrophe + gn + diacritic" },
    { input: "M'bôgné", expected: "mbonye", description: "Complex combined" },
    { input: "Khèré N'tan", expected: "khere ntan", description: "Phrase with mixed" },
  ],

  oursToGoogle: [
    // ny -> gn conversion
    { input: "sinye", expected: "signe", description: "ny to gn" },
    { input: "bonye", expected: "bogne", description: "ny at end" },

    // Apostrophe insertion
    { input: "ntan", expected: "N'tan", description: "N + consonant" },
    { input: "mma", expected: "M'ma", description: "M + m" },
    { input: "na", expected: "N'a", description: "N + vowel" },
    { input: "na fafe", expected: "N'a fafe", description: "Phrase with n+vowel" },
  ],

  normalizeEither: [
    // Google format input
    { input: "N'tan", expected: "ntan", description: "Google apostrophe" },
    { input: "signè", expected: "sinye", description: "Google gn + accent" },

    // Our format input (should pass through)
    { input: "ntan", expected: "ntan", description: "Already normalized" },
    { input: "sinye", expected: "sinye", description: "Already using ny" },

    // Mixed/ambiguous
    { input: "khere", expected: "khere", description: "No markers either way" },
    { input: "Fafé", expected: "fafe", description: "Just accent, no other markers" },

    // Double consonant compression
    { input: "N'nna", expected: "nna", description: "Triple n after apostrophe removal (nnna -> nna)" },
    { input: "mma", expected: "ma", description: "Double m" },

    // Trailing h removal
    { input: "fafeh", expected: "fafe", description: "Trailing h" },
    { input: "khereh", expected: "khere", description: "Trailing h after normalization" },
  ],

  detectOrthography: [
    { input: "N'tan", expected: "google", description: "Apostrophe pattern" },
    { input: "signè", expected: "google", description: "gn + diacritic" },
    { input: "sinye", expected: "ours", description: "ny pattern" },
    { input: "keme", expected: "unknown", description: "No markers" },
    { input: "N'nyè", expected: "mixed", description: "Apostrophe + ny" },
  ],
};

/**
 * Run all test cases
 * @returns {Object} Test results
 */
function runTests() {
  const results = {
    passed: 0,
    failed: 0,
    failures: [],
  };

  // Test googleToOurs
  for (const test of testCases.googleToOurs) {
    const result = googleToOurs(test.input);
    if (result === test.expected) {
      results.passed++;
    } else {
      results.failed++;
      results.failures.push({
        function: 'googleToOurs',
        input: test.input,
        expected: test.expected,
        got: result,
        description: test.description,
      });
    }
  }

  // Test oursToGoogle
  for (const test of testCases.oursToGoogle) {
    const result = oursToGoogle(test.input);
    if (result === test.expected) {
      results.passed++;
    } else {
      results.failed++;
      results.failures.push({
        function: 'oursToGoogle',
        input: test.input,
        expected: test.expected,
        got: result,
        description: test.description,
      });
    }
  }

  // Test normalizeEither
  for (const test of testCases.normalizeEither) {
    const result = normalizeEither(test.input);
    if (result === test.expected) {
      results.passed++;
    } else {
      results.failed++;
      results.failures.push({
        function: 'normalizeEither',
        input: test.input,
        expected: test.expected,
        got: result,
        description: test.description,
      });
    }
  }

  // Test detectOrthography
  for (const test of testCases.detectOrthography) {
    const result = detectOrthography(test.input);
    if (result === test.expected) {
      results.passed++;
    } else {
      results.failed++;
      results.failures.push({
        function: 'detectOrthography',
        input: test.input,
        expected: test.expected,
        got: result,
        description: test.description,
      });
    }
  }

  results.total = results.passed + results.failed;
  return results;
}

/**
 * Print test results to console
 */
function printTestResults() {
  console.log('Soussou Orthography Converter - Test Results');
  console.log('='.repeat(55));

  const results = runTests();

  console.log(`\nTotal tests: ${results.total}`);
  console.log(`Passed: ${results.passed}`);
  console.log(`Failed: ${results.failed}`);

  if (results.failed > 0) {
    console.log('\nFailures:');
    for (const f of results.failures) {
      console.log(`  [${f.function}] "${f.input}" -> got "${f.got}", expected "${f.expected}"`);
      console.log(`    ${f.description}`);
    }
  }

  console.log('\n--- Example Conversions ---');
  console.log('\nGoogle SMOL -> Ours:');
  const googleExamples = ["N'tan", "M'ma", "signè", "Bôgné", "khèré"];
  for (const ex of googleExamples) {
    console.log(`  "${ex}" -> "${googleToOurs(ex)}"`);
  }

  console.log('\nOurs -> Google SMOL:');
  const oursExamples = ["ntan", "mma", "sinye", "bonye", "khere"];
  for (const ex of oursExamples) {
    console.log(`  "${ex}" -> "${oursToGoogle(ex)}"`);
  }

  console.log('\nNormalize Either (accepts both):');
  const mixedExamples = ["N'tan", "ntan", "signè", "sinye", "Bôgné", "bonye"];
  for (const ex of mixedExamples) {
    const detected = detectOrthography(ex);
    console.log(`  "${ex}" [${detected}] -> "${normalizeEither(ex)}"`);
  }

  return results;
}

// =============================================================================
// MODULE EXPORTS
// =============================================================================

module.exports = {
  // Core conversion functions
  googleToOurs,
  oursToGoogle,
  normalizeEither,

  // Detection and comparison
  detectOrthography,
  areOrthographicallyEquivalent,

  // Batch processing
  batchGoogleToOurs,
  convertObjectValues,

  // Testing
  runTests,
  printTestResults,
  testCases,

  // Mapping definitions (for reference)
  GOOGLE_TO_OURS,
  OURS_TO_GOOGLE,
};

// Run tests if executed directly
if (require.main === module) {
  printTestResults();
}
