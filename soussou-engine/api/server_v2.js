/**
 * SUSU AI API Server v2.0
 *
 * Full-featured Susu translation API with:
 * - REST endpoints for translation
 * - Word lookup and conjugation
 * - Sentence parsing with native speaker rules
 * - Google Translate integration
 * - 31,829 parallel sentences
 * - 4,001 word/phrase translations
 *
 * Run: node api/server_v2.js
 * Test: curl http://localhost:3000/api/translate?text=hello
 */

const express = require('express');
const cors = require('cors');
const path = require('path');

// Import Susu AI modules
const susuAI = require('../src/susu_ai');
const { parseSentence, quickParse } = require('../src/sentence_parser');
const { analyzeWord, analyzeSentence } = require('../src/morphology_analyzer');
const { conjugate, getConjugationTable, VERBS } = require('../src/verb_conjugator');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
  next();
});

// ============================================================================
// API ENDPOINTS
// ============================================================================

/**
 * GET /api/stats
 * Get translation engine statistics
 */
app.get('/api/stats', (req, res) => {
  try {
    const stats = susuAI.getStats();
    res.json({
      success: true,
      data: stats,
      version: '2.0',
      capabilities: [
        'word_translation',
        'sentence_translation',
        'morphology_analysis',
        'verb_conjugation',
        'sentence_parsing',
        'google_translate_integration'
      ]
    });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

/**
 * GET /api/translate
 * Translate text (auto-detect direction)
 */
app.get('/api/translate', async (req, res) => {
  try {
    const { text, from = 'auto', detailed = 'false' } = req.query;

    if (!text) {
      return res.status(400).json({
        success: false,
        error: 'Missing "text" parameter'
      });
    }

    const result = await susuAI.translate(text, {
      from,
      detailed: detailed === 'true'
    });

    res.json({
      success: true,
      data: result
    });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

/**
 * POST /api/translate
 * Translate text (body version)
 */
app.post('/api/translate', async (req, res) => {
  try {
    const { text, from = 'auto', detailed = false } = req.body;

    if (!text) {
      return res.status(400).json({
        success: false,
        error: 'Missing "text" in request body'
      });
    }

    const result = await susuAI.translate(text, { from, detailed });

    res.json({
      success: true,
      data: result
    });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

/**
 * POST /api/translate/batch
 * Translate multiple texts
 */
app.post('/api/translate/batch', async (req, res) => {
  try {
    const { texts, from = 'auto' } = req.body;

    if (!texts || !Array.isArray(texts)) {
      return res.status(400).json({
        success: false,
        error: 'Missing "texts" array in request body'
      });
    }

    const results = await Promise.all(
      texts.map(text => susuAI.translate(text, { from }))
    );

    res.json({
      success: true,
      data: results
    });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

/**
 * GET /api/lookup/:word
 * Look up word definition
 */
app.get('/api/lookup/:word', (req, res) => {
  try {
    const { word } = req.params;
    const result = susuAI.lookup(word);

    if (!result) {
      return res.status(404).json({
        success: false,
        error: 'Word not found'
      });
    }

    res.json({
      success: true,
      data: result
    });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

/**
 * POST /api/parse
 * Parse Susu sentence structure
 */
app.post('/api/parse', (req, res) => {
  try {
    const { text, quick = false } = req.body;

    if (!text) {
      return res.status(400).json({
        success: false,
        error: 'Missing "text" in request body'
      });
    }

    const result = quick ? quickParse(text) : parseSentence(text);

    res.json({
      success: true,
      data: result
    });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

/**
 * GET /api/analyze/:word
 * Morphological analysis of Susu word
 */
app.get('/api/analyze/:word', (req, res) => {
  try {
    const { word } = req.params;
    const result = analyzeWord(word);

    res.json({
      success: true,
      data: result
    });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

/**
 * POST /api/analyze/sentence
 * Analyze full Susu sentence
 */
app.post('/api/analyze/sentence', (req, res) => {
  try {
    const { text } = req.body;

    if (!text) {
      return res.status(400).json({
        success: false,
        error: 'Missing "text" in request body'
      });
    }

    const result = analyzeSentence(text);

    res.json({
      success: true,
      data: result
    });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

/**
 * GET /api/conjugate/:verb
 * Get verb conjugation
 */
app.get('/api/conjugate/:verb', (req, res) => {
  try {
    const { verb } = req.params;
    const { person = 'I', tense = 'present', negative = 'false' } = req.query;

    const result = conjugate(verb, {
      person,
      tense,
      negative: negative === 'true'
    });

    res.json({
      success: true,
      data: {
        verb,
        conjugated: result,
        options: { person, tense, negative: negative === 'true' }
      }
    });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

/**
 * GET /api/conjugate/:verb/table
 * Get full conjugation table for verb
 */
app.get('/api/conjugate/:verb/table', (req, res) => {
  try {
    const { verb } = req.params;
    const result = getConjugationTable(verb);

    if (!result) {
      return res.status(404).json({
        success: false,
        error: 'Unknown verb'
      });
    }

    res.json({
      success: true,
      data: result
    });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

/**
 * GET /api/verbs
 * List all known verbs
 */
app.get('/api/verbs', (req, res) => {
  res.json({
    success: true,
    data: Object.keys(VERBS)
  });
});

/**
 * POST /api/verify
 * Verify our translation against Google Translate
 */
app.post('/api/verify', async (req, res) => {
  try {
    const { text, ourTranslation, sourceLang = 'en' } = req.body;

    if (!text || !ourTranslation) {
      return res.status(400).json({
        success: false,
        error: 'Missing "text" or "ourTranslation" in request body'
      });
    }

    const result = await susuAI.verifyWithGoogle(text, ourTranslation, sourceLang);

    res.json({
      success: true,
      data: result
    });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

/**
 * POST /api/google-translate
 * Direct Google Translate API call
 */
app.post('/api/google-translate', async (req, res) => {
  try {
    const { text, source = 'en', target = 'sus' } = req.body;

    if (!text) {
      return res.status(400).json({
        success: false,
        error: 'Missing "text" in request body'
      });
    }

    if (!susuAI.CONFIG.googleApiKey) {
      return res.status(503).json({
        success: false,
        error: 'Google Translate API not configured. Set GOOGLE_TRANSLATE_API_KEY env variable.'
      });
    }

    const result = await susuAI.googleTranslate(text, source, target);

    res.json({
      success: true,
      data: {
        input: text,
        translation: result,
        source,
        target
      }
    });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// ============================================================================
// HEALTH & ROOT
// ============================================================================

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/', (req, res) => {
  const stats = susuAI.getStats();
  res.json({
    name: 'SUSU AI API',
    version: '2.0',
    description: 'Susu language translation and analysis API',
    stats: {
      words: stats.englishWords + stats.susuWords,
      sentences: stats.sentences,
      googleConfigured: stats.googleApiConfigured
    },
    endpoints: {
      'GET /api/stats': 'Engine statistics',
      'GET /api/translate?text=...': 'Translate text',
      'POST /api/translate': 'Translate text (body)',
      'POST /api/translate/batch': 'Batch translate',
      'GET /api/lookup/:word': 'Word lookup',
      'POST /api/parse': 'Parse Susu sentence',
      'GET /api/analyze/:word': 'Morphological analysis',
      'POST /api/analyze/sentence': 'Sentence analysis',
      'GET /api/conjugate/:verb': 'Verb conjugation',
      'GET /api/conjugate/:verb/table': 'Full conjugation table',
      'GET /api/verbs': 'List known verbs',
      'POST /api/verify': 'Verify with Google Translate',
      'POST /api/google-translate': 'Direct Google Translate'
    },
    documentation: 'https://github.com/soussou-engine/susu-ai'
  });
});

// ============================================================================
// START SERVER
// ============================================================================

app.listen(PORT, () => {
  console.log(`
╔══════════════════════════════════════════════════════════════╗
║                       SUSU AI API v2.0                       ║
╠══════════════════════════════════════════════════════════════╣
║  Server running at: http://localhost:${PORT}                    ║
║                                                              ║
║  Data loaded:                                                ║
║    - 31,829 parallel sentences (Bible + SMOL)                ║
║    - 4,001 word/phrase translations                          ║
║    - Native speaker grammar rules                            ║
║                                                              ║
║  Endpoints:                                                  ║
║    GET  /api/stats              - Engine statistics          ║
║    GET  /api/translate?text=... - Quick translate            ║
║    POST /api/translate          - Translate (body)           ║
║    GET  /api/lookup/:word       - Word lookup                ║
║    POST /api/parse              - Parse Susu sentence        ║
║    GET  /api/analyze/:word      - Morphology analysis        ║
║    GET  /api/conjugate/:verb    - Verb conjugation           ║
║    POST /api/google-translate   - Google Translate API       ║
║                                                              ║
║  Google Translate: ${susuAI.CONFIG.googleApiKey ? '✓ Configured' : '✗ Set GOOGLE_TRANSLATE_API_KEY'}              ║
╚══════════════════════════════════════════════════════════════╝
`);
});

module.exports = app;
