/**
 * GUINIUS - Unified Susu AI Translation Engine
 *
 * Master module integrating all translation components:
 * - Sentence matching (SMOL + Bible corpus)
 * - Google Translate API
 * - Orthography normalization
 * - Grammar patterns
 * - Phonetic mapping
 *
 * Target: Soussou AI v1 by Jan 01 2026
 */

const path = require('path');

// Core modules (always loaded)
const susuAI = require('./susu_ai');
const { normalizeEither, detectOrthography, areOrthographicallyEquivalent } = require('./orthography_converter');
const { findMatch, getSusuTranslation, suggestSimilar } = require('./sentence_matcher');

// Optional modules (loaded on demand to save memory)
let bibleMatcher = null;
let qualityScorer = null;
let frequencyAnalyzer = null;
let phoneticMapper = null;
let grammarExtractor = null;
let conversationModule = null;

// Lazy loaders
function getBibleMatcher() {
  if (!bibleMatcher) {
    try { bibleMatcher = require('./bible_matcher'); }
    catch (e) { console.warn('Bible matcher not available:', e.message); }
  }
  return bibleMatcher;
}

function getQualityScorer() {
  if (!qualityScorer) {
    try { qualityScorer = require('./quality_scorer'); }
    catch (e) { console.warn('Quality scorer not available:', e.message); }
  }
  return qualityScorer;
}

function getFrequencyAnalyzer() {
  if (!frequencyAnalyzer) {
    try { frequencyAnalyzer = require('./frequency_analyzer'); }
    catch (e) { console.warn('Frequency analyzer not available:', e.message); }
  }
  return frequencyAnalyzer;
}

function getPhoneticMapper() {
  if (!phoneticMapper) {
    try { phoneticMapper = require('./phonetic_mapper'); }
    catch (e) { console.warn('Phonetic mapper not available:', e.message); }
  }
  return phoneticMapper;
}

function getGrammarExtractor() {
  if (!grammarExtractor) {
    try { grammarExtractor = require('./grammar_extractor'); }
    catch (e) { console.warn('Grammar extractor not available:', e.message); }
  }
  return grammarExtractor;
}

function getConversation() {
  if (!conversationModule) {
    try { conversationModule = require('./conversation'); }
    catch (e) { console.warn('Conversation module not available:', e.message); }
  }
  return conversationModule;
}

// =============================================================================
// UNIFIED TRANSLATION
// =============================================================================

/**
 * Translate text using best available method
 * Priority: Exact match > High-confidence fuzzy > Bible match > Google API
 *
 * @param {string} text - Text to translate
 * @param {Object} options - Translation options
 * @returns {Object} Translation result with confidence and source
 */
async function translate(text, options = {}) {
  const {
    from = 'auto',
    useGoogle = true,
    minConfidence = 0.7,
    includeSources = false
  } = options;

  const results = {
    input: text,
    translation: null,
    confidence: 0,
    source: null,
    alternatives: []
  };

  // Normalize input for matching
  const normalizedInput = normalizeEither(text);

  // 1. Try SMOL sentence matcher (863 verified translations)
  const smolMatch = findMatch(text);
  if (smolMatch && smolMatch.confidence >= minConfidence) {
    results.translation = smolMatch.susu;
    results.confidence = smolMatch.confidence;
    results.source = 'smol_' + smolMatch.matchType;
    if (includeSources) results.smolMatch = smolMatch;
  }

  // 2. Try Bible matcher (30,966 verses)
  if (!results.translation || results.confidence < 0.9) {
    const bible = getBibleMatcher();
    if (bible) {
      try {
        const bibleMatch = bible.findVerse ? bible.findVerse(text) : null;
        if (bibleMatch && bibleMatch.confidence > results.confidence) {
          results.translation = bibleMatch.susu;
          results.confidence = bibleMatch.confidence;
          results.source = 'bible';
          if (includeSources) results.bibleMatch = bibleMatch;
        }
      } catch (e) { /* Bible matcher failed, continue */ }
    }
  }

  // 3. Try main susuAI engine (unified index)
  if (!results.translation || results.confidence < minConfidence) {
    try {
      const aiResult = await susuAI.translate(text, { from, detailed: true });
      if (aiResult && aiResult.confidence > results.confidence) {
        results.translation = aiResult.translation;
        results.confidence = aiResult.confidence;
        results.source = aiResult.source || 'susu_ai';
        if (includeSources) results.aiResult = aiResult;
      }
    } catch (e) { /* susuAI failed, continue */ }
  }

  // 4. Fallback to Google Translate
  if (useGoogle && (!results.translation || results.confidence < minConfidence)) {
    if (susuAI.CONFIG && susuAI.CONFIG.googleApiKey) {
      try {
        const googleResult = await susuAI.googleTranslate(text, 'en', 'sus');
        if (googleResult) {
          // Only use Google if we have nothing better
          if (!results.translation) {
            results.translation = googleResult;
            results.confidence = 0.5; // Google confidence is unknown
            results.source = 'google_translate';
          } else {
            results.alternatives.push({
              translation: googleResult,
              source: 'google_translate'
            });
          }
        }
      } catch (e) { /* Google failed */ }
    }
  }

  // 5. If still nothing, try word-by-word
  if (!results.translation) {
    try {
      const wordByWord = await susuAI.translate(text, { from, detailed: true });
      results.translation = wordByWord.translation || `[${text}]`;
      results.confidence = wordByWord.confidence || 0.1;
      results.source = 'word_by_word';
    } catch (e) {
      results.translation = `[${text}]`;
      results.confidence = 0;
      results.source = 'none';
    }
  }

  return results;
}

/**
 * Quick translate - returns just the translation string
 */
async function quickTranslate(text) {
  const result = await translate(text);
  return result.translation;
}

/**
 * Lookup a word with all available information
 */
function lookup(word) {
  const result = {
    word,
    normalized: normalizeEither(word),
    orthography: detectOrthography(word),
    translations: [],
    frequency: null,
    phoneticVariants: [],
    examples: []
  };

  // Get base translation
  const baseTranslation = susuAI.lookup(word);
  if (baseTranslation) {
    result.translations.push(baseTranslation);
  }

  // Get frequency info
  const freq = getFrequencyAnalyzer();
  if (freq && freq.getWordFrequency) {
    result.frequency = freq.getWordFrequency(result.normalized);
  }

  // Get phonetic variants
  const phonetic = getPhoneticMapper();
  if (phonetic && phonetic.getPhoneticVariants) {
    result.phoneticVariants = phonetic.getPhoneticVariants(result.normalized);
  }

  // Get example sentences
  const examples = suggestSimilar(word, 3);
  result.examples = examples.filter(e => e.confidence > 0.3);

  return result;
}

// =============================================================================
// STATS & INFO
// =============================================================================

function getStats() {
  const base = susuAI.getStats();
  return {
    ...base,
    engine: 'Guinius',
    version: '1.0-alpha',
    modules: {
      orthography: true,
      sentenceMatcher: true,
      bibleMatcher: !!getBibleMatcher(),
      qualityScorer: !!getQualityScorer(),
      frequencyAnalyzer: !!getFrequencyAnalyzer(),
      phoneticMapper: !!getPhoneticMapper(),
      grammarExtractor: !!getGrammarExtractor(),
      conversation: !!getConversation()
    }
  };
}

// =============================================================================
// EXPORTS
// =============================================================================

module.exports = {
  // Main translation
  translate,
  quickTranslate,
  lookup,

  // Orthography
  normalizeEither,
  detectOrthography,
  areOrthographicallyEquivalent,

  // Sentence matching
  findMatch,
  getSusuTranslation,
  suggestSimilar,

  // Stats
  getStats,

  // Module getters (lazy load)
  getBibleMatcher,
  getQualityScorer,
  getFrequencyAnalyzer,
  getPhoneticMapper,
  getGrammarExtractor,
  getConversation,

  // Direct access to susuAI for advanced use
  susuAI
};

// CLI test
if (require.main === module) {
  (async () => {
    console.log('=== GUINIUS Translation Engine ===\n');
    console.log('Stats:', JSON.stringify(getStats(), null, 2));

    console.log('\n--- Translation Tests ---');
    const tests = [
      'Hello, how are you?',
      'I love you',
      'God is good',
      'The Lord is my shepherd'
    ];

    for (const text of tests) {
      const result = await translate(text);
      console.log(`\n"${text}"`);
      console.log(`  => "${result.translation}"`);
      console.log(`  [${result.source}, ${(result.confidence * 100).toFixed(0)}%]`);
    }
  })();
}
