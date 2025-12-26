/**
 * Fallback System - French/English Gap Filling for Susu
 *
 * When Susu translation is unavailable or low-confidence,
 * this module provides intelligent fallbacks:
 * 1. Try French (many Susu speakers know French - Guinea's official language)
 * 2. Fall back to English if French unavailable
 * 3. Mark gaps for human contribution
 *
 * Goal: No conversation should break due to missing translations
 */

const https = require('https');
const path = require('path');
const fs = require('fs');

// Google API key for translation
const API_KEY = 'AIzaSyCV-1WfnuFLmxw5ib_fuVcO2KLGjUXLpuk';

// Gap tracking - words/phrases that need human contribution
const GAP_FILE = path.join(__dirname, '..', 'data', 'translation_gaps.json');

let gaps = {
  words: {},      // word -> { count, contexts }
  phrases: {},    // phrase -> { count, contexts }
  lastUpdated: null
};

// Load existing gaps
function loadGaps() {
  try {
    if (fs.existsSync(GAP_FILE)) {
      gaps = JSON.parse(fs.readFileSync(GAP_FILE, 'utf-8'));
    }
  } catch (e) {
    console.warn('Could not load gaps file:', e.message);
  }
}

// Save gaps
function saveGaps() {
  gaps.lastUpdated = new Date().toISOString();
  try {
    fs.writeFileSync(GAP_FILE, JSON.stringify(gaps, null, 2));
  } catch (e) {
    console.warn('Could not save gaps file:', e.message);
  }
}

// Record a translation gap
function recordGap(text, type = 'word', context = '') {
  const key = text.toLowerCase().trim();
  const collection = type === 'word' ? gaps.words : gaps.phrases;

  if (!collection[key]) {
    collection[key] = { count: 0, contexts: [], firstSeen: new Date().toISOString() };
  }

  collection[key].count++;
  if (context && collection[key].contexts.length < 5) {
    collection[key].contexts.push(context);
  }

  // Auto-save every 10 gaps
  if ((gaps.words.length + gaps.phrases.length) % 10 === 0) {
    saveGaps();
  }
}

/**
 * Translate to French using Google Translate
 */
async function translateToFrench(text, from = 'en') {
  return new Promise((resolve, reject) => {
    const url = `https://translation.googleapis.com/language/translate/v2?key=${API_KEY}`;
    const postData = JSON.stringify({
      q: text,
      source: from,
      target: 'fr',
      format: 'text'
    });

    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = https.request(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          if (result.data?.translations?.[0]) {
            resolve(result.data.translations[0].translatedText);
          } else {
            resolve(null);
          }
        } catch (e) {
          reject(e);
        }
      });
    });

    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

/**
 * Translate from French to Susu
 */
async function translateFrenchToSusu(text) {
  return new Promise((resolve, reject) => {
    const url = `https://translation.googleapis.com/language/translate/v2?key=${API_KEY}`;
    const postData = JSON.stringify({
      q: text,
      source: 'fr',
      target: 'sus',
      format: 'text'
    });

    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = https.request(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          if (result.data?.translations?.[0]) {
            resolve(result.data.translations[0].translatedText);
          } else {
            resolve(null);
          }
        } catch (e) {
          reject(e);
        }
      });
    });

    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

/**
 * Get fallback translation with language cascade
 * Priority: Susu > French (if speaker knows it) > English
 *
 * @param {Object} primaryResult - Result from Guinius translate
 * @param {string} originalText - Original input text
 * @param {Object} options - Options
 * @returns {Object} Enhanced result with fallback if needed
 */
async function getFallback(primaryResult, originalText, options = {}) {
  const {
    minConfidence = 0.5,
    userLanguage = 'en',  // User's interface language
    includeAlternatives = true
  } = options;

  const result = {
    ...primaryResult,
    fallback: null,
    fallbackLanguage: null,
    needsHumanReview: false,
    gaps: []
  };

  // If primary translation is good enough, return as-is
  if (primaryResult.confidence >= minConfidence && primaryResult.translation) {
    return result;
  }

  // Check for untranslated words (marked with [])
  const untranslated = (primaryResult.translation || '')
    .match(/\[([^\]]+)\]/g) || [];

  if (untranslated.length > 0) {
    result.gaps = untranslated.map(w => w.replace(/[\[\]]/g, ''));

    // Record gaps for human contribution
    for (const word of result.gaps) {
      recordGap(word, 'word', originalText);
    }
  }

  // Try French as bridge language
  try {
    // First translate to French
    const frenchVersion = await translateToFrench(originalText, userLanguage);

    if (frenchVersion) {
      // Then try French -> Susu
      const susuFromFrench = await translateFrenchToSusu(frenchVersion);

      if (susuFromFrench) {
        result.fallback = {
          susu: susuFromFrench,
          french: frenchVersion,
          confidence: 0.6,  // Via French is medium confidence
          method: 'french_bridge'
        };
        result.fallbackLanguage = 'french';
      } else {
        // Keep French as fallback (many Susu speakers know French)
        result.fallback = {
          french: frenchVersion,
          confidence: 0.4,
          method: 'french_only'
        };
        result.fallbackLanguage = 'french';
      }
    }
  } catch (e) {
    console.warn('French fallback failed:', e.message);
  }

  // If still no good translation, mark for human review
  if (!result.translation || result.confidence < 0.3) {
    result.needsHumanReview = true;
    recordGap(originalText, 'phrase', '');
  }

  return result;
}

/**
 * Format response for user with appropriate fallback display
 */
function formatResponse(result, options = {}) {
  const { showFallback = true, showGaps = true } = options;

  let output = result.translation || '';

  if (result.fallback && showFallback) {
    if (result.fallback.french && !result.fallback.susu) {
      // French only - show with indicator
      output = `${result.translation || ''} (FR: ${result.fallback.french})`;
    }
  }

  if (result.gaps && result.gaps.length > 0 && showGaps) {
    output += ` [Missing: ${result.gaps.join(', ')}]`;
  }

  return output;
}

/**
 * Get statistics about translation gaps
 */
function getGapStats() {
  loadGaps();

  const wordGaps = Object.entries(gaps.words)
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 20);

  const phraseGaps = Object.entries(gaps.phrases)
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 20);

  return {
    totalWordGaps: Object.keys(gaps.words).length,
    totalPhraseGaps: Object.keys(gaps.phrases).length,
    topMissingWords: wordGaps,
    topMissingPhrases: phraseGaps,
    lastUpdated: gaps.lastUpdated
  };
}

/**
 * Export gaps for human contribution
 */
function exportGapsForContribution() {
  loadGaps();

  const forContribution = {
    instructions: 'Please provide Susu translations for these words and phrases',
    lastExported: new Date().toISOString(),
    words: Object.entries(gaps.words)
      .map(([word, data]) => ({
        english: word,
        susu: '',  // To be filled in
        count: data.count,
        examples: data.contexts.slice(0, 2)
      }))
      .sort((a, b) => b.count - a.count),
    phrases: Object.entries(gaps.phrases)
      .map(([phrase, data]) => ({
        english: phrase,
        susu: '',  // To be filled in
        count: data.count
      }))
      .sort((a, b) => b.count - a.count)
  };

  const exportPath = path.join(__dirname, '..', 'data', 'gaps_for_contribution.json');
  fs.writeFileSync(exportPath, JSON.stringify(forContribution, null, 2));

  return exportPath;
}

/**
 * Import human contributions
 */
function importContributions(filePath) {
  try {
    const contributions = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    let imported = 0;

    // This would integrate with the corpus
    // For now, just validate format
    if (contributions.words) {
      for (const entry of contributions.words) {
        if (entry.english && entry.susu) {
          imported++;
          // TODO: Add to conversational_susu.json
        }
      }
    }

    if (contributions.phrases) {
      for (const entry of contributions.phrases) {
        if (entry.english && entry.susu) {
          imported++;
          // TODO: Add to conversational_susu.json
        }
      }
    }

    return { success: true, imported };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

// Initialize
loadGaps();

module.exports = {
  getFallback,
  formatResponse,
  recordGap,
  getGapStats,
  exportGapsForContribution,
  importContributions,
  translateToFrench,
  translateFrenchToSusu,

  // For testing
  test: async () => {
    console.log('=== Fallback System Test ===\n');

    const testCases = [
      { text: 'Hello', confidence: 1.0, translation: 'inou wali' },
      { text: 'quantum physics', confidence: 0.1, translation: '[quantum] [physics]' },
      { text: 'I need a doctor', confidence: 0.3, translation: 'N hayi na [doctor]' }
    ];

    for (const testCase of testCases) {
      console.log(`\nOriginal: "${testCase.text}"`);
      console.log(`Primary: "${testCase.translation}" (${testCase.confidence * 100}%)`);

      const enhanced = await getFallback(testCase, testCase.text);
      console.log('Enhanced:', JSON.stringify(enhanced, null, 2));
    }

    console.log('\n--- Gap Statistics ---');
    console.log(getGapStats());
  }
};

// CLI test
if (require.main === module) {
  module.exports.test().catch(console.error);
}
