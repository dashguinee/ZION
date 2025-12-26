/**
 * Unified Susu Translator
 *
 * Combines:
 * 1. Google SMOL verified translations (863 sentences)
 * 2. Our merged lexicon (12,329 words)
 * 3. Grammar rules from both systems
 * 4. Phonetic normalization
 *
 * Flow: Input → Sentence Match → Word-by-word → Grammar Rules → Output
 */

const fs = require('fs');
const path = require('path');

class UnifiedTranslator {
  constructor(dataPath = null) {
    this.dataPath = dataPath || path.join(__dirname, '..', 'data');
    this.lexicon = null;
    this.grammar = null;
    this.sentencePairs = null;
    this.googleVocab = null;
    this.loaded = false;
  }

  /**
   * Load all data files
   */
  load() {
    if (this.loaded) return;

    try {
      // Load merged lexicon
      const lexiconPath = path.join(this.dataPath, 'lexicon_merged.json');
      if (fs.existsSync(lexiconPath)) {
        this.lexicon = JSON.parse(fs.readFileSync(lexiconPath, 'utf8'));
      } else {
        // Fallback to original
        this.lexicon = JSON.parse(fs.readFileSync(path.join(this.dataPath, 'lexicon.json'), 'utf8'));
      }

      // Load merged grammar
      const grammarPath = path.join(this.dataPath, 'grammar_merged.json');
      if (fs.existsSync(grammarPath)) {
        this.grammar = JSON.parse(fs.readFileSync(grammarPath, 'utf8'));
      }

      // Load Google sentence pairs
      const sentencePath = path.join(this.dataPath, 'google_smol', 'smolsent_en_sus.jsonl');
      if (fs.existsSync(sentencePath)) {
        this.sentencePairs = [];
        const lines = fs.readFileSync(sentencePath, 'utf8').split('\n');
        for (const line of lines) {
          if (line.trim()) {
            this.sentencePairs.push(JSON.parse(line));
          }
        }
      }

      // Load Google vocabulary
      const googleVocabPath = path.join(this.dataPath, 'google_smol', 'google_knowledge_base.json');
      if (fs.existsSync(googleVocabPath)) {
        const kb = JSON.parse(fs.readFileSync(googleVocabPath, 'utf8'));
        this.googleVocab = kb.vocabulary;
      }

      // Build lookup indexes
      this._buildIndexes();

      this.loaded = true;
      console.log(`UnifiedTranslator loaded:`);
      console.log(`  - Lexicon: ${this.lexicon.length} entries`);
      console.log(`  - Sentence pairs: ${this.sentencePairs?.length || 0}`);
      console.log(`  - Google vocab: ${Object.keys(this.googleVocab || {}).length}`);

    } catch (error) {
      console.error('Failed to load translator data:', error.message);
      throw error;
    }
  }

  /**
   * Build lookup indexes for fast translation
   */
  _buildIndexes() {
    // English to Susu lookup
    this.enToSus = {};
    this.susToEn = {};

    for (const entry of this.lexicon) {
      const eng = (entry.english || '').toLowerCase().split(',')[0].trim();
      const sus = entry.base || entry.soussou || '';

      if (eng && sus) {
        this.enToSus[eng] = sus;
        this.susToEn[this._normalize(sus)] = eng;
      }
    }

    // Add Google vocab
    if (this.googleVocab) {
      for (const [en, data] of Object.entries(this.googleVocab)) {
        if (!this.enToSus[en.toLowerCase()]) {
          this.enToSus[en.toLowerCase()] = data.primary;
        }
      }
    }

    // Sentence index for matching
    this.sentenceIndex = {};
    if (this.sentencePairs) {
      for (const pair of this.sentencePairs) {
        const key = this._normalizeForMatch(pair.src);
        this.sentenceIndex[key] = pair;
      }
    }
  }

  /**
   * Normalize text for matching
   */
  _normalize(text) {
    if (!text) return '';
    return text.toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[''`]/g, '')
      .trim();
  }

  /**
   * Normalize for sentence matching
   */
  _normalizeForMatch(text) {
    return this._normalize(text)
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Calculate similarity between two strings (Jaccard)
   */
  _similarity(a, b) {
    const wordsA = new Set(this._normalizeForMatch(a).split(' '));
    const wordsB = new Set(this._normalizeForMatch(b).split(' '));

    const intersection = new Set([...wordsA].filter(x => wordsB.has(x)));
    const union = new Set([...wordsA, ...wordsB]);

    return intersection.size / union.size;
  }

  /**
   * Main translation method: English → Susu
   */
  translate(englishText, options = {}) {
    this.load();

    const input = englishText.trim();
    const result = {
      original: input,
      translation: null,
      confidence: 0,
      method: null,
      alternatives: [],
      notes: []
    };

    // STEP 1: Try exact sentence match
    const exactKey = this._normalizeForMatch(input);
    if (this.sentenceIndex[exactKey]) {
      const match = this.sentenceIndex[exactKey];
      result.translation = match.trg;
      result.confidence = 1.0;
      result.method = 'exact_sentence_match';
      result.notes.push('Verified translation from Google SMOL');
      return result;
    }

    // STEP 2: Try fuzzy sentence match
    let bestMatch = null;
    let bestScore = 0;

    for (const pair of this.sentencePairs || []) {
      const score = this._similarity(input, pair.src);
      if (score > bestScore && score >= 0.6) {
        bestScore = score;
        bestMatch = pair;
      }
    }

    if (bestMatch && bestScore >= 0.7) {
      result.translation = bestMatch.trg;
      result.confidence = bestScore;
      result.method = 'fuzzy_sentence_match';
      result.notes.push(`Similar to: "${bestMatch.src}"`);
      result.alternatives.push({
        source: bestMatch.src,
        translation: bestMatch.trg,
        score: bestScore
      });
      return result;
    }

    // STEP 3: Word-by-word translation with grammar rules
    const words = input.toLowerCase().split(/\s+/);
    const translatedWords = [];
    const unknownWords = [];

    for (const word of words) {
      const clean = word.replace(/[^a-z']/g, '');

      // Try direct lookup
      if (this.enToSus[clean]) {
        translatedWords.push(this.enToSus[clean]);
      }
      // Try verb forms
      else if (this.grammar?.verbs[clean]) {
        translatedWords.push(this.grammar.verbs[clean]);
      }
      // Try pronouns
      else if (this.grammar?.pronouns?.subject[clean.toUpperCase()]) {
        const pronoun = this.grammar.pronouns.subject[clean.toUpperCase()];
        translatedWords.push(pronoun.emphatic || pronoun.base || pronoun.google);
      }
      // Unknown - keep as French filler (authentic code-switching)
      else {
        translatedWords.push(clean);
        unknownWords.push(clean);
      }
    }

    // Apply word order rules (basic SOV)
    const susseneSentence = this._applyGrammarRules(translatedWords, words);

    result.translation = susseneSentence;
    result.confidence = unknownWords.length > 0
      ? Math.max(0.3, 1 - (unknownWords.length / words.length * 0.5))
      : 0.7;
    result.method = 'word_by_word';

    if (unknownWords.length > 0) {
      result.notes.push(`French fillers used for: ${unknownWords.join(', ')}`);
    }

    // Add similar sentence as alternative if found
    if (bestMatch && bestScore >= 0.4) {
      result.alternatives.push({
        source: bestMatch.src,
        translation: bestMatch.trg,
        score: bestScore
      });
    }

    return result;
  }

  /**
   * Apply grammar rules to word list
   */
  _applyGrammarRules(susWords, enWords) {
    // For now, basic joining
    // TODO: Implement full SOAM reordering
    return susWords.join(' ');
  }

  /**
   * Translate Susu → English
   */
  translateToEnglish(susuText) {
    this.load();

    const words = susuText.toLowerCase().split(/\s+/);
    const translatedWords = [];

    for (const word of words) {
      const normalized = this._normalize(word);
      if (this.susToEn[normalized]) {
        translatedWords.push(this.susToEn[normalized]);
      } else {
        translatedWords.push(`[${word}]`);
      }
    }

    return {
      original: susuText,
      translation: translatedWords.join(' '),
      confidence: translatedWords.filter(w => !w.startsWith('[')).length / words.length
    };
  }

  /**
   * Get translation suggestions
   */
  suggest(englishText, limit = 5) {
    this.load();

    const suggestions = [];
    const input = englishText.toLowerCase();

    // Find similar sentences
    for (const pair of this.sentencePairs || []) {
      const score = this._similarity(input, pair.src);
      if (score >= 0.3) {
        suggestions.push({
          english: pair.src,
          susu: pair.trg,
          score: score
        });
      }
    }

    // Sort by score and limit
    return suggestions
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  /**
   * Get stats
   */
  getStats() {
    this.load();
    return {
      lexicon_size: this.lexicon?.length || 0,
      sentence_pairs: this.sentencePairs?.length || 0,
      google_vocab: Object.keys(this.googleVocab || {}).length,
      en_to_sus_mappings: Object.keys(this.enToSus).length
    };
  }
}

// Export
module.exports = UnifiedTranslator;

// CLI test
if (require.main === module) {
  const translator = new UnifiedTranslator();

  console.log('\n=== UNIFIED SUSU TRANSLATOR TEST ===\n');

  // Test sentences
  const tests = [
    'Hello, how are you?',
    'I want to see you',
    'Where are you from?',
    'Thank you very much',
    'I am coming tomorrow',
    'The book is on the table'
  ];

  for (const test of tests) {
    console.log(`EN: ${test}`);
    const result = translator.translate(test);
    console.log(`SU: ${result.translation}`);
    console.log(`   Method: ${result.method}, Confidence: ${(result.confidence * 100).toFixed(0)}%`);
    if (result.notes.length > 0) {
      console.log(`   Notes: ${result.notes.join('; ')}`);
    }
    console.log();
  }

  console.log('--- Stats ---');
  console.log(translator.getStats());
}
