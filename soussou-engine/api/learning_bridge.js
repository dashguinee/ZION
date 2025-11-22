/**
 * LEARNING BRIDGE - Phase 3 → Phase 4 Integration Layer
 *
 * Purpose: Connect existing API to Pattern Discovery Engine
 * Strategy: Non-breaking, async hooks that enhance without disrupting
 *
 * Continuity Protocol:
 * - Existing endpoints keep working unchanged
 * - Learning happens in background (async)
 * - Failures don't break user experience
 * - Gradual rollout capability
 */

const path = require('path');
const fs = require('fs');

// Import the brain
const PatternDiscoveryEngine = require('../src/pattern_discovery_engine');
const SentenceCorpus = require('../src/sentence_corpus');

class LearningBridge {
  constructor(dataDir, lexicon) {
    this.dataDir = dataDir;
    this.lexicon = lexicon;

    // Initialize learning components
    this.initializeLearningLayer();

    // Track learning metrics
    this.metrics = {
      sentences_captured: 0,
      patterns_discovered: 0,
      last_discovery_run: null,
      errors: []
    };

    console.log('🧠 Learning Bridge initialized');
  }

  initializeLearningLayer() {
    try {
      // Load sentence corpus (or create if doesn't exist)
      const corpusPath = path.join(this.dataDir, 'sentence_corpus.json');

      if (!fs.existsSync(corpusPath)) {
        // Initialize empty corpus
        const emptyCorpus = {
          sentences: [],
          metadata: {
            total_sentences: 0,
            verified_sentences: 0,
            sources: {},
            last_updated: new Date().toISOString()
          }
        };
        fs.writeFileSync(corpusPath, JSON.stringify(emptyCorpus, null, 2));
        console.log('📝 Initialized sentence corpus');
      }

      // Load corpus
      this.corpus = this.loadCorpus(corpusPath);

      // Initialize pattern engine
      const verifiedSentences = this.corpus.sentences
        .filter(s => s.verified)
        .map(s => s.soussou);

      this.patternEngine = new PatternDiscoveryEngine(
        verifiedSentences,
        this.lexicon || []
      );

      console.log(`📊 Loaded ${this.corpus.metadata.total_sentences} sentences (${this.corpus.metadata.verified_sentences} verified)`);

    } catch (error) {
      console.error('⚠️  Learning layer initialization failed (non-critical):', error.message);
      this.metrics.errors.push({
        timestamp: new Date().toISOString(),
        error: error.message,
        phase: 'initialization'
      });
    }
  }

  loadCorpus(corpusPath) {
    const data = JSON.parse(fs.readFileSync(corpusPath, 'utf8'));
    return {
      ...data,
      // Helper methods
      addSentence: (sentence) => this.addSentenceToCorpus(sentence, corpusPath),
      save: () => this.saveCorpus(data, corpusPath),
      getVerified: () => data.sentences.filter(s => s.verified),
      getStats: () => this.getCorpusStats(data)
    };
  }

  addSentenceToCorpus(sentence, corpusPath) {
    try {
      const entry = {
        id: `sent_${this.corpus.sentences.length + 1}`,
        soussou: sentence.soussou,
        french: sentence.french || null,
        english: sentence.english || null,

        // Pattern metadata
        pattern: sentence.pattern || null,
        template_used: sentence.template_used || null,

        // Verification
        verified: sentence.verified || false,
        verified_by: sentence.verified_by || null,
        verified_at: sentence.verified ? new Date().toISOString() : null,

        // Source tracking
        source: sentence.source || 'unknown',
        contributed_by: sentence.contributed_by || null,

        // Usage tracking
        times_used: 0,
        last_used: null,

        // Semantic metadata
        context: sentence.context || null,
        tags: sentence.tags || [],

        // Quality metrics
        confidence_score: sentence.confidence_score || 0.5,

        created_at: new Date().toISOString()
      };

      this.corpus.sentences.push(entry);
      this.corpus.metadata.total_sentences++;

      if (entry.verified) {
        this.corpus.metadata.verified_sentences++;
      }

      // Track source
      const source = entry.source;
      if (!this.corpus.metadata.sources) {
        this.corpus.metadata.sources = {};
      }
      if (!this.corpus.metadata.sources[source]) {
        this.corpus.metadata.sources[source] = 0;
      }
      this.corpus.metadata.sources[source]++;

      // Save to disk (async, non-blocking)
      this.saveCorpus(this.corpus, corpusPath);

      this.metrics.sentences_captured++;

      return entry.id;

    } catch (error) {
      console.error('⚠️  Failed to add sentence (non-critical):', error.message);
      this.metrics.errors.push({
        timestamp: new Date().toISOString(),
        error: error.message,
        phase: 'sentence_capture'
      });
      return null;
    }
  }

  saveCorpus(corpus, corpusPath) {
    try {
      corpus.metadata.last_updated = new Date().toISOString();
      fs.writeFileSync(corpusPath, JSON.stringify(corpus, null, 2));
    } catch (error) {
      console.error('⚠️  Failed to save corpus (non-critical):', error.message);
    }
  }

  getCorpusStats(corpus) {
    const verified = corpus.sentences.filter(s => s.verified);

    // Pattern distribution
    const patternCounts = {};
    corpus.sentences.forEach(s => {
      const pattern = s.pattern || 'unknown';
      patternCounts[pattern] = (patternCounts[pattern] || 0) + 1;
    });

    return {
      total_sentences: corpus.metadata.total_sentences,
      verified_sentences: corpus.metadata.verified_sentences,
      verification_rate: corpus.sentences.length > 0
        ? ((verified.length / corpus.sentences.length) * 100).toFixed(2) + '%'
        : '0%',
      patterns: patternCounts,
      sources: corpus.metadata.sources,
      avg_confidence: corpus.sentences.length > 0
        ? (corpus.sentences.reduce((sum, s) => sum + s.confidence_score, 0) / corpus.sentences.length).toFixed(2)
        : 0
    };
  }

  // ============== HOOK METHODS (Non-breaking) ==============

  /**
   * Hook: User contributed a word/phrase
   * Called from /api/contribute endpoint
   */
  onContribution(contributionData) {
    try {
      // Add to corpus for future pattern mining
      if (contributionData.word && contributionData.english) {
        // Detect code-switching (DASH Language security layer)
        const tags = [contributionData.category || 'unknown'];
        const isCodeSwitching = this.detectCodeSwitching(contributionData.word);

        if (isCodeSwitching) {
          tags.push('code_switching_candidate');
          console.log(`🔀 Code-switching detected: "${contributionData.word}"`);
        }

        this.corpus.addSentence({
          soussou: contributionData.word,
          french: contributionData.french || null,
          english: contributionData.english,
          source: 'user_contributed',
          verified: false, // Needs review
          tags: tags,
          confidence_score: 0.6 // User contributions are medium confidence
        });

        console.log(`📝 Captured contribution: "${contributionData.word}"`);
      }
    } catch (error) {
      // Silent fail - don't break user experience
      this.metrics.errors.push({
        timestamp: new Date().toISOString(),
        error: error.message,
        phase: 'contribution_hook'
      });
    }
  }

  /**
   * Detect code-switching (mixed Soussou/French)
   * Critical for DASH Language security layer
   */
  detectCodeSwitching(text) {
    if (!text) return false;

    const words = text.toLowerCase().split(/\s+/);
    let soussouWords = 0;
    let frenchWords = 0;

    // Known Soussou markers
    const soussouMarkers = ['ma', 'ikha', 'whonma', 'ntan', 'itan', 'ana', 'whon', 'etan',
                            'fafé', 'kolon', 'woto', 'bangui', 'mindé', 'yite', 'khafé',
                            'mma', 'fan', 'eske'];

    // Known French markers (common words)
    const frenchMarkers = ['le', 'la', 'les', 'un', 'une', 'de', 'du', 'des', 'et', 'ou',
                           'dans', 'sur', 'avec', 'pour', 'aussi', 'très', 'bien',
                           'voiture', 'bateau', 'telephone', 'maison'];

    words.forEach(word => {
      if (soussouMarkers.includes(word)) soussouWords++;
      if (frenchMarkers.includes(word)) frenchWords++;
    });

    // Check against lexicon
    words.forEach(word => {
      const inLexicon = (this.lexicon || []).some(entry =>
        entry.base && entry.base.toLowerCase().includes(word)
      );
      if (inLexicon) soussouWords++;
    });

    // Code-switching detected if both languages present
    return soussouWords > 0 && frenchWords > 0;
  }

  /**
   * Hook: User provided feedback/correction
   * Called from /api/feedback endpoint
   */
  onFeedback(feedbackData) {
    try {
      // If user provided correction with bad rating = learning opportunity
      if (feedbackData.correction && feedbackData.rating <= 2) {
        this.corpus.addSentence({
          soussou: feedbackData.correction,
          source: 'user_correction',
          verified: true, // User corrections are trusted
          verified_by: 'user_feedback',
          confidence_score: 0.9,
          tags: ['correction']
        });

        console.log(`✏️  Captured correction: "${feedbackData.correction}"`);

        // Maybe trigger pattern discovery (throttled)
        this.maybeDiscoverPatterns();
      }
    } catch (error) {
      this.metrics.errors.push({
        timestamp: new Date().toISOString(),
        error: error.message,
        phase: 'feedback_hook'
      });
    }
  }

  /**
   * Hook: Translation was generated
   * Called from /api/translate endpoint
   */
  onTranslation(translationData) {
    try {
      // Capture successful translations (high confidence only)
      if (translationData.confidence > 0.8 && translationData.to === 'soussou') {
        this.corpus.addSentence({
          soussou: translationData.translation,
          french: translationData.from === 'french' ? translationData.original : null,
          english: translationData.from === 'english' ? translationData.original : null,
          source: 'api_generated',
          verified: false,
          confidence_score: translationData.confidence,
          tags: ['translation']
        });
      }
    } catch (error) {
      this.metrics.errors.push({
        timestamp: new Date().toISOString(),
        error: error.message,
        phase: 'translation_hook'
      });
    }
  }

  /**
   * Throttled pattern discovery (don't run too often)
   */
  maybeDiscoverPatterns() {
    try {
      const now = Date.now();
      const lastRun = this.metrics.last_discovery_run || 0;
      const timeSinceLastRun = now - lastRun;

      // Only run discovery every 5 minutes
      const DISCOVERY_INTERVAL = 5 * 60 * 1000;

      if (timeSinceLastRun < DISCOVERY_INTERVAL) {
        return; // Too soon
      }

      // Run pattern discovery in background
      setImmediate(() => {
        this.discoverPatterns();
      });

    } catch (error) {
      console.error('⚠️  Pattern discovery trigger failed:', error.message);
    }
  }

  /**
   * Run pattern discovery on verified corpus
   */
  async discoverPatterns() {
    try {
      console.log('🔍 Running pattern discovery...');

      const verifiedSentences = this.corpus.getVerified().map(s => s.soussou);

      // Update pattern engine corpus
      this.patternEngine.corpus = verifiedSentences;

      // Discover patterns
      const patterns = this.patternEngine.discoverPatterns();

      // Filter for high confidence
      // Dynamic threshold: For small corpora (< 10 sentences), use 2. Otherwise use 3.
      const threshold = verifiedSentences.length < 10 ? 2 : 3;
      const highConfidence = patterns.filter(p => p.frequency >= threshold);

      this.metrics.patterns_discovered += highConfidence.length;
      this.metrics.last_discovery_run = Date.now();

      if (highConfidence.length > 0) {
        console.log(`✨ Discovered ${highConfidence.length} new patterns`);

        // PHASE 4: Persist discovered patterns to syntax_patterns.json
        this.persistPatterns(highConfidence);

        highConfidence.forEach(p => {
          console.log(`  - ${p.pattern} (${p.frequency} occurrences)`);
        });
      }

      return highConfidence;

    } catch (error) {
      console.error('⚠️  Pattern discovery failed:', error.message);
      this.metrics.errors.push({
        timestamp: new Date().toISOString(),
        error: error.message,
        phase: 'pattern_discovery'
      });
      return [];
    }
  }

  /**
   * Persist discovered patterns to syntax_patterns.json
   * ZION-GEM Directive: Save high-confidence patterns for permanence
   */
  persistPatterns(patterns) {
    try {
      const syntaxPatternsPath = path.join(this.dataDir, 'syntax_patterns.json');

      // Load existing patterns
      let existingPatterns = {};
      if (fs.existsSync(syntaxPatternsPath)) {
        existingPatterns = JSON.parse(fs.readFileSync(syntaxPatternsPath, 'utf8'));
      }

      // Ensure discovered_patterns array exists
      if (!existingPatterns.discovered_patterns) {
        existingPatterns.discovered_patterns = [];
      }

      // Add new patterns (avoid duplicates)
      patterns.forEach(pattern => {
        const exists = existingPatterns.discovered_patterns.some(
          p => p.pattern === pattern.pattern
        );

        if (!exists) {
          existingPatterns.discovered_patterns.push({
            ...pattern,
            persisted_at: new Date().toISOString(),
            source: 'automated_discovery'
          });
          console.log(`💾 Persisted pattern: ${pattern.pattern}`);
        }
      });

      // Save back to disk
      fs.writeFileSync(syntaxPatternsPath, JSON.stringify(existingPatterns, null, 2));
      console.log(`✅ Patterns persisted to syntax_patterns.json`);

    } catch (error) {
      console.error('⚠️  Pattern persistence failed (non-critical):', error.message);
      this.metrics.errors.push({
        timestamp: new Date().toISOString(),
        error: error.message,
        phase: 'pattern_persistence'
      });
    }
  }

  /**
   * Get learning metrics
   */
  getMetrics() {
    return {
      ...this.metrics,
      corpus_stats: this.corpus.getStats(),
      uptime: process.uptime(),
      error_rate: this.metrics.errors.length > 0
        ? (this.metrics.errors.length / this.metrics.sentences_captured * 100).toFixed(2) + '%'
        : '0%'
    };
  }

  /**
   * Manual trigger for pattern discovery
   */
  triggerDiscovery() {
    return this.discoverPatterns();
  }
}

module.exports = LearningBridge;
