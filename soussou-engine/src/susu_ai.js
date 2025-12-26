/**
 * SUSU AI - Unified Translation Engine
 *
 * Features:
 * - 31,829 parallel sentences (Bible + SMOL)
 * - 4,001 word/phrase translations (GATITOS + conversational)
 * - Morphological analysis for unknown words
 * - Sentence parsing with native speaker rules
 * - Google Translate API fallback & verification
 *
 * Usage:
 *   const susuAI = require('./susu_ai');
 *   await susuAI.translate('Hello, how are you?');
 *   await susuAI.translate('Tanàmoufègnê', { from: 'susu' });
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

// Import our modules
const { loadIndex } = require('./data_integrator');
const { parseSentence, quickParse, FIXED_EXPRESSIONS } = require('./sentence_parser');
const { analyzeWord, normalizeSpelling } = require('./morphology_analyzer');
const { conjugate, makeSentence, VERBS } = require('./verb_conjugator');

// ============================================================================
// CONFIGURATION
// ============================================================================

const DATA_DIR = path.join(__dirname, '..', 'data');
const INDEX_PATH = path.join(DATA_DIR, 'unified_index.json');

let INDEX = null;  // Lazy loaded

const CONFIG = {
  googleApiKey: process.env.GOOGLE_TRANSLATE_API_KEY || null,
  useGoogleFallback: true,
  fuzzyMatchThreshold: 0.6,
  maxSentenceResults: 5,
};

// ============================================================================
// INDEX LOADING
// ============================================================================

function getIndex() {
  if (!INDEX) {
    console.log('Loading Susu AI index...');
    INDEX = loadIndex(INDEX_PATH);
    if (!INDEX) {
      throw new Error('Index not found. Run: node src/data_integrator.js');
    }
    console.log(`Loaded: ${INDEX.en_to_sus.size} EN words, ${INDEX.sus_to_en.size} SUS words, ${INDEX.sentences.length} sentences`);
  }
  return INDEX;
}

// ============================================================================
// TRANSLATION FUNCTIONS
// ============================================================================

/**
 * Main translation function
 * @param {string} text - Text to translate
 * @param {Object} options - Translation options
 * @returns {Object} Translation result
 */
async function translate(text, options = {}) {
  const {
    from = 'auto',  // 'auto', 'english', 'susu'
    useGoogle = CONFIG.useGoogleFallback,
    detailed = false,
  } = options;

  const index = getIndex();
  // Strip punctuation for lookup (keep original for display)
  const normalized = text.toLowerCase().trim().replace(/[?!.,;:'"()]/g, '').trim();

  // Detect language if auto
  let sourceLang = from;
  if (from === 'auto') {
    sourceLang = detectLanguage(text, index);
  }

  const result = {
    input: text,
    sourceLang,
    translation: null,
    confidence: 0,
    source: null,
    alternatives: [],
    analysis: detailed ? {} : undefined,
  };

  if (sourceLang === 'english') {
    // English -> Susu
    const enResult = await translateEnglishToSusu(text, index, useGoogle);
    Object.assign(result, enResult);
  } else {
    // Susu -> English
    const susResult = await translateSusuToEnglish(text, index, useGoogle);
    Object.assign(result, susResult);
  }

  return result;
}

/**
 * Detect if text is English or Susu
 */
function detectLanguage(text, index) {
  const words = text.toLowerCase().split(/\s+/);
  let enScore = 0;
  let susScore = 0;

  for (const word of words) {
    if (index.en_to_sus.has(word)) enScore++;
    if (index.sus_to_en.has(word)) susScore++;
  }

  // Check for Susu-specific characters
  if (/[ɔɛɲŋ]/.test(text)) susScore += 2;

  // Check for common Susu patterns
  if (/\b(ntan|itan|atan|naxa|bara)\b/i.test(text)) susScore += 2;

  return susScore > enScore ? 'susu' : 'english';
}

/**
 * Translate English to Susu
 */
async function translateEnglishToSusu(text, index, useGoogle = true) {
  // Strip punctuation for phrase matching
  const normalized = text.toLowerCase().trim().replace(/[?!.,;:'"()]/g, '').trim();

  // 1. Check for exact phrase match
  if (index.en_to_sus.has(normalized)) {
    const matches = index.en_to_sus.get(normalized);
    // Sort by priority (0 = highest)
    matches.sort((a, b) => a.priority - b.priority);
    const best = matches[0];

    return {
      translation: best.translations[0],
      confidence: 1.0,
      source: best.source,
      alternatives: best.translations.slice(1).concat(
        matches.slice(1).flatMap(m => m.translations)
      ).slice(0, 5),
    };
  }

  // 2. Check for fixed expressions
  for (const [expr, info] of Object.entries(FIXED_EXPRESSIONS)) {
    if (normalized.includes(expr.toLowerCase())) {
      return {
        translation: info.translation,
        confidence: 0.95,
        source: 'fixed_expression',
        note: info.notes,
      };
    }
  }

  // 3. Search sentence corpus for similar sentences
  const sentenceMatch = findSimilarSentence(text, index.sentences, 'english');
  if (sentenceMatch && sentenceMatch.similarity > CONFIG.fuzzyMatchThreshold) {
    return {
      translation: sentenceMatch.susu,
      confidence: sentenceMatch.similarity,
      source: sentenceMatch.source,
      matchedSentence: sentenceMatch.english,
      alternatives: [],
    };
  }

  // 4. Try prefix matching (e.g., "my name is John" -> "N xili" + "John")
  const words = text.split(/\s+/);
  for (let prefixLen = words.length - 1; prefixLen >= 2; prefixLen--) {
    const prefixWords = words.slice(0, prefixLen);
    const suffixWords = words.slice(prefixLen);
    const prefixNorm = prefixWords.join(' ').toLowerCase().trim().replace(/[?!.,;:'"()]/g, '').trim();

    if (index.en_to_sus.has(prefixNorm)) {
      const matches = index.en_to_sus.get(prefixNorm);
      matches.sort((a, b) => a.priority - b.priority);
      const best = matches[0];
      // Combine prefix translation with remaining words (names, numbers, etc.)
      const translation = best.translations[0] + ' ' + suffixWords.join(' ');
      return {
        translation,
        confidence: 0.9,
        source: best.source + '_prefix',
        note: `Matched prefix: "${prefixWords.join(' ')}"`,
      };
    }
  }

  // 5. Word-by-word translation for short phrases
  if (words.length <= 5) {
    const wordByWord = translateWordByWord(words, index, 'en');
    if (wordByWord.translatedCount > 0) {
      return {
        translation: wordByWord.result,
        confidence: wordByWord.translatedCount / words.length,
        source: 'word_by_word',
        wordBreakdown: wordByWord.breakdown,
      };
    }
  }

  // 5. Google Translate fallback
  if (useGoogle && CONFIG.googleApiKey) {
    try {
      const googleResult = await googleTranslate(text, 'en', 'sus');
      return {
        translation: googleResult,
        confidence: 0.8,
        source: 'google_translate',
      };
    } catch (e) {
      // Continue without Google
    }
  }

  // 6. No translation found
  return {
    translation: null,
    confidence: 0,
    source: null,
    error: 'No translation found',
    suggestion: 'Try shorter phrases or individual words',
  };
}

/**
 * Translate Susu to English
 */
async function translateSusuToEnglish(text, index, useGoogle = true) {
  const normalized = normalizeSpelling(text);

  // 1. Check for fixed expressions
  for (const [expr, info] of Object.entries(FIXED_EXPRESSIONS)) {
    const normExpr = normalizeSpelling(expr);
    if (normalized.includes(normExpr)) {
      return {
        translation: info.translation,
        confidence: 1.0,
        source: 'fixed_expression',
        note: info.notes,
      };
    }
  }

  // 2. Check for exact word match
  if (index.sus_to_en.has(normalized)) {
    const matches = index.sus_to_en.get(normalized);
    matches.sort((a, b) => a.priority - b.priority);
    const best = matches[0];

    return {
      translation: best.english,
      confidence: 1.0,
      source: best.source,
      category: best.category,
      alternatives: matches.slice(1).map(m => m.english).slice(0, 5),
    };
  }

  // 3. Use sentence parser for grammar analysis
  const parsed = quickParse(text);
  if (parsed.translation && parsed.translation.length > 0) {
    return {
      translation: parsed.translation,
      confidence: parsed.complete ? 0.9 : 0.7,
      source: 'sentence_parser',
      tense: parsed.tense,
      complete: parsed.complete,
      notes: parsed.notes,
    };
  }

  // 4. Morphological analysis for unknown words
  const words = text.split(/\s+/);
  if (words.length === 1) {
    const morphAnalysis = analyzeWord(text);
    if (morphAnalysis && morphAnalysis.root) {
      // Check if root is known
      if (index.sus_to_en.has(morphAnalysis.root)) {
        const rootMatch = index.sus_to_en.get(morphAnalysis.root)[0];
        return {
          translation: rootMatch.english,
          confidence: 0.7,
          source: 'morphology',
          analysis: morphAnalysis,
        };
      }
    }
  }

  // 5. Search sentence corpus
  const sentenceMatch = findSimilarSentence(text, index.sentences, 'susu');
  if (sentenceMatch && sentenceMatch.similarity > CONFIG.fuzzyMatchThreshold) {
    return {
      translation: sentenceMatch.english,
      confidence: sentenceMatch.similarity,
      source: sentenceMatch.source,
      matchedSentence: sentenceMatch.susu,
    };
  }

  // 6. Word-by-word translation
  if (words.length <= 5) {
    const wordByWord = translateWordByWord(words, index, 'sus');
    if (wordByWord.translatedCount > 0) {
      return {
        translation: wordByWord.result,
        confidence: wordByWord.translatedCount / words.length,
        source: 'word_by_word',
        wordBreakdown: wordByWord.breakdown,
      };
    }
  }

  // 7. Google Translate fallback
  if (useGoogle && CONFIG.googleApiKey) {
    try {
      const googleResult = await googleTranslate(text, 'sus', 'en');
      return {
        translation: googleResult,
        confidence: 0.8,
        source: 'google_translate',
      };
    } catch (e) {
      // Continue without Google
    }
  }

  return {
    translation: null,
    confidence: 0,
    source: null,
    error: 'No translation found',
  };
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Find similar sentence in corpus
 */
function findSimilarSentence(text, sentences, field) {
  const textWords = new Set(text.toLowerCase().split(/\s+/));
  let bestMatch = null;
  let bestScore = 0;

  // Only search sentences of similar length (±50%)
  const textLen = textWords.size;
  const minLen = Math.floor(textLen * 0.5);
  const maxLen = Math.ceil(textLen * 1.5);

  for (const sent of sentences) {
    if (sent.length < minLen || sent.length > maxLen) continue;

    const sentText = field === 'english' ? sent.english : sent.susu;
    const sentWords = new Set(sentText.toLowerCase().split(/\s+/));

    // Jaccard similarity
    const intersection = [...textWords].filter(w => sentWords.has(w)).length;
    const union = new Set([...textWords, ...sentWords]).size;
    const similarity = intersection / union;

    if (similarity > bestScore) {
      bestScore = similarity;
      bestMatch = {
        english: sent.english,
        susu: sent.susu,
        source: sent.source,
        similarity,
      };
    }
  }

  return bestMatch;
}

/**
 * Word-by-word translation
 */
function translateWordByWord(words, index, fromLang) {
  const breakdown = [];
  let translatedCount = 0;

  for (const word of words) {
    const normalized = word.toLowerCase();
    let translated = null;

    if (fromLang === 'en') {
      if (index.en_to_sus.has(normalized)) {
        translated = index.en_to_sus.get(normalized)[0].translations[0];
        translatedCount++;
      }
    } else {
      const normSus = normalizeSpelling(word);
      if (index.sus_to_en.has(normSus)) {
        translated = index.sus_to_en.get(normSus)[0].english;
        translatedCount++;
      }
    }

    breakdown.push({
      original: word,
      translated: translated || `[${word}]`,
      found: !!translated,
    });
  }

  return {
    result: breakdown.map(b => b.translated).join(' '),
    breakdown,
    translatedCount,
  };
}

// ============================================================================
// GOOGLE TRANSLATE API
// ============================================================================

/**
 * Call Google Translate API
 */
async function googleTranslate(text, sourceLang, targetLang) {
  if (!CONFIG.googleApiKey) {
    throw new Error('GOOGLE_TRANSLATE_API_KEY not set');
  }

  const url = `https://translation.googleapis.com/language/translate/v2?key=${CONFIG.googleApiKey}`;

  const data = JSON.stringify({
    q: text,
    source: sourceLang,
    target: targetLang,
    format: 'text'
  });

  return new Promise((resolve, reject) => {
    const req = https.request(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data)
      }
    }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(body);
          if (json.error) {
            reject(new Error(json.error.message));
          } else {
            resolve(json.data.translations[0].translatedText);
          }
        } catch (e) {
          reject(e);
        }
      });
    });

    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

/**
 * Verify our translation against Google's
 */
async function verifyWithGoogle(text, ourTranslation, sourceLang = 'en') {
  if (!CONFIG.googleApiKey) {
    return { verified: false, reason: 'No API key' };
  }

  try {
    const targetLang = sourceLang === 'en' ? 'sus' : 'en';
    const googleTranslation = await googleTranslate(text, sourceLang, targetLang);

    // Calculate similarity
    const ourWords = new Set(ourTranslation.toLowerCase().split(/\s+/));
    const googleWords = new Set(googleTranslation.toLowerCase().split(/\s+/));
    const intersection = [...ourWords].filter(w => googleWords.has(w)).length;
    const union = new Set([...ourWords, ...googleWords]).size;
    const similarity = intersection / union;

    return {
      verified: true,
      ourTranslation,
      googleTranslation,
      similarity,
      match: similarity > 0.5,
    };
  } catch (e) {
    return { verified: false, reason: e.message };
  }
}

// ============================================================================
// CONVENIENCE FUNCTIONS
// ============================================================================

/**
 * Quick English to Susu
 */
async function toSusu(text) {
  const result = await translate(text, { from: 'english' });
  return result.translation;
}

/**
 * Quick Susu to English
 */
async function toEnglish(text) {
  const result = await translate(text, { from: 'susu' });
  return result.translation;
}

/**
 * Get word definition
 */
function lookup(word) {
  const index = getIndex();
  const normalized = word.toLowerCase().trim();

  // Try English
  if (index.en_to_sus.has(normalized)) {
    return {
      word,
      language: 'english',
      translations: index.en_to_sus.get(normalized),
    };
  }

  // Try Susu
  const normSus = normalizeSpelling(word);
  if (index.sus_to_en.has(normSus)) {
    return {
      word,
      language: 'susu',
      translations: index.sus_to_en.get(normSus),
    };
  }

  return null;
}

/**
 * Get statistics
 */
function getStats() {
  const index = getIndex();
  return {
    englishWords: index.en_to_sus.size,
    susuWords: index.sus_to_en.size,
    sentences: index.sentences.length,
    sources: index.stats.sources,
    googleApiConfigured: !!CONFIG.googleApiKey,
    created: index.created,
  };
}

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = {
  translate,
  toSusu,
  toEnglish,
  lookup,
  getStats,
  verifyWithGoogle,
  googleTranslate,
  detectLanguage,
  CONFIG,
  getIndex,
};

// ============================================================================
// CLI
// ============================================================================

if (require.main === module) {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log('=== SUSU AI ===\n');
    console.log(getStats());
    console.log('\nUsage:');
    console.log('  node susu_ai.js "Hello, how are you?"     # Translate to Susu');
    console.log('  node susu_ai.js --from-susu "Tanàmoufègnê"  # Translate to English');
    console.log('  node susu_ai.js --lookup "love"           # Word lookup');
    process.exit(0);
  }

  (async () => {
    try {
      if (args[0] === '--lookup') {
        const result = lookup(args.slice(1).join(' '));
        console.log(JSON.stringify(result, null, 2));
      } else if (args[0] === '--from-susu') {
        const result = await translate(args.slice(1).join(' '), { from: 'susu' });
        console.log(`Susu: ${result.input}`);
        console.log(`English: ${result.translation}`);
        console.log(`Confidence: ${(result.confidence * 100).toFixed(0)}%`);
        console.log(`Source: ${result.source}`);
      } else if (args[0] === '--stats') {
        console.log(JSON.stringify(getStats(), null, 2));
      } else {
        const text = args.join(' ');
        const result = await translate(text);
        console.log(`Input: ${result.input}`);
        console.log(`Detected: ${result.sourceLang}`);
        console.log(`Translation: ${result.translation}`);
        console.log(`Confidence: ${(result.confidence * 100).toFixed(0)}%`);
        console.log(`Source: ${result.source}`);
        if (result.alternatives?.length > 0) {
          console.log(`Alternatives: ${result.alternatives.join(', ')}`);
        }
        if (result.notes?.length > 0) {
          console.log(`Notes: ${result.notes.join('; ')}`);
        }
      }
    } catch (e) {
      console.error('Error:', e.message);
    }
  })();
}
