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

const app = express();
const PORT = process.env.PORT || 3000;

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
const VariantNormalizer = require('../src/variant_normalizer');
const SentenceGenerator = require('../src/sentence_generator');
const ResponseSelector = require('../src/response_selector');

// Initialize engines
const normalizer = new VariantNormalizer(variantMappings);
const generator = new SentenceGenerator(generationTemplates, lexicon);
const responseSelector = new ResponseSelector(lexicon, generationTemplates);

// In-memory stores for contributions/feedback (would be database in production)
const contributions = [];
const feedback = [];

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
  console.log(`
  ╔═══════════════════════════════════════════════╗
  ║                                               ║
  ║   🇬🇳  GUINIUS API v1.0                       ║
  ║   The first AI that speaks Soussou            ║
  ║                                               ║
  ║   Server running on port ${PORT}                  ║
  ║                                               ║
  ║   Lexicon: ${(lexicon.words || []).length} words                      ║
  ║   Variants: ${Object.keys(variantMappings.variant_to_base || {}).length} mappings                  ║
  ║   Templates: ${Object.keys(generationTemplates.templates || {}).length} patterns                    ║
  ║                                               ║
  ╚═══════════════════════════════════════════════╝
  `);
});

module.exports = app;
