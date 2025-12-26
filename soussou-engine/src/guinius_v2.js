/**
 * GUINIUS v2 - Complete Susu Language AI
 *
 * Master integration module combining ALL translation capabilities:
 * - Corpus-based exact matching (31,829 sentences)
 * - Grammar-aware sentence generation (SOV)
 * - French/English fallback system
 * - Conversation context tracking
 * - Gap recording for human contribution
 *
 * Goal: Enable full conversation in Susu via LLM integration
 */

const path = require('path');
const fs = require('fs');

// Core translation modules
const susuAI = require('./susu_ai');
const guinius = require('./guinius');
const { normalizeEither, detectOrthography } = require('./orthography_converter');
const { findMatch, getSusuTranslation, suggestSimilar } = require('./sentence_matcher');

// Optional modules (lazy loaded)
let fallbackSystem = null;
let conversationModule = null;
let sentenceGenerator = null;
let translationTransformer = null;
let qualityScorer = null;
let grammarExtractor = null;
let morphologyAnalyzer = null;
let phoneticMapper = null;

// Lazy loaders
function getFallbackSystem() {
  if (!fallbackSystem) {
    try { fallbackSystem = require('./fallback_system'); }
    catch (e) { console.warn('Fallback system not available'); }
  }
  return fallbackSystem;
}

function getConversationModule() {
  if (!conversationModule) {
    try { conversationModule = require('./conversation'); }
    catch (e) { console.warn('Conversation module not available'); }
  }
  return conversationModule;
}

function getSentenceGenerator() {
  if (!sentenceGenerator) {
    try { sentenceGenerator = require('./sentence_generator'); }
    catch (e) { console.warn('Sentence generator not available'); }
  }
  return sentenceGenerator;
}

function getTranslationTransformer() {
  if (!translationTransformer) {
    try { translationTransformer = require('./translation_transformer'); }
    catch (e) { console.warn('Translation transformer not available:', e.message); }
  }
  return translationTransformer;
}

function getQualityScorer() {
  if (!qualityScorer) {
    try { qualityScorer = require('./quality_scorer'); }
    catch (e) { console.warn('Quality scorer not available:', e.message); }
  }
  return qualityScorer;
}

function getGrammarExtractor() {
  if (!grammarExtractor) {
    try { grammarExtractor = require('./grammar_extractor'); }
    catch (e) { console.warn('Grammar extractor not available:', e.message); }
  }
  return grammarExtractor;
}

function getMorphologyAnalyzer() {
  if (!morphologyAnalyzer) {
    try { morphologyAnalyzer = require('./morphology_analyzer'); }
    catch (e) { console.warn('Morphology analyzer not available:', e.message); }
  }
  return morphologyAnalyzer;
}

function getPhoneticMapper() {
  if (!phoneticMapper) {
    try { phoneticMapper = require('./phonetic_mapper'); }
    catch (e) { console.warn('Phonetic mapper not available:', e.message); }
  }
  return phoneticMapper;
}

// ===========================================================================
// CONFIGURATION
// ===========================================================================

const CONFIG = {
  // Confidence thresholds
  minConfidenceExact: 0.9,      // Trust exact matches
  minConfidenceFuzzy: 0.7,      // Accept fuzzy matches
  minConfidenceGenerated: 0.5,  // Accept generated translations
  minConfidenceFallback: 0.3,   // Accept fallback (French/English)

  // Fallback behavior
  useFrenchFallback: true,      // Guinea's official language
  useEnglishFallback: true,     // Last resort

  // Context
  trackGaps: true,              // Record missing translations
  trackConversation: true,      // Remember conversation context

  // Google API
  googleApiKey: process.env.GOOGLE_TRANSLATE_API_KEY || 'AIzaSyCV-1WfnuFLmxw5ib_fuVcO2KLGjUXLpuk'
};

// ===========================================================================
// MAIN TRANSLATION PIPELINE
// ===========================================================================

/**
 * Comprehensive translation with FULL pipeline (ALL MODULES INTEGRATED)
 *
 * Pipeline:
 * 0. PRE-PROCESSING: Transform input, analyze morphology, extract grammar
 * 1. Exact corpus match (highest confidence)
 * 2. Phonetic variant matching
 * 3. Fuzzy corpus match
 * 4. Grammar-aware generation with pattern extraction
 * 5. Translation transformer post-processing
 * 6. Google Translate
 * 7. French bridge (English → French → Susu)
 * 8. Quality scoring to pick best from alternatives
 * 9. Fallback with gap recording
 *
 * @param {string} text - Text to translate
 * @param {Object} options - Translation options
 * @returns {Object} Complete translation result
 */
async function translate(text, options = {}) {
  const {
    from = 'auto',           // 'auto', 'en', 'sus', 'fr'
    to = null,               // Infer from 'from'
    conversationId = null,   // For context tracking
    includeAlternatives = true,
    includeFallback = true,
    includeGaps = true
  } = options;

  // Initialize result
  const result = {
    input: text,
    translation: null,
    confidence: 0,
    source: null,
    method: null,
    alternatives: [],
    fallback: null,
    gaps: [],
    conversationContext: null,
    processingTime: Date.now(),
    // NEW: Enhanced analysis data
    morphology: null,
    grammarPattern: null,
    phoneticVariants: [],
    qualityScore: null
  };

  try {
    // Detect source language if auto
    const sourceLang = from === 'auto' ? detectLanguage(text) : from;
    const targetLang = to || (sourceLang === 'sus' ? 'en' : 'sus');

    result.sourceLang = sourceLang;
    result.targetLang = targetLang;

    // ==== STEP 0: PRE-PROCESSING (NEW) ====

    // 0a. Morphological analysis (for Susu input)
    if (sourceLang === 'sus') {
      const morphology = getMorphologyAnalyzer();
      if (morphology && morphology.analyze) {
        try {
          result.morphology = morphology.analyze(text);
        } catch (e) { /* continue */ }
      }
    }

    // 0b. Grammar pattern extraction
    const grammar = getGrammarExtractor();
    if (grammar && grammar.extractPattern) {
      try {
        result.grammarPattern = grammar.extractPattern(text, sourceLang);
      } catch (e) { /* continue */ }
    }

    // 0c. Get phonetic variants for better matching
    const phonetic = getPhoneticMapper();
    if (phonetic && phonetic.getPhoneticVariants) {
      try {
        result.phoneticVariants = phonetic.getPhoneticVariants(text);
      } catch (e) { /* continue */ }
    }

    // Collect all candidates for quality scoring
    const candidates = [];

    // ==== STEP 1: EXACT CORPUS MATCH ====
    const exactMatch = await tryExactMatch(text, sourceLang, targetLang);
    if (exactMatch && exactMatch.confidence >= CONFIG.minConfidenceExact) {
      candidates.push({ ...exactMatch, method: 'exact_corpus' });
    }

    // ==== STEP 2: PHONETIC VARIANT MATCHING (NEW) ====
    if (result.phoneticVariants && result.phoneticVariants.length > 0) {
      for (const variant of result.phoneticVariants.slice(0, 3)) {
        const variantMatch = await tryExactMatch(variant, sourceLang, targetLang);
        if (variantMatch && variantMatch.confidence >= CONFIG.minConfidenceExact) {
          candidates.push({ ...variantMatch, method: 'phonetic_variant', variant });
        }
      }
    }

    // ==== STEP 3: FUZZY CORPUS MATCH ====
    const fuzzyMatch = await tryFuzzyMatch(text, sourceLang, targetLang);
    if (fuzzyMatch && fuzzyMatch.confidence >= CONFIG.minConfidenceFuzzy) {
      candidates.push({ ...fuzzyMatch, method: 'fuzzy_corpus' });
    }

    // ==== STEP 4: GRAMMAR-AWARE GENERATION ====
    if (targetLang === 'sus') {
      const generator = getSentenceGenerator();
      if (generator) {
        const generated = await tryGenerated(text, generator, result.grammarPattern);
        if (generated && generated.confidence >= CONFIG.minConfidenceGenerated) {
          candidates.push({ ...generated, method: 'generated' });
        }
      }
    }

    // ==== STEP 5: PICK BEST FROM CANDIDATES (Quality Scoring) ====
    if (candidates.length > 0) {
      const bestCandidate = pickBestCandidate(candidates, text, targetLang);

      // Apply translation transformer for post-processing
      const transformer = getTranslationTransformer();
      if (transformer && transformer.transform && bestCandidate.translation) {
        try {
          const transformed = transformer.transform(bestCandidate.translation, {
            sourceLang,
            targetLang,
            grammarPattern: result.grammarPattern
          });
          if (transformed && transformed !== bestCandidate.translation) {
            bestCandidate.translation = transformed;
            bestCandidate.transformed = true;
          }
        } catch (e) { /* keep original */ }
      }

      Object.assign(result, bestCandidate);
      result.alternatives = candidates.filter(c => c !== bestCandidate).slice(0, 3);
      return finalize(result);
    }

    // 4. Try Google Translate directly
    const googleResult = await tryGoogleTranslate(text, sourceLang, targetLang);
    if (googleResult && googleResult.translation) {
      Object.assign(result, googleResult);
      result.method = 'google_translate';
      return finalize(result);
    }

    // 5. Try French bridge (for unknown phrases)
    if (CONFIG.useFrenchFallback && targetLang === 'sus') {
      const frenchBridge = await tryFrenchBridge(text, sourceLang);
      if (frenchBridge && frenchBridge.translation) {
        Object.assign(result, frenchBridge);
        result.method = 'french_bridge';
        return finalize(result);
      }
    }

    // 6. Fallback - use whatever we have and record gap
    if (includeFallback) {
      const fallback = await getFallbackTranslation(text, sourceLang, targetLang);
      result.fallback = fallback;
      result.translation = fallback.bestAvailable;
      result.confidence = fallback.confidence;
      result.method = 'fallback';
      result.source = fallback.source;

      // Record gap for human contribution
      if (CONFIG.trackGaps && includeGaps) {
        recordTranslationGap(text, result);
      }
    }

  } catch (error) {
    result.error = error.message;
    result.method = 'error';
  }

  return finalize(result);
}

// ===========================================================================
// QUALITY SCORING (NEW - Uses all modules to pick best translation)
// ===========================================================================

/**
 * Pick the best translation from multiple candidates using quality scoring
 *
 * Scoring factors:
 * - Method priority (exact > phonetic > fuzzy > generated)
 * - Confidence score
 * - Quality scorer metrics (if available)
 * - Grammar pattern match
 */
function pickBestCandidate(candidates, originalText, targetLang) {
  if (candidates.length === 0) return null;
  if (candidates.length === 1) return candidates[0];

  // Method priority scores
  const METHOD_PRIORITY = {
    'exact_corpus': 100,
    'phonetic_variant': 90,
    'fuzzy_corpus': 70,
    'generated': 50,
    'google_translate': 40,
    'french_bridge': 30
  };

  // Score each candidate
  const scored = candidates.map(candidate => {
    let score = 0;

    // Base score from method
    score += METHOD_PRIORITY[candidate.method] || 0;

    // Confidence boost (0-50 points)
    score += (candidate.confidence || 0) * 50;

    // Use quality scorer if available
    const scorer = getQualityScorer();
    if (scorer && scorer.scoreTranslation && candidate.translation) {
      try {
        const qualityMetrics = scorer.scoreTranslation(
          originalText,
          candidate.translation,
          targetLang
        );
        if (qualityMetrics && qualityMetrics.overall) {
          score += qualityMetrics.overall * 20; // 0-20 quality boost
          candidate.qualityMetrics = qualityMetrics;
        }
      } catch (e) { /* continue without quality score */ }
    }

    return { candidate, score };
  });

  // Sort by score descending
  scored.sort((a, b) => b.score - a.score);

  // Return best candidate with quality score
  const best = scored[0].candidate;
  best.qualityScore = scored[0].score;

  return best;
}

// ===========================================================================
// TRANSLATION METHODS
// ===========================================================================

async function tryExactMatch(text, sourceLang, targetLang) {
  try {
    // Use guinius main translate
    const guiniusResult = await guinius.translate(text);

    if (guiniusResult.source === 'conversational' ||
        guiniusResult.source === 'conversational_prefix' ||
        guiniusResult.source === 'smol_exact') {
      return {
        translation: guiniusResult.translation,
        confidence: 1.0,
        source: guiniusResult.source
      };
    }

    if (guiniusResult.confidence >= 0.9) {
      return guiniusResult;
    }
  } catch (e) { /* continue */ }

  return null;
}

async function tryFuzzyMatch(text, sourceLang, targetLang) {
  try {
    const match = findMatch(text);
    if (match && match.confidence >= 0.7) {
      return {
        translation: match.susu,
        confidence: match.confidence,
        source: 'fuzzy_' + match.matchType,
        matchedPhrase: match.english
      };
    }
  } catch (e) { /* continue */ }

  return null;
}

async function tryGenerated(text, generator, grammarPattern = null) {
  try {
    // Pass grammar pattern to generator for better SOV construction
    const options = {};
    if (grammarPattern) {
      options.pattern = grammarPattern;
      options.usePatternHints = true;
    }

    const generated = generator.generate ? generator.generate(text, options) : null;
    if (generated && generated.translation && !generated.translation.includes('[')) {
      return {
        translation: generated.translation,
        confidence: generated.confidence,
        source: 'grammar_generator',
        analysis: generated.analysis,
        grammarPatternUsed: !!grammarPattern
      };
    }
  } catch (e) { /* continue */ }

  return null;
}

async function tryGoogleTranslate(text, sourceLang, targetLang) {
  try {
    susuAI.CONFIG.googleApiKey = CONFIG.googleApiKey;
    const result = await susuAI.googleTranslate(text, sourceLang, targetLang);
    if (result) {
      return {
        translation: result,
        confidence: 0.7,
        source: 'google_translate'
      };
    }
  } catch (e) { /* continue */ }

  return null;
}

async function tryFrenchBridge(text, sourceLang) {
  const fallback = getFallbackSystem();
  if (!fallback) return null;

  try {
    // English → French
    const french = await fallback.translateToFrench(text, sourceLang);
    if (!french) return null;

    // French → Susu
    const susu = await fallback.translateFrenchToSusu(french);
    if (susu) {
      return {
        translation: susu,
        confidence: 0.6,
        source: 'french_bridge',
        french: french
      };
    }
  } catch (e) { /* continue */ }

  return null;
}

async function getFallbackTranslation(text, sourceLang, targetLang) {
  const fallback = getFallbackSystem();

  // Try to get whatever we can
  let bestAvailable = text;  // Worst case: return original
  let confidence = 0;
  let source = 'original';

  // Try word-by-word as last resort
  try {
    const wordByWord = await susuAI.translate(text, { from: sourceLang });
    if (wordByWord.translation && wordByWord.translation !== text) {
      bestAvailable = wordByWord.translation;
      confidence = wordByWord.confidence || 0.2;
      source = 'word_by_word';
    }
  } catch (e) { /* continue */ }

  // Get French version for display
  let frenchFallback = null;
  if (CONFIG.useFrenchFallback && fallback) {
    try {
      frenchFallback = await fallback.translateToFrench(text, sourceLang);
    } catch (e) { /* continue */ }
  }

  return {
    bestAvailable,
    confidence,
    source,
    french: frenchFallback,
    english: sourceLang !== 'en' ? text : null,
    needsHumanReview: true
  };
}

// ===========================================================================
// GAP TRACKING
// ===========================================================================

const gapBuffer = [];
const GAP_FILE = path.join(__dirname, '..', 'data', 'translation_gaps.json');

function recordTranslationGap(text, result) {
  gapBuffer.push({
    text,
    timestamp: new Date().toISOString(),
    partialTranslation: result.translation,
    confidence: result.confidence,
    source: result.source
  });

  // Flush to file periodically
  if (gapBuffer.length >= 10) {
    flushGaps();
  }
}

function flushGaps() {
  if (gapBuffer.length === 0) return;

  try {
    let existing = { gaps: [] };
    if (fs.existsSync(GAP_FILE)) {
      existing = JSON.parse(fs.readFileSync(GAP_FILE, 'utf-8'));
    }

    existing.gaps = existing.gaps.concat(gapBuffer);
    existing.lastUpdated = new Date().toISOString();
    existing.totalGaps = existing.gaps.length;

    fs.writeFileSync(GAP_FILE, JSON.stringify(existing, null, 2));
    gapBuffer.length = 0;  // Clear buffer
  } catch (e) {
    console.warn('Could not save gaps:', e.message);
  }
}

// ===========================================================================
// UTILITIES
// ===========================================================================

function detectLanguage(text) {
  // Check for Susu-specific characters
  if (/[ɔɛɲŋ]/.test(text)) return 'sus';

  // Check for Susu patterns
  if (/\b(naxa|bara|ntan|itan|atan|woma)\b/i.test(text)) return 'sus';

  // Check for French
  if (/\b(je|tu|il|elle|nous|vous|ils|les|une|des|est|sont|avec)\b/i.test(text)) return 'fr';

  // Default to English
  return 'en';
}

function finalize(result) {
  result.processingTime = Date.now() - result.processingTime;
  return result;
}

// ===========================================================================
// CONVERSATION INTERFACE (for LLM integration)
// ===========================================================================

/**
 * Process conversational input - designed for LLM integration
 *
 * @param {string} userInput - User's message
 * @param {Object} context - Conversation context
 * @returns {Object} Response with translation and suggestions
 */
async function chat(userInput, context = {}) {
  const response = {
    userInput,
    userInputLanguage: detectLanguage(userInput),
    timestamp: new Date().toISOString()
  };

  // Translate user input
  const translation = await translate(userInput, {
    from: response.userInputLanguage,
    includeAlternatives: true,
    includeFallback: true
  });

  response.translation = translation;

  // Generate suggested responses if Susu input
  if (response.userInputLanguage === 'sus') {
    response.suggestedResponses = await getSuggestedResponses(userInput, translation);
  }

  // Add learning prompt if gaps found
  if (translation.gaps && translation.gaps.length > 0) {
    response.learningPrompt = {
      message: 'Some words were not found in our dictionary:',
      gaps: translation.gaps,
      helpRequest: 'If you know the Susu translation, please share!'
    };
  }

  return response;
}

async function getSuggestedResponses(susuInput, translation) {
  // Common response patterns
  const responses = [];

  // If greeting, suggest greeting responses
  const greetingPatterns = /tanamo|kena|wali|salamu/i;
  if (greetingPatterns.test(susuInput)) {
    responses.push(
      { susu: 'N kèndeyakhi', english: 'I am fine' },
      { susu: 'Ala xa baraka', english: 'God bless' },
      { susu: 'Inou wali', english: 'Hello' }
    );
  }

  // If question, suggest answer patterns
  const questionPatterns = /minden|munse|nde|di$/i;
  if (questionPatterns.test(susuInput)) {
    responses.push(
      { susu: 'Iyo', english: 'Yes' },
      { susu: 'Ade', english: 'No' },
      { susu: 'N mu a kolon', english: "I don't know" }
    );
  }

  return responses;
}

// ===========================================================================
// STATS & INFO
// ===========================================================================

function getStats() {
  const baseStats = guinius.getStats();

  return {
    ...baseStats,
    engine: 'Guinius v2 FULL',
    version: '2.1.0',
    capabilities: {
      // Core translation
      exactCorpusMatch: true,
      fuzzyCorpusMatch: true,
      grammarGeneration: !!getSentenceGenerator(),
      googleTranslate: !!CONFIG.googleApiKey,
      frenchBridge: !!getFallbackSystem(),
      conversationTracking: !!getConversationModule(),
      gapTracking: CONFIG.trackGaps,
      // NEW: Full integration modules
      translationTransformer: !!getTranslationTransformer(),
      qualityScorer: !!getQualityScorer(),
      grammarExtractor: !!getGrammarExtractor(),
      morphologyAnalyzer: !!getMorphologyAnalyzer(),
      phoneticMapper: !!getPhoneticMapper()
    },
    modules: {
      sentenceGenerator: !!getSentenceGenerator(),
      translationTransformer: !!getTranslationTransformer(),
      qualityScorer: !!getQualityScorer(),
      grammarExtractor: !!getGrammarExtractor(),
      morphologyAnalyzer: !!getMorphologyAnalyzer(),
      phoneticMapper: !!getPhoneticMapper(),
      fallbackSystem: !!getFallbackSystem(),
      conversationModule: !!getConversationModule()
    },
    config: {
      minConfidenceExact: CONFIG.minConfidenceExact,
      minConfidenceFuzzy: CONFIG.minConfidenceFuzzy,
      useFrenchFallback: CONFIG.useFrenchFallback
    }
  };
}

// ===========================================================================
// EXPORTS
// ===========================================================================

module.exports = {
  translate,
  chat,
  getStats,
  detectLanguage,

  // Gap management
  flushGaps,

  // Config
  CONFIG,

  // For testing
  tryExactMatch,
  tryFuzzyMatch,
  tryGoogleTranslate,
  tryFrenchBridge
};

// CLI test
if (require.main === module) {
  (async () => {
    console.log('=== GUINIUS v2 - Complete Susu Language AI ===\n');
    console.log('Stats:', JSON.stringify(getStats(), null, 2));

    const testPhrases = [
      'Hello, how are you?',
      'I love you',
      'Where is the hospital?',
      'My name is John',
      'I need a doctor',
      'quantum physics'  // Test gap handling
    ];

    console.log('\n--- Translation Tests ---\n');

    for (const text of testPhrases) {
      const result = await translate(text);
      console.log(`"${text}"`);
      console.log(`  => "${result.translation}"`);
      console.log(`  [${result.method}] ${(result.confidence * 100).toFixed(0)}% | ${result.processingTime}ms`);
      if (result.fallback && result.fallback.french) {
        console.log(`  French: ${result.fallback.french}`);
      }
      if (result.gaps && result.gaps.length > 0) {
        console.log(`  Gaps: ${result.gaps.join(', ')}`);
      }
      console.log();
    }

    // Flush any remaining gaps
    flushGaps();
  })();
}
