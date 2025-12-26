/**
 * Susu Morphological Analyzer
 *
 * Breaks down Susu words into their component parts:
 * - Base/root form
 * - Prefixes (pronouns, particles)
 * - Suffixes (tense, aspect, case markers)
 *
 * Critical for understanding REAL Susu input
 */

// ============================================================================
// MORPHOLOGICAL PATTERNS (Extracted from Google SMOL)
// ============================================================================

const SUFFIXES = {
  // Tense/Aspect
  'xi': { type: 'tense', meaning: 'past/perfective', priority: 1 },
  'xI': { type: 'tense', meaning: 'past/perfective', priority: 1 },

  // Nominalizers
  'fe': { type: 'nominalizer', meaning: 'action noun', priority: 2 },
  'fE': { type: 'nominalizer', meaning: 'action noun', priority: 2 },

  // Locatives
  'ra': { type: 'locative', meaning: 'at/in/to', priority: 3 },
  'ni': { type: 'locative', meaning: 'in', priority: 3 },

  // Possessive/Case
  'ma': { type: 'possessive', meaning: 'possessive or on', priority: 4 },

  // Agent
  'de': { type: 'agent', meaning: 'doer', priority: 2 },

  // Plurals
  'e': { type: 'plural', meaning: 'plural', priority: 5 },
  'ee': { type: 'plural', meaning: 'plural', priority: 5 },
};

const PREFIXES = {
  // Subject pronouns (often contract)
  'n': { type: 'pronoun', meaning: 'I', full: 'ntan' },
  'm': { type: 'pronoun', meaning: 'I (before labials)', full: 'ntan' },
  'i': { type: 'pronoun', meaning: 'you', full: 'itan' },
  'a': { type: 'pronoun', meaning: 'he/she/it', full: 'atan' },
  'e': { type: 'pronoun', meaning: 'they', full: 'etan' },
  'won': { type: 'pronoun', meaning: 'we', full: 'wontan' },
  'mou': { type: 'pronoun', meaning: 'we', full: 'moutan' },
};

// Contraction patterns
const CONTRACTIONS = {
  "n'na": { parts: ['n', 'na'], meaning: 'I + progressive' },
  "n'tan": { parts: ['ntan'], meaning: 'I (emphatic)' },
  "m'ma": { parts: ['mu', 'ma'], meaning: 'not + verb marker (negation)' },
  "m'ba": { parts: ['n', 'ba'], meaning: 'I + father (my father)' },
  "n'ga": { parts: ['n', 'ga'], meaning: 'I + mother (my mother)' },
};

// Common verb roots (extracted from data)
const VERB_ROOTS = new Set([
  'siga', 'fafe', 'fafé', 'raba', 'kolon', 'kolonyi', 'fala', 'to', 'toé',
  'wali', 'dondé', 'yeminfé', 'khifé', 'woyénfé', 'falèfé', 'wakhonyi',
  'khayi', 'arafan', 'allo', 'finma', 'tongoï', 'araba', 'moun', 'iyètè',
  'gnèrè', 'dökhöfé', 'béré', 'kharanyi', 'sebèlitifé', 'magnönyi',
]);

// ============================================================================
// MORPHOLOGICAL ANALYSIS
// ============================================================================

/**
 * Analyze a single Susu word
 * @param {string} word - Input word
 * @returns {Object} Analysis result
 */
function analyzeWord(word) {
  if (!word || typeof word !== 'string') {
    return null;
  }

  const result = {
    original: word,
    normalized: normalizeSpelling(word),
    prefix: null,
    root: null,
    suffix: null,
    analysis: [],
  };

  let remaining = result.normalized;

  // Step 1: Check for contractions
  for (const [contraction, info] of Object.entries(CONTRACTIONS)) {
    const normalized = normalizeSpelling(contraction);
    if (remaining.startsWith(normalized)) {
      result.analysis.push({
        type: 'contraction',
        form: contraction,
        meaning: info.meaning,
        parts: info.parts
      });
      // Don't process further - contractions are complete units
      result.root = remaining;
      return result;
    }
  }

  // Step 2: Check for prefixes
  for (const [prefix, info] of Object.entries(PREFIXES)) {
    if (remaining.startsWith(prefix) && remaining.length > prefix.length + 2) {
      // Check if next char is apostrophe or the start of a word
      const afterPrefix = remaining.substring(prefix.length);
      if (afterPrefix.startsWith("'") || /^[aeiou]/.test(afterPrefix)) {
        result.prefix = {
          form: prefix,
          type: info.type,
          meaning: info.meaning,
          full: info.full
        };
        remaining = afterPrefix.replace(/^'/, '');
        result.analysis.push({
          type: 'prefix',
          form: prefix,
          meaning: info.meaning
        });
        break;
      }
    }
  }

  // Step 3: Check for suffixes (process longest first)
  const sortedSuffixes = Object.entries(SUFFIXES)
    .sort((a, b) => b[0].length - a[0].length);

  for (const [suffix, info] of sortedSuffixes) {
    if (remaining.endsWith(suffix) && remaining.length > suffix.length + 2) {
      result.suffix = {
        form: suffix,
        type: info.type,
        meaning: info.meaning
      };
      remaining = remaining.slice(0, -suffix.length);
      result.analysis.push({
        type: 'suffix',
        form: '-' + suffix,
        meaning: info.meaning
      });
      break;
    }
  }

  // Step 4: What remains is the root
  result.root = remaining;

  // Step 5: Check if root is a known verb
  if (VERB_ROOTS.has(remaining) || VERB_ROOTS.has(result.normalized)) {
    result.analysis.push({
      type: 'root',
      category: 'verb',
      form: remaining
    });
  }

  return result;
}

/**
 * Normalize Susu spelling variations
 */
function normalizeSpelling(text) {
  if (!text) return '';

  return text
    .toLowerCase()
    // Remove apostrophe variants
    .replace(/['''`]/g, '')
    // Remove diacritics
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    // Normalize special characters
    .replace(/ɛ/g, 'e')
    .replace(/ɔ/g, 'o')
    .replace(/ŋ/g, 'ng')
    .replace(/ɲ/g, 'ny')
    .trim();
}

/**
 * Analyze a full Susu sentence
 * @param {string} sentence - Input sentence
 * @returns {Object} Full analysis
 */
function analyzeSentence(sentence) {
  if (!sentence) return null;

  const words = sentence.split(/\s+/);
  const analysis = {
    original: sentence,
    word_count: words.length,
    words: words.map(w => analyzeWord(w)),
    structure: {
      subject: null,
      object: null,
      verb: null,
      modifiers: [],
      negation: false
    }
  };

  // Detect sentence structure
  for (let i = 0; i < analysis.words.length; i++) {
    const w = analysis.words[i];
    if (!w) continue;

    // Check for negation marker
    if (w.normalized === 'mu' || w.normalized === 'mma') {
      analysis.structure.negation = true;
    }

    // First pronoun is likely subject
    if (w.prefix?.type === 'pronoun' && !analysis.structure.subject) {
      analysis.structure.subject = { index: i, word: w };
    }

    // Look for verbs
    if (w.analysis?.some(a => a.category === 'verb')) {
      analysis.structure.verb = { index: i, word: w };
    }
  }

  return analysis;
}

/**
 * Get the base form of a word (strip all affixes)
 */
function getBaseForm(word) {
  const analysis = analyzeWord(word);
  return analysis?.root || word;
}

/**
 * Check if a word is likely a verb
 */
function isVerb(word) {
  const analysis = analyzeWord(word);
  const root = analysis?.root || word;
  return VERB_ROOTS.has(root) || VERB_ROOTS.has(normalizeSpelling(word));
}

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = {
  analyzeWord,
  analyzeSentence,
  normalizeSpelling,
  getBaseForm,
  isVerb,
  SUFFIXES,
  PREFIXES,
  CONTRACTIONS,
  VERB_ROOTS,
};

// ============================================================================
// CLI TEST
// ============================================================================

if (require.main === module) {
  console.log('=== SUSU MORPHOLOGICAL ANALYZER ===\n');

  const testWords = [
    "n'na",        // I + progressive (contraction)
    "m'ma",        // negation contraction
    "sigaxi",      // went (siga + xi)
    "rabaxi",      // did (raba + xi)
    "walide",      // worker (wali + de)
    "kolonfe",     // knowing (kolon + fe)
    "tanàmoufègnê", // greeting
    "N'tan",       // I (emphatic)
  ];

  for (const word of testWords) {
    console.log(`Word: "${word}"`);
    const analysis = analyzeWord(word);
    console.log(`  Normalized: ${analysis.normalized}`);
    if (analysis.prefix) {
      console.log(`  Prefix: ${analysis.prefix.form} (${analysis.prefix.meaning})`);
    }
    console.log(`  Root: ${analysis.root}`);
    if (analysis.suffix) {
      console.log(`  Suffix: -${analysis.suffix.form} (${analysis.suffix.meaning})`);
    }
    if (analysis.analysis.length > 0) {
      console.log(`  Analysis:`, analysis.analysis.map(a => `${a.form}:${a.meaning}`).join(', '));
    }
    console.log();
  }

  console.log('=== SENTENCE ANALYSIS ===\n');

  const testSentences = [
    "N'tan mu kolon",           // I don't know
    "i siga mindé",             // Where are you going?
    "A bara sigaxi",            // He/she has gone
  ];

  for (const sent of testSentences) {
    console.log(`Sentence: "${sent}"`);
    const analysis = analyzeSentence(sent);
    console.log(`  Words: ${analysis.word_count}`);
    console.log(`  Negation: ${analysis.structure.negation}`);
    if (analysis.structure.subject) {
      console.log(`  Subject: word ${analysis.structure.subject.index + 1}`);
    }
    console.log();
  }
}
