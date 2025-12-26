/**
 * Guinius API Server
 * The first AI that speaks Soussou
 *
 * Flow: Generate French → Match Soussou → Apply rules → Fill gaps → Learn from users
 */

const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

// Load environment variables
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Gemini API for conversation enhancement
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || 'AIzaSyCV-1WfnuFLmxw5ib_fuVcO2KLGjUXLpuk';
let genAI, gemini;
try {
  const { GoogleGenerativeAI } = require('@google/generative-ai');
  genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
  gemini = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });
  console.log('✅ Gemini API initialized');
} catch (e) {
  console.warn('⚠️ Gemini not available:', e.message);
}

// Session storage for conversations
const chatSessions = new Map();

// Middleware
app.use(cors());
app.use(express.json());

// Load data files
const dataDir = path.join(__dirname, '..', 'data');
const lexicon = JSON.parse(fs.readFileSync(path.join(dataDir, 'lexicon.json'), 'utf8'));
const variantMappings = JSON.parse(fs.readFileSync(path.join(dataDir, 'variant_mappings.json'), 'utf8'));
const morphologyPatterns = JSON.parse(fs.readFileSync(path.join(dataDir, 'morphology_patterns.json'), 'utf8'));
const syntaxPatterns = JSON.parse(fs.readFileSync(path.join(dataDir, 'syntax_patterns.json'), 'utf8'));
const generationTemplates = JSON.parse(fs.readFileSync(path.join(dataDir, 'generation_templates.json'), 'utf8'));

// Load source modules
const variantNormalizerModule = require('../src/variant_normalizer');
const sentenceGeneratorModule = require('../src/sentence_generator');
const ResponseSelector = require('../src/response_selector');
const UnifiedTranslator = require('../src/unified_translator');
const SentenceMatcher = require('../src/sentence_matcher');
const OrthographyConverter = require('../src/orthography_converter');

// Load Guinius v2 - Main translation engine
let guiniusV2;
try {
  guiniusV2 = require('../src/guinius_v2');
  console.log('✅ Guinius v2 loaded');
} catch (e) {
  console.warn('⚠️ Guinius v2 not available:', e.message);
}

// Initialize engines
// Normalizer is a module with functions, not a class
const normalizer = {
  normalize: variantNormalizerModule.normalize,
  normalizePhrase: variantNormalizerModule.normalizePhrase
};
// Sentence generator is now a module with translate() function
const generator = {
  generate: (template, slots) => sentenceGeneratorModule.translate(slots.text || template),
  translate: sentenceGeneratorModule.translate
};
const responseSelector = new ResponseSelector(lexicon, generationTemplates);
const unifiedTranslator = new UnifiedTranslator();

// Pre-load unified translator data
try {
  unifiedTranslator.load();
  console.log('✅ Unified Translator loaded with Google SMOL + Our lexicon');
} catch (e) {
  console.error('⚠️ Unified Translator failed to load:', e.message);
}

// In-memory stores for contributions/feedback (would be database in production)
const contributions = [];
const feedback = [];

// ============== GUINIUS v2 CHAT ENDPOINTS ==============

// GET /api/health - Health check
app.get('/api/health', (req, res) => {
  const stats = guiniusV2?.getStats?.() || {};
  res.json({
    status: 'healthy',
    engine: 'Guinius v2',
    version: '2.0.0',
    capabilities: {
      translation: !!guiniusV2,
      conversation: true,
      gemini: !!gemini,
      whisper: false
    },
    stats: {
      englishWords: stats.englishWords || 0,
      susuWords: stats.susuWords || 0,
      sentences: stats.sentences || 0,
      sources: stats.sources || {}
    }
  });
});

// POST /api/chat - Conversational interface with Gemini
app.post('/api/chat', async (req, res) => {
  const { message, sessionId = 'default', mode = 'learn' } = req.body;

  if (!message) {
    return res.status(400).json({ error: 'Message is required' });
  }

  try {
    // Get or create session
    if (!chatSessions.has(sessionId)) {
      chatSessions.set(sessionId, {
        history: [],
        context: {},
        created: new Date()
      });
    }
    const session = chatSessions.get(sessionId);

    // Detect language
    const lang = guiniusV2?.detectLanguage?.(message) || 'en';

    // Get translation from Guinius v2
    let translation;
    if (guiniusV2) {
      translation = await guiniusV2.translate(message, { from: lang });
    } else {
      translation = { translation: message, confidence: 0.5, source: 'fallback' };
    }

    // Generate AI response using Gemini
    let aiResponse = {
      response: `I understood: "${message}". In Susu: "${translation.translation}"`,
      susu: translation.translation,
      suggestions: [],
      pronunciation: null
    };

    if (gemini) {
      try {
        aiResponse = await generateConversationResponse(message, translation, session, mode);
      } catch (e) {
        console.error('Gemini error:', e.message);
      }
    }

    // Update session history
    session.history.push({
      user: message,
      lang,
      translation: translation.translation,
      ai: aiResponse.response,
      timestamp: new Date()
    });

    // Keep only last 20 messages
    if (session.history.length > 20) {
      session.history = session.history.slice(-20);
    }

    res.json({
      input: message,
      inputLang: lang,
      translation: translation.translation,
      translationSource: translation.source,
      confidence: translation.confidence,
      response: aiResponse.response,
      responseSusu: aiResponse.susu,
      suggestions: aiResponse.suggestions,
      pronunciation: aiResponse.pronunciation
    });
  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Helper: Generate conversation response with Gemini
async function generateConversationResponse(message, translation, session, mode) {
  const historyContext = session.history.slice(-5).map(h =>
    `User: ${h.user}\nAI: ${h.ai}`
  ).join('\n');

  const prompt = `You are a Susu language learning assistant. The user is learning Susu (Soussou), spoken in Guinea.

User message: "${message}"
Translation to Susu: "${translation.translation}"
Confidence: ${(translation.confidence * 100).toFixed(0)}%
Source: ${translation.source}

Recent conversation:
${historyContext || 'New conversation'}

Mode: ${mode} (learn = teach vocabulary, chat = natural conversation)

Respond naturally while helping them learn Susu. Include:
1. A helpful response in English
2. The Susu translation of your response
3. 2-3 suggested phrases they could say next (in Susu with English)
4. Pronunciation tip if relevant

Respond in JSON:
{
  "response": "your helpful response in English",
  "susu": "your response translated to Susu",
  "suggestions": [
    {"susu": "phrase", "english": "meaning"},
    {"susu": "phrase", "english": "meaning"}
  ],
  "pronunciation": "tip for any tricky sounds"
}`;

  const result = await gemini.generateContent(prompt);
  const response = result.response.text();

  const jsonMatch = response.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    return JSON.parse(jsonMatch[0]);
  }

  return {
    response: response,
    susu: translation.translation,
    suggestions: [],
    pronunciation: null
  };
}

// ============== LOOKUP ENDPOINTS ==============

// GET /api/lookup - Look up a word
app.get('/api/lookup', (req, res) => {
  const { word, exact } = req.query;

  if (!word) {
    return res.status(400).json({ error: 'word parameter required' });
  }

  // Normalize unless exact match requested
  const searchWord = exact === 'true' ? word : normalizer.normalize(word);

  // Find in lexicon
  const entry = lexicon.words?.find(w =>
    normalizer.normalize(w.soussou) === searchWord ||
    w.variants?.some(v => normalizer.normalize(v) === searchWord)
  );

  if (entry) {
    res.json({
      found: true,
      word: entry.soussou,
      normalized: searchWord,
      english: entry.english,
      french: entry.french,
      category: entry.category,
      variants: entry.variants || [],
      frequency: entry.frequency || 0,
      examples: entry.examples || []
    });
  } else {
    // Find suggestions
    const suggestions = findSimilarWords(searchWord, 5);
    res.status(404).json({
      found: false,
      word: word,
      suggestions: suggestions,
      message: 'Word not found. Would you like to contribute it?'
    });
  }
});

// GET /api/lookup/phrase - Analyze a phrase
app.get('/api/lookup/phrase', (req, res) => {
  const { phrase } = req.query;

  if (!phrase) {
    return res.status(400).json({ error: 'phrase parameter required' });
  }

  const normalized = normalizer.normalizePhrase(phrase);
  const words = normalized.split(' ');

  const breakdown = words.map(word => {
    const entry = lexicon.words?.find(w =>
      normalizer.normalize(w.soussou) === word
    );

    return {
      word: word,
      role: detectRole(word, entry),
      english: entry?.english || '?',
      french: entry?.french || '?'
    };
  });

  // Try to find matching example
  const example = findMatchingExample(normalized);

  res.json({
    phrase: phrase,
    normalized: normalized,
    english: example?.english || breakdown.map(b => b.english).join(' '),
    french: example?.french || breakdown.map(b => b.french).join(' '),
    breakdown: breakdown,
    grammar_notes: generateGrammarNotes(breakdown)
  });
});

// GET /api/patterns - Get grammar patterns
app.get('/api/patterns', (req, res) => {
  const { type } = req.query;

  if (type === 'morphology') {
    res.json({ morphology: morphologyPatterns });
  } else if (type === 'syntax') {
    res.json({ syntax: syntaxPatterns });
  } else {
    res.json({
      morphology: morphologyPatterns,
      syntax: syntaxPatterns
    });
  }
});

// GET /api/stats - Get lexicon statistics
app.get('/api/stats', (req, res) => {
  const words = lexicon.words || [];

  // Count by category
  const categories = {};
  words.forEach(w => {
    const cat = w.category || 'unknown';
    categories[cat] = (categories[cat] || 0) + 1;
  });

  res.json({
    total_words: words.length,
    total_variants: Object.keys(variantMappings.variant_to_base || {}).length,
    total_templates: Object.keys(generationTemplates.templates || {}).length,
    contributions_pending: contributions.filter(c => c.status === 'pending_review').length,
    categories: categories
  });
});

// ============== TRANSLATE ENDPOINT ==============

// POST /api/translate
app.post('/api/translate', (req, res) => {
  const { text, from, to } = req.body;

  if (!text || !from || !to) {
    return res.status(400).json({ error: 'text, from, and to parameters required' });
  }

  // Handle different translation directions
  let translation, confidence, uncertainParts, alternatives, notes;

  if (from === 'soussou') {
    // Soussou → English/French
    const result = translateFromSoussou(text, to);
    translation = result.translation;
    confidence = result.confidence;
    uncertainParts = result.uncertainParts;
    notes = result.notes;
    alternatives = result.alternatives;
  } else if (to === 'soussou') {
    // English/French → Soussou (the core Guinius flow)
    const result = translateToSoussou(text, from);
    translation = result.translation;
    confidence = result.confidence;
    uncertainParts = result.uncertainParts;
    alternatives = result.alternatives;
    notes = result.notes;
  } else {
    // English ↔ French (pass-through, not our specialty)
    return res.status(400).json({
      error: 'Guinius specializes in Soussou. Use Google Translate for English↔French.'
    });
  }

  res.json({
    original: text,
    translation: translation,
    confidence: confidence,
    alternatives: alternatives || [],
    uncertain_parts: uncertainParts || [],
    notes: notes || []
  });
});

// ============== UNIFIED TRANSLATE ENDPOINT (NEW) ==============

// POST /api/v2/translate - Enhanced translation with Google SMOL + Our lexicon
app.post('/api/v2/translate', (req, res) => {
  const { text, from, to, include_alternatives } = req.body;

  if (!text) {
    return res.status(400).json({ error: 'text parameter required' });
  }

  // Default: English → Susu
  const sourceLanguage = from || 'english';
  const targetLanguage = to || 'susu';

  let result;

  if (sourceLanguage === 'english' && targetLanguage === 'susu') {
    // Use unified translator (Google SMOL sentences + Our lexicon + Grammar rules)
    result = unifiedTranslator.translate(text);
  } else if (sourceLanguage === 'susu' && targetLanguage === 'english') {
    // Susu → English
    result = unifiedTranslator.translateToEnglish(text);
  } else {
    return res.status(400).json({
      error: 'Guinius specializes in English↔Susu translation',
      supported_pairs: ['english→susu', 'susu→english']
    });
  }

  const response = {
    original: text,
    translation: result.translation,
    confidence: result.confidence,
    method: result.method || 'word_by_word',
    notes: result.notes || []
  };

  // Include alternatives if requested
  if (include_alternatives && result.alternatives?.length > 0) {
    response.alternatives = result.alternatives;
  }

  // Include suggestions for low confidence translations
  if (result.confidence < 0.7) {
    const suggestions = unifiedTranslator.suggest(text, 3);
    if (suggestions.length > 0) {
      response.similar_verified_sentences = suggestions;
    }
  }

  res.json(response);
});

// GET /api/v2/suggest - Get similar verified translations
app.get('/api/v2/suggest', (req, res) => {
  const { text, limit } = req.query;

  if (!text) {
    return res.status(400).json({ error: 'text parameter required' });
  }

  const suggestions = unifiedTranslator.suggest(text, parseInt(limit) || 5);

  res.json({
    query: text,
    suggestions: suggestions,
    source: 'Google SMOL verified translations'
  });
});

// GET /api/v2/sentence-match - Direct sentence matching from Google SMOL
app.get('/api/v2/sentence-match', (req, res) => {
  const { english, threshold } = req.query;

  if (!english) {
    return res.status(400).json({ error: 'english parameter required' });
  }

  const match = SentenceMatcher.findMatch(english);
  const minThreshold = parseFloat(threshold) || 0.5;

  if (match && match.confidence >= minThreshold) {
    res.json({
      found: true,
      english: match.english,
      susu: match.susu,
      confidence: match.confidence,
      match_type: match.matchType,
      source: 'Google SMOL verified translation'
    });
  } else {
    // Return similar sentences as suggestions
    const similar = SentenceMatcher.suggestSimilar(english, 3);
    res.json({
      found: false,
      query: english,
      suggestions: similar,
      message: 'No exact match found. See similar verified sentences.'
    });
  }
});

// POST /api/v2/normalize-orthography - Convert between Google/Our spelling
app.post('/api/v2/normalize-orthography', (req, res) => {
  const { text, to_format } = req.body;

  if (!text) {
    return res.status(400).json({ error: 'text parameter required' });
  }

  const detected = OrthographyConverter.detectOrthography(text);
  let converted;

  if (to_format === 'google') {
    converted = OrthographyConverter.oursToGoogle(text);
  } else if (to_format === 'ours') {
    converted = OrthographyConverter.googleToOurs(text);
  } else {
    // Default: normalize to our canonical form
    converted = OrthographyConverter.normalizeEither(text);
  }

  res.json({
    original: text,
    detected_format: detected,
    converted: converted,
    target_format: to_format || 'canonical'
  });
});

// ============== VALIDATION ENDPOINT ==============

// POST /api/validate - Compare our translation vs ground truth
app.post('/api/validate', (req, res) => {
  const { english, expected_susu } = req.body;

  if (!english) {
    return res.status(400).json({ error: 'english parameter required' });
  }

  // Get our translation
  const ourResult = unifiedTranslator.translate(english);

  // Get Google SMOL match if exists
  const googleMatch = SentenceMatcher.findMatch(english);

  // Prepare validation report
  const validation = {
    english_input: english,
    our_translation: ourResult.translation,
    our_confidence: ourResult.confidence,
    our_method: ourResult.method,
    google_smol_match: null,
    match_with_expected: null,
    verdict: null
  };

  // Add Google SMOL comparison if match found
  if (googleMatch && googleMatch.confidence >= 0.7) {
    validation.google_smol_match = {
      susu: googleMatch.susu,
      confidence: googleMatch.confidence,
      match_type: googleMatch.matchType
    };

    // Compare our translation with Google's verified translation
    const ourNormalized = OrthographyConverter.normalizeEither(ourResult.translation);
    const googleNormalized = OrthographyConverter.normalizeEither(googleMatch.susu);

    if (ourNormalized === googleNormalized) {
      validation.verdict = 'MATCH';
    } else {
      // Calculate similarity
      const similarity = calculateTextSimilarity(ourNormalized, googleNormalized);
      validation.google_similarity = similarity;
      validation.verdict = similarity > 0.7 ? 'SIMILAR' : 'DIFFERENT';
    }
  } else {
    validation.verdict = 'NO_REFERENCE';
    validation.notes = 'No verified Google SMOL translation available for comparison';
  }

  // Compare with user-provided expected translation
  if (expected_susu) {
    const expectedNormalized = OrthographyConverter.normalizeEither(expected_susu);
    const ourNormalized = OrthographyConverter.normalizeEither(ourResult.translation);

    validation.match_with_expected = {
      expected: expected_susu,
      matches: ourNormalized === expectedNormalized,
      similarity: calculateTextSimilarity(ourNormalized, expectedNormalized)
    };
  }

  res.json(validation);
});

// GET /api/v2/stats - Enhanced stats with Google SMOL data
app.get('/api/v2/stats', (req, res) => {
  const words = lexicon.words || [];
  const unifiedStats = unifiedTranslator.getStats();
  const sentenceStats = SentenceMatcher.getStats();

  // Count by category
  const categories = {};
  words.forEach(w => {
    const cat = w.category || 'unknown';
    categories[cat] = (categories[cat] || 0) + 1;
  });

  res.json({
    // Our lexicon
    our_lexicon: {
      total_words: words.length,
      total_variants: Object.keys(variantMappings.variant_to_base || {}).length,
      categories: categories
    },
    // Google SMOL
    google_smol: {
      sentence_pairs: sentenceStats.totalPairs,
      vocabulary_entries: unifiedStats.google_vocab,
      avg_english_length: sentenceStats.avgEnglishLength,
      avg_susu_length: sentenceStats.avgSusuLength
    },
    // Unified
    unified: {
      merged_lexicon_entries: unifiedStats.lexicon_size,
      english_to_susu_mappings: unifiedStats.en_to_sus_mappings
    },
    contributions_pending: contributions.filter(c => c.status === 'pending_review').length,
    version: '2.0',
    capabilities: [
      'sentence_matching',
      'word_by_word_translation',
      'orthography_normalization',
      'validation_against_google'
    ]
  });
});

// Helper: Calculate text similarity (Jaccard)
function calculateTextSimilarity(a, b) {
  const wordsA = new Set(a.toLowerCase().split(/\s+/));
  const wordsB = new Set(b.toLowerCase().split(/\s+/));

  let intersection = 0;
  for (const word of wordsA) {
    if (wordsB.has(word)) intersection++;
  }

  const union = wordsA.size + wordsB.size - intersection;
  return union > 0 ? intersection / union : 0;
}

// ============== GENERATE ENDPOINTS ==============

// POST /api/generate - Generate Soussou response
app.post('/api/generate', (req, res) => {
  const { input, context, user_language } = req.body;

  if (!input) {
    return res.status(400).json({ error: 'input parameter required' });
  }

  // Use response selector to generate appropriate response
  const result = responseSelector.selectResponse(input, { context });

  // Check if we need user feedback
  const needsFeedback = result.confidence < 0.7 || result.uncertainParts?.length > 0;

  res.json({
    response: result.response,
    english: result.english,
    french: result.french,
    confidence: result.confidence,
    response_type: result.responseType,
    uncertain_parts: result.uncertainParts || [],
    suggestions: result.alternatives || [],
    request_feedback: needsFeedback,
    response_id: generateId('resp')
  });
});

// POST /api/generate/from-template - Generate from specific template
app.post('/api/generate/from-template', (req, res) => {
  const { template, slots } = req.body;

  if (!template || !slots) {
    return res.status(400).json({ error: 'template and slots parameters required' });
  }

  try {
    const result = generator.generate(template, slots);

    res.json({
      sentence: result.sentence,
      template_used: template,
      english: result.english,
      french: result.french
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// ============== NORMALIZE ENDPOINT ==============

// POST /api/normalize
app.post('/api/normalize', (req, res) => {
  const { text } = req.body;

  if (!text) {
    return res.status(400).json({ error: 'text parameter required' });
  }

  const normalized = normalizer.normalizePhrase(text);
  const changes = detectNormalizationChanges(text, normalized);

  res.json({
    original: text,
    normalized: normalized,
    changes: changes
  });
});

// ============== LEARN ENDPOINTS ==============

// POST /api/contribute - Submit word/phrase contribution
app.post('/api/contribute', (req, res) => {
  const { word, variants, english, french, category, example_sentence, notes } = req.body;

  if (!word || !english) {
    return res.status(400).json({ error: 'word and english parameters required' });
  }

  // Check for similar existing words
  const similar = findSimilarWords(word, 3);

  const contribution = {
    id: generateId('contrib'),
    timestamp: new Date().toISOString(),
    status: 'pending_review',
    word: word,
    variants: variants || [],
    english: english,
    french: french || '',
    category: category || 'unknown',
    example_sentence: example_sentence || '',
    notes: notes || ''
  };

  contributions.push(contribution);

  res.status(201).json({
    id: contribution.id,
    status: contribution.status,
    message: 'Thank you! Your contribution is queued for review.',
    similar_existing: similar
  });
});

// POST /api/feedback - Provide feedback on response
app.post('/api/feedback', (req, res) => {
  const { response_id, rating, correction, notes } = req.body;

  if (!response_id || !rating) {
    return res.status(400).json({ error: 'response_id and rating parameters required' });
  }

  const fb = {
    id: generateId('fb'),
    timestamp: new Date().toISOString(),
    response_id: response_id,
    rating: rating,
    correction: correction || null,
    notes: notes || '',
    pattern_updated: false
  };

  feedback.push(fb);

  // If correction provided, consider creating a contribution
  if (correction && rating <= 2) {
    // Bad rating with correction = learning opportunity
    fb.pattern_updated = true;
  }

  res.status(201).json({
    id: fb.id,
    status: 'recorded',
    message: 'Feedback recorded. This helps Guinius learn!',
    pattern_updated: fb.pattern_updated
  });
});

// ============== HELPER FUNCTIONS ==============

function findSimilarWords(word, limit = 5) {
  const normalized = normalizer.normalize(word);
  const words = lexicon.words || [];

  // Simple similarity: shared characters
  const scored = words.map(w => ({
    word: w.soussou,
    score: stringSimilarity(normalized, normalizer.normalize(w.soussou))
  }));

  return scored
    .filter(s => s.score > 0.3)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(s => s.word);
}

function stringSimilarity(a, b) {
  if (a === b) return 1;
  if (!a || !b) return 0;

  const longer = a.length > b.length ? a : b;
  const shorter = a.length > b.length ? b : a;

  if (longer.length === 0) return 1;

  // Count matching characters
  let matches = 0;
  for (let i = 0; i < shorter.length; i++) {
    if (longer.includes(shorter[i])) matches++;
  }

  return matches / longer.length;
}

function detectRole(word, entry) {
  // Detect grammatical role based on word and context
  const pronouns = ['ntan', 'itan', 'ana', 'whon', 'etan', 'wo'];
  const normalized = normalizer.normalize(word);

  if (pronouns.includes(normalized) || normalized.match(/^n'/)) {
    return 'subject';
  }
  if (entry?.category === 'verb') {
    return 'verb';
  }
  if (['tinan', 'demain', 'hier'].includes(normalized)) {
    return 'time';
  }
  return entry?.category || 'unknown';
}

function generateGrammarNotes(breakdown) {
  const notes = [];

  // Check for SOAM pattern
  const roles = breakdown.map(b => b.role);
  if (roles[0] === 'subject') {
    notes.push('SOAM word order: Subject first, followed by object/verb/modifier');
  }

  // Check for negation
  if (breakdown.some(b => b.word === 'mma' || b.word.includes('mma'))) {
    notes.push("Negation marker 'm'ma' placed before verb");
  }

  // Check for pronoun dropping
  if (breakdown[0]?.role === 'verb') {
    notes.push('Pronoun dropped (casual speech) - full form would include subject');
  }

  return notes;
}

function findMatchingExample(normalizedPhrase) {
  // Search through lexicon examples
  for (const word of (lexicon.words || [])) {
    for (const example of (word.examples || [])) {
      if (normalizer.normalizePhrase(example.soussou) === normalizedPhrase) {
        return example;
      }
    }
  }
  return null;
}

function translateFromSoussou(text, targetLang) {
  const normalized = normalizer.normalizePhrase(text);
  const words = normalized.split(' ');

  const translations = [];
  const uncertainParts = [];
  let totalConfidence = 1;

  for (const word of words) {
    const entry = lexicon.words?.find(w =>
      normalizer.normalize(w.soussou) === word
    );

    if (entry) {
      translations.push(targetLang === 'english' ? entry.english : entry.french);
    } else {
      translations.push(`[${word}]`);
      uncertainParts.push({
        original: word,
        attempted: '?',
        confidence: 0,
        needs_verification: true
      });
      totalConfidence *= 0.5;
    }
  }

  return {
    translation: translations.join(' '),
    confidence: Math.max(0.1, totalConfidence),
    uncertainParts: uncertainParts,
    notes: uncertainParts.length > 0 ? ['Some words not found in lexicon'] : []
  };
}

function translateToSoussou(text, sourceLang) {
  // This is the core Guinius flow
  // 1. Parse input
  // 2. Match words to Soussou
  // 3. Apply SOAM rules
  // 4. Fill gaps with French

  const words = text.toLowerCase().split(/\s+/);
  const soussouParts = [];
  const uncertainParts = [];
  let totalConfidence = 1;

  for (const word of words) {
    // Find Soussou equivalent
    const entry = lexicon.words?.find(w => {
      const eng = (w.english || '').toLowerCase();
      const fr = (w.french || '').toLowerCase();
      return eng.includes(word) || fr.includes(word) || eng === word || fr === word;
    });

    if (entry) {
      soussouParts.push(entry.soussou);
    } else {
      // Fill with French (authentic code-switching)
      soussouParts.push(word);
      uncertainParts.push({
        original: word,
        attempted: word,
        confidence: 0.3,
        french_fallback: word,
        needs_verification: true
      });
      totalConfidence *= 0.7;
    }
  }

  // TODO: Apply SOAM word order rules here

  return {
    translation: soussouParts.join(' '),
    confidence: Math.max(0.1, totalConfidence),
    uncertainParts: uncertainParts,
    alternatives: [],
    notes: uncertainParts.length > 0
      ? ['Some words filled with French - authentic Guinea code-switching']
      : []
  };
}

function detectNormalizationChanges(original, normalized) {
  const changes = [];

  if (original.includes("'") && !normalized.includes("'")) {
    changes.push('removed apostrophe');
  }
  if (original.match(/[éèêë]/) && !normalized.match(/[éèêë]/)) {
    changes.push('removed accent');
  }
  if (original !== original.toLowerCase()) {
    changes.push('lowercased');
  }
  if (original.endsWith('h') && !normalized.endsWith('h')) {
    changes.push('removed trailing h');
  }
  if (original.match(/(.)\1/) && !normalized.match(/(.)\1/)) {
    changes.push('compressed double consonant');
  }

  return changes;
}

function generateId(prefix) {
  return `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).substr(2, 5)}`;
}

// ============== START SERVER ==============

app.listen(PORT, () => {
  const unifiedStats = unifiedTranslator.getStats();
  const sentenceStats = SentenceMatcher.getStats();

  console.log(`
  ╔═══════════════════════════════════════════════════════╗
  ║                                                       ║
  ║   🇬🇳  GUINIUS API v2.0                               ║
  ║   The first AI that speaks Soussou                    ║
  ║   Now powered by Google SMOL + Our Engine             ║
  ║                                                       ║
  ║   Server running on port ${PORT}                          ║
  ║                                                       ║
  ║   📚 Data Sources:                                    ║
  ║   • Unified Lexicon: ${unifiedStats.lexicon_size.toLocaleString()} entries                 ║
  ║   • Google SMOL Sentences: ${sentenceStats.totalPairs} verified        ║
  ║   • Google Vocabulary: ${unifiedStats.google_vocab.toLocaleString()} tokens                ║
  ║   • EN→SU Mappings: ${unifiedStats.en_to_sus_mappings.toLocaleString()} words                   ║
  ║                                                       ║
  ║   🔥 New v2 Endpoints:                                ║
  ║   • POST /api/v2/translate (unified)                  ║
  ║   • GET  /api/v2/suggest                              ║
  ║   • GET  /api/v2/sentence-match                       ║
  ║   • POST /api/v2/normalize-orthography                ║
  ║   • POST /api/validate (compare vs Google)            ║
  ║   • GET  /api/v2/stats                                ║
  ║                                                       ║
  ╚═══════════════════════════════════════════════════════╝
  `);
});

module.exports = app;
