/**
 * ZION LEARNING API
 *
 * Backend for all 3 learning interfaces:
 * - Custom GPT Actions
 * - CLI Tool
 * - Web App
 */

import express from 'express';
import cors from 'cors';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Data paths
const DATA_DIR = join(__dirname, '../soussou-engine/data');
const CORPUS_PATH = join(DATA_DIR, 'sentence_corpus.json');
const LEXICON_PATH = join(DATA_DIR, 'lexicon.json');
const TEMPLATES_PATH = join(DATA_DIR, 'generation_templates.json');

// Initialize corpus file if doesn't exist
if (!existsSync(CORPUS_PATH)) {
  const initialCorpus = {
    sentences: [],
    metadata: {
      total_sentences: 0,
      verified_sentences: 0,
      contributors: {},
      last_updated: new Date().toISOString()
    }
  };
  writeFileSync(CORPUS_PATH, JSON.stringify(initialCorpus, null, 2));
  console.log('✅ Initialized sentence corpus');
}

// ===== HELPER FUNCTIONS =====

function loadCorpus() {
  return JSON.parse(readFileSync(CORPUS_PATH, 'utf8'));
}

function saveCorpus(corpus) {
  corpus.metadata.last_updated = new Date().toISOString();
  writeFileSync(CORPUS_PATH, JSON.stringify(corpus, null, 2));
}

function loadLexicon() {
  return JSON.parse(readFileSync(LEXICON_PATH, 'utf8'));
}

function loadTemplates() {
  return JSON.parse(readFileSync(TEMPLATES_PATH, 'utf8'));
}

function detectPattern(sentence, lexicon) {
  // Simple pattern detection based on word categories
  const words = sentence.toLowerCase().split(' ');
  const categories = words.map(word => {
    const entry = lexicon.find(e =>
      e.base.toLowerCase() === word ||
      e.variants?.some(v => v.toLowerCase() === word)
    );
    return entry ? entry.category : 'unknown';
  });

  // Common patterns
  const patternMap = {
    'pronoun,noun,adjective': 'possessive_noun_adjective',
    'pronoun,noun,particle,adjective': 'intensifier_with_fan',
    'greeting,question': 'greeting_question',
    'particle,pronoun,noun,adjective': 'formal_question_eske'
  };

  const patternKey = categories.join(',');
  const detectedPattern = patternMap[patternKey];

  return {
    pattern: detectedPattern || 'unknown',
    template: `{${categories.map(c => c.toUpperCase()).join('} {')}}`,
    confidence: detectedPattern ? 0.8 : 0.3,
    word_categories: categories
  };
}

// ===== ENDPOINTS =====

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Get stats
app.get('/api/stats', (req, res) => {
  try {
    const corpus = loadCorpus();
    const lexicon = loadLexicon();
    const templates = loadTemplates();

    const verified_words = lexicon.filter(w => w.english && w.french).length;
    const contributors = Object.keys(corpus.metadata.contributors || {});

    res.json({
      corpus: {
        total_sentences: corpus.sentences.length,
        verified_sentences: corpus.sentences.filter(s => s.verified).length,
        contributors: contributors.length,
        top_contributor: contributors[0] || null
      },
      lexicon: {
        total_words: lexicon.length,
        verified_words: verified_words,
        verification_rate: ((verified_words / lexicon.length) * 100).toFixed(2) + '%'
      },
      templates: {
        total_patterns: Object.keys(templates.templates).length,
        auto_discovered: 0 // TODO: track this
      },
      last_updated: corpus.metadata.last_updated
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add sentence to corpus
app.post('/api/corpus/add-sentence', (req, res) => {
  try {
    const { soussou, french, english, contributed_by, pattern_hint, cultural_context } = req.body;

    if (!soussou) {
      return res.status(400).json({ error: 'Soussou sentence is required' });
    }

    const corpus = loadCorpus();
    const lexicon = loadLexicon();

    // Detect pattern if not provided
    const detected = pattern_hint ?
      { pattern: pattern_hint, confidence: 0.9 } :
      detectPattern(soussou, lexicon);

    // Create sentence entry
    const sentenceId = `sent_${String(corpus.sentences.length + 1).padStart(5, '0')}`;
    const sentence = {
      id: sentenceId,
      soussou,
      french: french || null,
      english: english || null,
      pattern: detected.pattern,
      pattern_confidence: detected.confidence,
      verified: false,
      contributed_by: contributed_by || 'anonymous',
      source: 'learning_interface',
      cultural_context: cultural_context || null,
      times_used: 0,
      confidence_score: detected.confidence,
      created_at: new Date().toISOString()
    };

    // Add to corpus
    corpus.sentences.push(sentence);
    corpus.metadata.total_sentences++;

    // Track contributor
    if (!corpus.metadata.contributors) corpus.metadata.contributors = {};
    corpus.metadata.contributors[contributed_by] =
      (corpus.metadata.contributors[contributed_by] || 0) + 1;

    saveCorpus(corpus);

    // Return with stats
    res.json({
      success: true,
      id: sentenceId,
      detected_pattern: detected.pattern,
      confidence: detected.confidence,
      stats: {
        today: corpus.sentences.filter(s =>
          s.contributed_by === contributed_by &&
          s.created_at.startsWith(new Date().toISOString().split('T')[0])
        ).length,
        total: corpus.sentences.filter(s => s.contributed_by === contributed_by).length
      }
    });

  } catch (error) {
    console.error('Error adding sentence:', error);
    res.status(500).json({ error: error.message });
  }
});

// Search corpus
app.get('/api/corpus/search', (req, res) => {
  try {
    const { query, limit = 10 } = req.query;

    if (!query) {
      return res.status(400).json({ error: 'Query is required' });
    }

    const corpus = loadCorpus();
    const queryLower = query.toLowerCase();

    // Search in soussou, french, and english
    const results = corpus.sentences
      .filter(s =>
        s.soussou.toLowerCase().includes(queryLower) ||
        s.french?.toLowerCase().includes(queryLower) ||
        s.english?.toLowerCase().includes(queryLower)
      )
      .slice(0, parseInt(limit));

    res.json({
      query,
      results: results.length,
      sentences: results
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Detect pattern
app.post('/api/pattern/detect', (req, res) => {
  try {
    const { sentence } = req.body;

    if (!sentence) {
      return res.status(400).json({ error: 'Sentence is required' });
    }

    const lexicon = loadLexicon();
    const detected = detectPattern(sentence, lexicon);

    res.json(detected);

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get sentences needing verification
app.get('/api/corpus/pending-verification', (req, res) => {
  try {
    const corpus = loadCorpus();
    const pending = corpus.sentences
      .filter(s => !s.verified && s.confidence_score > 0.6)
      .sort((a, b) => b.confidence_score - a.confidence_score)
      .slice(0, 20);

    res.json({
      pending: pending.length,
      sentences: pending
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Verify sentence
app.post('/api/corpus/verify', (req, res) => {
  try {
    const { sentence_id, verdict, correction, verified_by } = req.body;

    const corpus = loadCorpus();
    const sentence = corpus.sentences.find(s => s.id === sentence_id);

    if (!sentence) {
      return res.status(404).json({ error: 'Sentence not found' });
    }

    if (verdict === 'correct') {
      sentence.verified = true;
      sentence.verified_by = verified_by || 'Z-Core';
      sentence.verified_at = new Date().toISOString();
      sentence.confidence_score = 1.0;
      corpus.metadata.verified_sentences++;
    } else if (verdict === 'wrong') {
      if (correction) {
        // Update with correction
        Object.assign(sentence, correction);
        sentence.verified = true;
        sentence.verified_by = verified_by || 'Z-Core';
        sentence.corrected = true;
      } else {
        // Mark for removal or review
        sentence.flagged = true;
        sentence.flag_reason = 'rejected_by_verifier';
      }
    }

    saveCorpus(corpus);

    res.json({
      success: true,
      sentence_id,
      verdict,
      verified_count: corpus.metadata.verified_sentences
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add word to lexicon
app.post('/api/lexicon/add-word', (req, res) => {
  try {
    const { base, english, french, category, contributed_by } = req.body;

    if (!base || !category) {
      return res.status(400).json({ error: 'Base word and category are required' });
    }

    const lexicon = loadLexicon();

    // Check if word already exists
    const exists = lexicon.find(w => w.base.toLowerCase() === base.toLowerCase());
    if (exists) {
      return res.status(409).json({
        error: 'Word already exists',
        existing: exists
      });
    }

    // Generate ID
    const maxId = Math.max(...lexicon.map(w => parseInt(w.id?.replace('sus_', '') || '0')));
    const newId = `sus_${String(maxId + 1).padStart(5, '0')}`;

    // Create word entry
    const word = {
      id: newId,
      base,
      variants: [base],
      english: english || '',
      french: french || '',
      category,
      frequency: 0,
      sources: ['learning_interface'],
      contributed_by: contributed_by || 'anonymous',
      verified: !!(english && french),
      created_at: new Date().toISOString()
    };

    lexicon.push(word);
    writeFileSync(LEXICON_PATH, JSON.stringify(lexicon, null, 2));

    res.json({
      success: true,
      id: newId,
      word
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 ZION Learning API running on port ${PORT}`);
  console.log(`📊 Stats: http://localhost:${PORT}/api/stats`);
  console.log(`💚 Health: http://localhost:${PORT}/health`);
});
