/**
 * Soussou Phonetic Mapper
 *
 * A comprehensive bidirectional phonetic mapping system for the Soussou Engine.
 * Handles IPA characters, diacritics, French-influenced spellings, and apostrophe patterns.
 *
 * Purpose:
 * - Normalize phonetic variations to canonical forms
 * - Group words by phonetic root (same pronunciation, different spelling)
 * - Enable fuzzy matching across spelling variants
 *
 * @module phonetic_mapper
 * @author ZION SYNAPSE
 * @version 1.0.0
 */

const fs = require('fs');
const path = require('path');

// =============================================================================
// PHONETIC MAPPING DEFINITIONS
// =============================================================================

/**
 * Comprehensive IPA to Latin mappings
 * These are characters used in linguistic transcriptions that need normalization
 */
const IPA_TO_LATIN = {
  // Vowels
  'ɛ': 'e',      // open-mid front unrounded vowel
  'ɔ': 'o',      // open-mid back rounded vowel
  'ə': 'e',      // schwa (mid central vowel)
  'ɪ': 'i',      // near-close near-front unrounded vowel
  'ʊ': 'u',      // near-close near-back rounded vowel
  'æ': 'a',      // near-open front unrounded vowel
  'ʌ': 'a',      // open-mid back unrounded vowel

  // Consonants
  'ŋ': 'ng',     // velar nasal
  'ɲ': 'ny',     // palatal nasal
  'ʃ': 'sh',     // voiceless postalveolar fricative
  'ʒ': 'j',      // voiced postalveolar fricative
  'ɟ': 'j',      // voiced palatal plosive
  'ɓ': 'b',      // voiced bilabial implosive
  'ɗ': 'd',      // voiced alveolar implosive
  'ʔ': '',       // glottal stop (often dropped)
  'ɣ': 'gh',     // voiced velar fricative
  'χ': 'kh',     // voiceless uvular fricative
  'ʁ': 'r',      // voiced uvular fricative (French r)

  // Length markers
  'ː': '',       // long vowel marker (handled separately)
  'ˑ': '',       // half-long marker
};

/**
 * Diacritic vowel mappings
 * All accented vowels normalize to their base forms
 */
const DIACRITIC_TO_BASE = {
  // E variants
  'è': 'e', 'é': 'e', 'ê': 'e', 'ë': 'e', 'ē': 'e', 'ĕ': 'e', 'ė': 'e', 'ę': 'e', 'ě': 'e',
  'È': 'e', 'É': 'e', 'Ê': 'e', 'Ë': 'e', 'Ē': 'e',

  // A variants
  'à': 'a', 'á': 'a', 'â': 'a', 'ä': 'a', 'ã': 'a', 'ā': 'a', 'ă': 'a', 'ą': 'a', 'å': 'a',
  'À': 'a', 'Á': 'a', 'Â': 'a', 'Ä': 'a', 'Ã': 'a', 'Ā': 'a',

  // O variants
  'ò': 'o', 'ó': 'o', 'ô': 'o', 'ö': 'o', 'õ': 'o', 'ō': 'o', 'ő': 'o', 'ø': 'o',
  'Ò': 'o', 'Ó': 'o', 'Ô': 'o', 'Ö': 'o', 'Õ': 'o', 'Ō': 'o',

  // I variants
  'ì': 'i', 'í': 'i', 'î': 'i', 'ï': 'i', 'ī': 'i', 'ĭ': 'i', 'į': 'i',
  'Ì': 'i', 'Í': 'i', 'Î': 'i', 'Ï': 'i', 'Ī': 'i',

  // U variants
  'ù': 'u', 'ú': 'u', 'û': 'u', 'ü': 'u', 'ũ': 'u', 'ū': 'u', 'ŭ': 'u', 'ű': 'u',
  'Ù': 'u', 'Ú': 'u', 'Û': 'u', 'Ü': 'u', 'Ũ': 'u', 'Ū': 'u',

  // Special
  'ñ': 'ny',    // Spanish tilde n -> palatal nasal
  'Ñ': 'ny',
  'ç': 's',     // French cedilla
  'Ç': 's',
};

/**
 * French-influenced spelling patterns
 * Order matters - process longer patterns first
 */
const FRENCH_PATTERNS = [
  // Consonant clusters
  { from: /gn/gi, to: 'ny' },         // French palatal nasal
  { from: /gu([eiy])/gi, to: 'g$1' }, // French hard g before e/i/y
  { from: /qu/gi, to: 'k' },          // French qu -> k
  { from: /ch/gi, to: 'sh' },         // French ch (when present)
  { from: /ph/gi, to: 'f' },          // French ph
  { from: /th/gi, to: 't' },          // th -> t (loanwords)

  // Vowel combinations
  { from: /ou/gi, to: 'u' },          // French ou -> u
  { from: /eau/gi, to: 'o' },         // French eau -> o
  { from: /au/gi, to: 'o' },          // French au -> o
  { from: /ai/gi, to: 'e' },          // French ai -> e (sometimes)
  { from: /ei/gi, to: 'e' },          // French ei -> e

  // Nasals (preserve for now, common in Susu)
  // { from: /an/gi, to: 'an' },
  // { from: /en/gi, to: 'en' },
  // { from: /in/gi, to: 'in' },
  // { from: /on/gi, to: 'on' },
  // { from: /un/gi, to: 'un' },
];

/**
 * Apostrophe patterns - all variants to normalize
 */
const APOSTROPHE_VARIANTS = ["'", "'", "'", "`", "ʼ", "ˈ", "ˌ", "ʻ", "ʾ", "ʿ", "'"];

/**
 * Consonant clusters to simplify
 */
const CONSONANT_SIMPLIFICATIONS = [
  // Double consonants -> single
  { from: /bb/g, to: 'b' },
  { from: /cc/g, to: 'c' },
  { from: /dd/g, to: 'd' },
  { from: /ff/g, to: 'f' },
  { from: /gg/g, to: 'g' },
  { from: /jj/g, to: 'j' },
  { from: /kk/g, to: 'k' },
  { from: /ll/g, to: 'l' },
  { from: /mm/g, to: 'm' },
  { from: /nn/g, to: 'n' },
  { from: /pp/g, to: 'p' },
  { from: /rr/g, to: 'r' },
  { from: /ss/g, to: 's' },
  { from: /tt/g, to: 't' },
  { from: /vv/g, to: 'v' },
  { from: /ww/g, to: 'w' },
  { from: /xx/g, to: 'x' },
  { from: /yy/g, to: 'y' },
  { from: /zz/g, to: 'z' },
];

// =============================================================================
// CORE PHONETIC FUNCTIONS
// =============================================================================

/**
 * Normalize text to its phonetic root form
 * This is the main normalization function - use this for matching
 *
 * @param {string} text - Input text in any spelling variant
 * @returns {string} Normalized phonetic root
 *
 * @example
 * normalizePhonetic("N'tan") // => "ntan"
 * normalizePhonetic("Bôgné") // => "bonye"
 * normalizePhonetic("ɛ́tɛ́") // => "ete"
 */
function normalizePhonetic(text) {
  if (!text || typeof text !== 'string') {
    return '';
  }

  let result = text;

  // Step 1: Lowercase everything
  result = result.toLowerCase();

  // Step 2: Remove all apostrophe variants
  for (const apos of APOSTROPHE_VARIANTS) {
    result = result.split(apos).join('');
  }

  // Step 3: Apply French pattern conversions (longer patterns first)
  for (const pattern of FRENCH_PATTERNS) {
    result = result.replace(pattern.from, pattern.to);
  }

  // Step 4: Convert IPA characters
  for (const [ipa, latin] of Object.entries(IPA_TO_LATIN)) {
    result = result.split(ipa).join(latin);
  }

  // Step 5: Convert diacritics to base letters
  // First use NFD normalization to separate combining marks
  result = result.normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  // Then handle any remaining composed characters
  for (const [diacritic, base] of Object.entries(DIACRITIC_TO_BASE)) {
    result = result.split(diacritic).join(base);
  }

  // Step 6: Simplify double consonants
  for (const pattern of CONSONANT_SIMPLIFICATIONS) {
    result = result.replace(pattern.from, pattern.to);
  }

  // Step 7: Clean up
  result = result
    .replace(/h$/g, '')              // Remove trailing h
    .replace(/\s+/g, ' ')            // Normalize whitespace
    .trim();

  return result;
}

/**
 * Get the phonetic root of a word
 * Alias for normalizePhonetic for semantic clarity
 *
 * @param {string} word - Input word
 * @returns {string} Phonetic root
 */
function getPhoneticRoot(word) {
  return normalizePhonetic(word);
}

/**
 * Generate all common spelling variants for a phonetic root
 *
 * @param {string} root - Normalized phonetic root
 * @returns {string[]} Array of possible spelling variants
 */
function generateVariants(root) {
  if (!root || typeof root !== 'string') {
    return [];
  }

  const variants = new Set([root]);

  // Generate case variants
  variants.add(root.toLowerCase());
  variants.add(root.toUpperCase());
  variants.add(root.charAt(0).toUpperCase() + root.slice(1));

  // Generate apostrophe variants for N and M initial words
  if (/^[nm]/i.test(root) && root.length > 1) {
    const first = root[0].toUpperCase();
    const rest = root.slice(1);
    variants.add(`${first}'${rest}`);
    variants.add(`${first}'${rest}`);
    variants.add(`${first.toLowerCase()}'${rest}`);
  }

  // Generate ny -> gn variants
  if (root.includes('ny')) {
    const gnVariant = root.replace(/ny/g, 'gn');
    variants.add(gnVariant);
    variants.add(gnVariant.charAt(0).toUpperCase() + gnVariant.slice(1));
  }

  // Generate ng -> ŋ variants
  if (root.includes('ng')) {
    variants.add(root.replace(/ng/g, 'ŋ'));
  }

  // Generate e -> ɛ and o -> ɔ variants
  if (root.includes('e')) {
    variants.add(root.replace(/e/g, 'ɛ'));
    variants.add(root.replace(/e/g, 'è'));
    variants.add(root.replace(/e/g, 'é'));
  }
  if (root.includes('o')) {
    variants.add(root.replace(/o/g, 'ɔ'));
    variants.add(root.replace(/o/g, 'ô'));
  }

  return Array.from(variants);
}

/**
 * Get all phonetic variants for a given word
 * First normalizes to root, then generates all possible variants
 *
 * @param {string} word - Input word in any spelling
 * @returns {Object} Object with root and variants array
 */
function getPhoneticVariants(word) {
  const root = getPhoneticRoot(word);
  const variants = generateVariants(root);

  return {
    original: word,
    root: root,
    variants: variants,
  };
}

/**
 * Check if two words are phonetically equivalent
 *
 * @param {string} a - First word
 * @param {string} b - Second word
 * @returns {boolean} True if words normalize to same root
 */
function arePhonetically_Equivalent(a, b) {
  return getPhoneticRoot(a) === getPhoneticRoot(b);
}

/**
 * Calculate phonetic similarity score between two words
 *
 * @param {string} a - First word
 * @param {string} b - Second word
 * @returns {number} Similarity score from 0 to 1
 */
function phoneticSimilarity(a, b) {
  const rootA = getPhoneticRoot(a);
  const rootB = getPhoneticRoot(b);

  if (rootA === rootB) return 1.0;
  if (!rootA || !rootB) return 0.0;

  // Calculate Levenshtein distance
  const distance = levenshteinDistance(rootA, rootB);
  const maxLen = Math.max(rootA.length, rootB.length);

  return 1 - (distance / maxLen);
}

/**
 * Levenshtein distance helper
 */
function levenshteinDistance(a, b) {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  const matrix = [];
  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

// =============================================================================
// DICTIONARY BUILDING FUNCTIONS
// =============================================================================

/**
 * Build phonetic dictionary from corpus data
 * Groups all words by their phonetic root
 *
 * @param {Object} options - Build options
 * @param {string} options.dataDir - Path to data directory
 * @param {boolean} options.includeGoogleSmol - Include Google SMOL data
 * @param {boolean} options.includeLexicon - Include lexicon data
 * @param {boolean} options.includeVocabulary - Include vocabulary data
 * @returns {Object} Phonetic dictionary
 */
async function buildPhoneticDictionary(options = {}) {
  const dataDir = options.dataDir || path.join(__dirname, '..', 'data');
  const gptDir = path.join(__dirname, '..', 'gpt');

  const dictionary = {
    version: '1.0.0',
    buildDate: new Date().toISOString(),
    stats: {
      totalWords: 0,
      uniqueRoots: 0,
      averageVariantsPerRoot: 0,
    },
    roots: {}, // phonetic_root -> { variants: [], sources: [], frequency: number }
  };

  const allWords = new Map(); // word -> { sources: [], frequency: number }

  // Helper to add word to collection
  const addWord = (word, source, frequency = 1) => {
    if (!word || typeof word !== 'string' || word.length < 1) return;

    // Clean the word
    const cleaned = word.trim();
    if (cleaned.length === 0) return;

    // Skip if word contains numbers or unusual characters
    if (/\d/.test(cleaned)) return;
    if (cleaned.length > 50) return; // Skip extremely long strings

    const key = cleaned.toLowerCase();
    if (allWords.has(key)) {
      const existing = allWords.get(key);
      if (!existing.sources.includes(source)) {
        existing.sources.push(source);
      }
      existing.frequency += frequency;
    } else {
      allWords.set(key, {
        original: cleaned,
        sources: [source],
        frequency: frequency,
      });
    }
  };

  // Helper to extract words from text
  const extractWords = (text, source) => {
    if (!text || typeof text !== 'string') return;

    // Split on whitespace and punctuation, keeping apostrophes within words
    const words = text.split(/[\s,;:.!?\-\[\]{}()"<>\/\\]+/);
    for (const word of words) {
      if (word.length >= 1) {
        addWord(word, source);
      }
    }
  };

  console.log('Building phonetic dictionary...');

  // 1. Load vocabulary from gpt folder
  if (options.includeVocabulary !== false) {
    const vocabPath = path.join(gptDir, 'soussou_vocabulary.json');
    if (fs.existsSync(vocabPath)) {
      console.log('  Loading vocabulary...');
      try {
        const vocab = JSON.parse(fs.readFileSync(vocabPath, 'utf8'));
        for (const entry of vocab) {
          if (entry.word) {
            addWord(entry.word, 'vocabulary', entry.frequency || 1);
          }
        }
      } catch (err) {
        console.error('  Error loading vocabulary:', err.message);
      }
    }
  }

  // 2. Load lexicon
  if (options.includeLexicon !== false) {
    const lexiconPath = path.join(dataDir, 'lexicon.json');
    if (fs.existsSync(lexiconPath)) {
      console.log('  Loading lexicon...');
      try {
        const lexicon = JSON.parse(fs.readFileSync(lexiconPath, 'utf8'));
        for (const entry of lexicon) {
          if (entry.base) {
            addWord(entry.base, 'lexicon', entry.frequency || 1);
          }
          if (entry.variants && Array.isArray(entry.variants)) {
            for (const variant of entry.variants) {
              addWord(variant, 'lexicon_variant', 1);
            }
          }
        }
      } catch (err) {
        console.error('  Error loading lexicon:', err.message);
      }
    }
  }

  // 3. Load Google SMOL data
  if (options.includeGoogleSmol !== false) {
    const smolDir = path.join(dataDir, 'google_smol');
    if (fs.existsSync(smolDir)) {
      console.log('  Loading Google SMOL data...');
      const smolFiles = fs.readdirSync(smolDir).filter(f => f.endsWith('.jsonl'));

      for (const file of smolFiles) {
        const filePath = path.join(smolDir, file);
        try {
          const content = fs.readFileSync(filePath, 'utf8');
          const lines = content.split('\n').filter(l => l.trim());

          for (const line of lines) {
            try {
              const entry = JSON.parse(line);

              // Extract source text
              if (entry.src && entry.sl === 'sus') {
                extractWords(entry.src, 'google_smol');
              }

              // Extract target translations
              if (entry.trgs && entry.tl === 'sus') {
                for (const trg of entry.trgs) {
                  extractWords(trg, 'google_smol');
                }
              }

              // Handle alternate format
              if (entry.trg && entry.tl === 'sus') {
                extractWords(entry.trg, 'google_smol');
              }
            } catch (parseErr) {
              // Skip malformed lines
            }
          }
        } catch (err) {
          console.error(`  Error loading ${file}:`, err.message);
        }
      }
    }
  }

  console.log(`  Collected ${allWords.size} unique words`);
  console.log('  Grouping by phonetic root...');

  // Group words by phonetic root
  for (const [key, data] of allWords) {
    const root = getPhoneticRoot(data.original);
    if (!root) continue;

    if (!dictionary.roots[root]) {
      dictionary.roots[root] = {
        variants: [],
        sources: [],
        frequency: 0,
        examples: [],
      };
    }

    const rootEntry = dictionary.roots[root];

    // Add variant if not already present
    if (!rootEntry.variants.includes(data.original)) {
      rootEntry.variants.push(data.original);
    }

    // Merge sources
    for (const source of data.sources) {
      if (!rootEntry.sources.includes(source)) {
        rootEntry.sources.push(source);
      }
    }

    // Add frequency
    rootEntry.frequency += data.frequency;
  }

  // Calculate stats
  const rootCount = Object.keys(dictionary.roots).length;
  let totalVariants = 0;
  for (const root of Object.values(dictionary.roots)) {
    totalVariants += root.variants.length;
  }

  dictionary.stats = {
    totalWords: allWords.size,
    uniqueRoots: rootCount,
    averageVariantsPerRoot: rootCount > 0 ? (totalVariants / rootCount).toFixed(2) : 0,
  };

  console.log(`  Created ${rootCount} phonetic roots`);
  console.log(`  Average variants per root: ${dictionary.stats.averageVariantsPerRoot}`);

  return dictionary;
}

/**
 * Save phonetic dictionary to JSON file
 *
 * @param {Object} dictionary - Phonetic dictionary object
 * @param {string} outputPath - Output file path
 */
function saveDictionary(dictionary, outputPath) {
  const sortedRoots = {};
  const sortedKeys = Object.keys(dictionary.roots).sort();

  for (const key of sortedKeys) {
    sortedRoots[key] = dictionary.roots[key];
    // Sort variants within each root
    sortedRoots[key].variants.sort();
  }

  const output = {
    ...dictionary,
    roots: sortedRoots,
  };

  fs.writeFileSync(outputPath, JSON.stringify(output, null, 2), 'utf8');
  console.log(`Dictionary saved to ${outputPath}`);
}

/**
 * Load phonetic dictionary from JSON file
 *
 * @param {string} inputPath - Input file path
 * @returns {Object} Phonetic dictionary
 */
function loadDictionary(inputPath) {
  const content = fs.readFileSync(inputPath, 'utf8');
  return JSON.parse(content);
}

// =============================================================================
// LOOKUP FUNCTIONS
// =============================================================================

/**
 * Look up a word in the phonetic dictionary
 *
 * @param {Object} dictionary - Phonetic dictionary
 * @param {string} word - Word to look up
 * @returns {Object|null} Root entry if found, null otherwise
 */
function lookupWord(dictionary, word) {
  const root = getPhoneticRoot(word);
  if (!root || !dictionary.roots[root]) {
    return null;
  }

  return {
    root: root,
    ...dictionary.roots[root],
  };
}

/**
 * Find all words similar to a given word
 *
 * @param {Object} dictionary - Phonetic dictionary
 * @param {string} word - Word to search for
 * @param {number} threshold - Minimum similarity (0-1)
 * @returns {Object[]} Array of similar entries with scores
 */
function findSimilarWords(dictionary, word, threshold = 0.7) {
  const targetRoot = getPhoneticRoot(word);
  if (!targetRoot) return [];

  const results = [];

  for (const [root, entry] of Object.entries(dictionary.roots)) {
    const similarity = phoneticSimilarity(targetRoot, root);
    if (similarity >= threshold) {
      results.push({
        root: root,
        similarity: similarity,
        variants: entry.variants,
        frequency: entry.frequency,
      });
    }
  }

  // Sort by similarity descending, then by frequency
  results.sort((a, b) => {
    if (b.similarity !== a.similarity) {
      return b.similarity - a.similarity;
    }
    return b.frequency - a.frequency;
  });

  return results;
}

// =============================================================================
// BATCH PROCESSING
// =============================================================================

/**
 * Normalize an array of words
 *
 * @param {string[]} words - Array of words
 * @returns {string[]} Array of normalized roots
 */
function batchNormalize(words) {
  return words.map(getPhoneticRoot);
}

/**
 * Group an array of words by their phonetic root
 *
 * @param {string[]} words - Array of words
 * @returns {Object} Object mapping roots to word arrays
 */
function groupByRoot(words) {
  const groups = {};

  for (const word of words) {
    const root = getPhoneticRoot(word);
    if (!root) continue;

    if (!groups[root]) {
      groups[root] = [];
    }
    groups[root].push(word);
  }

  return groups;
}

// =============================================================================
// CLI INTERFACE
// =============================================================================

async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  if (command === 'build' || !command) {
    // Build the phonetic dictionary
    console.log('Building phonetic dictionary from corpus...\n');

    const dictionary = await buildPhoneticDictionary({
      dataDir: path.join(__dirname, '..', 'data'),
      includeGoogleSmol: true,
      includeLexicon: true,
      includeVocabulary: true,
    });

    const outputPath = path.join(__dirname, '..', 'data', 'phonetic_dictionary.json');
    saveDictionary(dictionary, outputPath);

    console.log('\n=== Dictionary Statistics ===');
    console.log(`Total unique words: ${dictionary.stats.totalWords}`);
    console.log(`Unique phonetic roots: ${dictionary.stats.uniqueRoots}`);
    console.log(`Average variants per root: ${dictionary.stats.averageVariantsPerRoot}`);

    // Show some examples
    console.log('\n=== Sample Entries (High Frequency) ===');
    const topRoots = Object.entries(dictionary.roots)
      .sort((a, b) => b[1].frequency - a[1].frequency)
      .slice(0, 10);

    for (const [root, entry] of topRoots) {
      console.log(`\n"${root}" (freq: ${entry.frequency})`);
      console.log(`  Variants: ${entry.variants.slice(0, 5).join(', ')}${entry.variants.length > 5 ? '...' : ''}`);
    }

  } else if (command === 'test') {
    // Run test suite
    console.log('Running phonetic mapper tests...\n');
    runTests();

  } else if (command === 'lookup') {
    // Look up a specific word
    const word = args[1];
    if (!word) {
      console.log('Usage: node phonetic_mapper.js lookup <word>');
      process.exit(1);
    }

    const dictPath = path.join(__dirname, '..', 'data', 'phonetic_dictionary.json');
    if (!fs.existsSync(dictPath)) {
      console.log('Dictionary not found. Run "node phonetic_mapper.js build" first.');
      process.exit(1);
    }

    const dictionary = loadDictionary(dictPath);
    const result = lookupWord(dictionary, word);

    if (result) {
      console.log(`\nWord: "${word}"`);
      console.log(`Root: "${result.root}"`);
      console.log(`Variants: ${result.variants.join(', ')}`);
      console.log(`Frequency: ${result.frequency}`);
      console.log(`Sources: ${result.sources.join(', ')}`);
    } else {
      console.log(`\nWord "${word}" not found in dictionary.`);
      console.log(`Phonetic root: "${getPhoneticRoot(word)}"`);
      console.log(`Generated variants: ${generateVariants(getPhoneticRoot(word)).join(', ')}`);
    }

  } else if (command === 'normalize') {
    // Normalize a word or phrase
    const text = args.slice(1).join(' ');
    if (!text) {
      console.log('Usage: node phonetic_mapper.js normalize <text>');
      process.exit(1);
    }

    console.log(`\nOriginal: "${text}"`);
    console.log(`Normalized: "${normalizePhonetic(text)}"`);

  } else {
    console.log('Soussou Phonetic Mapper');
    console.log('=======================\n');
    console.log('Commands:');
    console.log('  build              Build phonetic dictionary from corpus');
    console.log('  test               Run test suite');
    console.log('  lookup <word>      Look up a word in the dictionary');
    console.log('  normalize <text>   Normalize text to phonetic form');
  }
}

// =============================================================================
// TEST SUITE
// =============================================================================

const TEST_CASES = [
  // IPA conversions
  { input: "ɛtɛ", expected: "ete", description: "IPA epsilon to e" },
  { input: "bɔkɔ", expected: "boko", description: "IPA open-o to o" },
  { input: "baŋgui", expected: "bangi", description: "IPA velar nasal (ŋg -> ng -> n after compression)" },
  { input: "ɲa", expected: "nya", description: "IPA palatal nasal" },

  // Diacritic conversions
  { input: "fafè", expected: "fafe", description: "Grave accent" },
  { input: "fafé", expected: "fafe", description: "Acute accent" },
  { input: "fafê", expected: "fafe", description: "Circumflex" },
  { input: "Bôgô", expected: "bogo", description: "Multiple circumflex" },
  { input: "khèré", expected: "khere", description: "Mixed accents" },

  // French patterns
  { input: "signè", expected: "sinye", description: "gn to ny" },
  { input: "Bôgné", expected: "bonye", description: "gn with diacritics" },
  { input: "gnome", expected: "nyome", description: "gn at start" },

  // Apostrophe patterns
  { input: "N'tan", expected: "ntan", description: "N' apostrophe" },
  { input: "M'ma", expected: "ma", description: "M' apostrophe + double m" },
  { input: "N'na", expected: "na", description: "N' + double n" },
  { input: "n'gué", expected: "ngue", description: "n' lowercase + French gu" },

  // Combined cases
  { input: "tanàmoufègnê", expected: "tanamufenye", description: "Complex greeting (ou->u, gn->ny)" },
  { input: "wo nansé rabafé", expected: "wo nanse rabafe", description: "Phrase" },
  { input: "GnOhOmi", expected: "nyohomi", description: "Google SMOL caps + IPA" },

  // Double consonant compression
  { input: "mma", expected: "ma", description: "Double m" },
  { input: "nna", expected: "na", description: "Double n" },
  { input: "bba", expected: "ba", description: "Double b" },

  // Edge cases
  { input: "", expected: "", description: "Empty string" },
  { input: "   ", expected: "", description: "Whitespace only" },
  { input: "abc", expected: "abc", description: "Plain ASCII" },
];

function runTests() {
  let passed = 0;
  let failed = 0;
  const failures = [];

  for (const test of TEST_CASES) {
    const result = normalizePhonetic(test.input);
    if (result === test.expected) {
      passed++;
      console.log(`  PASS: ${test.description}`);
    } else {
      failed++;
      failures.push({
        ...test,
        got: result,
      });
      console.log(`  FAIL: ${test.description}`);
      console.log(`        Input: "${test.input}"`);
      console.log(`        Expected: "${test.expected}"`);
      console.log(`        Got: "${result}"`);
    }
  }

  console.log(`\n=== Test Results ===`);
  console.log(`Passed: ${passed}/${TEST_CASES.length}`);
  console.log(`Failed: ${failed}/${TEST_CASES.length}`);

  if (failures.length > 0) {
    console.log('\nFailures:');
    for (const f of failures) {
      console.log(`  "${f.input}" -> "${f.got}" (expected "${f.expected}")`);
    }
  }

  return { passed, failed, total: TEST_CASES.length };
}

// =============================================================================
// MODULE EXPORTS
// =============================================================================

module.exports = {
  // Core normalization
  normalizePhonetic,
  getPhoneticRoot,

  // Variant generation
  generateVariants,
  getPhoneticVariants,

  // Comparison
  arePhonetically_Equivalent,
  phoneticSimilarity,

  // Dictionary operations
  buildPhoneticDictionary,
  saveDictionary,
  loadDictionary,
  lookupWord,
  findSimilarWords,

  // Batch processing
  batchNormalize,
  groupByRoot,

  // Testing
  runTests,
  TEST_CASES,

  // Constants (for reference)
  IPA_TO_LATIN,
  DIACRITIC_TO_BASE,
  FRENCH_PATTERNS,
  APOSTROPHE_VARIANTS,
};

// Run CLI if executed directly
if (require.main === module) {
  main().catch(console.error);
}
