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
 * Comprehensive translation with full pipeline
 *
 * Pipeline:
 * 1. Exact corpus match (highest confidence)
 * 2. Fuzzy corpus match
 * 3. Grammar-aware generation
 * 4. Google Translate
 * 5. French bridge (English → French → Susu)
 * 6. Fallback to French/English with gap recording
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
    processingTime: Date.now()
  };

  try {
    // Detect source language if auto
    const sourceLang = from === 'auto' ? detectLanguage(text) : from;
    const targetLang = to || (sourceLang === 'sus' ? 'en' : 'sus');

    result.sourceLang = sourceLang;
    result.targetLang = targetLang;

    // 1. Try exact corpus match (fastest, highest confidence)
    const exactMatch = await tryExactMatch(text, sourceLang, targetLang);
    if (exactMatch && exactMatch.confidence >= CONFIG.minConfidenceExact) {
      Object.assign(result, exactMatch);
      result.method = 'exact_corpus';
      return finalize(result);
    }

    // 2. Try fuzzy corpus match
    const fuzzyMatch = await tryFuzzyMatch(text, sourceLang, targetLang);
    if (fuzzyMatch && fuzzyMatch.confidence >= CONFIG.minConfidenceFuzzy) {
      Object.assign(result, fuzzyMatch);
      result.method = 'fuzzy_corpus';
      return finalize(result);
    }

    // 3. Try grammar-aware sentence generation (for English → Susu)
    if (targetLang === 'sus') {
      const generator = getSentenceGenerator();
      if (generator) {
        const generated = await tryGenerated(text, generator);
        if (generated && generated.confidence >= CONFIG.minConfidenceGenerated) {
          Object.assign(result, generated);
          result.method = 'generated';
          return finalize(result);
        }
      }
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

async function tryGenerated(text, generator) {
  try {
    const generated = generator.generate(text);
    if (generated && !generated.translation.includes('[')) {
      return {
        translation: generated.translation,
        confidence: generated.confidence,
        source: 'grammar_generator',
        analysis: generated.analysis
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
    engine: 'Guinius v2',
    version: '2.0-alpha',
    capabilities: {
      exactCorpusMatch: true,
      fuzzyCorpusMatch: true,
      grammarGeneration: !!getSentenceGenerator(),
      googleTranslate: !!CONFIG.googleApiKey,
      frenchBridge: !!getFallbackSystem(),
      conversationTracking: !!getConversationModule(),
      gapTracking: CONFIG.trackGaps
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
