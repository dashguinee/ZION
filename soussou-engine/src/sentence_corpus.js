/**
 * SENTENCE CORPUS - SAVE ALL DISCOVERED SENTENCES
 *
 * Purpose:
 * 1. Build training data for LLM fine-tuning
 * 2. Pattern mining corpus
 * 3. Quality assurance examples
 * 4. User contribution tracking
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';

class SentenceCorpus {
  constructor(dataPath) {
    this.corpusPath = join(dataPath, 'sentence_corpus.json');
    this.corpus = this.load();
  }

  load() {
    if (existsSync(this.corpusPath)) {
      return JSON.parse(readFileSync(this.corpusPath, 'utf8'));
    }
    return {
      sentences: [],
      metadata: {
        total_sentences: 0,
        verified_sentences: 0,
        sources: {},
        last_updated: null
      }
    };
  }

  save() {
    this.corpus.metadata.last_updated = new Date().toISOString();
    writeFileSync(this.corpusPath, JSON.stringify(this.corpus, null, 2));
  }

  /**
   * Add sentence to corpus
   */
  addSentence(sentence) {
    const entry = {
      id: `sent_${this.corpus.sentences.length + 1}`,
      soussou: sentence.soussou,
      french: sentence.french,
      english: sentence.english || null,

      // Pattern metadata
      pattern: sentence.pattern || null,
      template_used: sentence.template_used || null,

      // Verification
      verified: sentence.verified || false,
      verified_by: sentence.verified_by || null,
      verified_at: sentence.verified ? new Date().toISOString() : null,

      // Source tracking
      source: sentence.source || 'unknown', // 'user_taught', 'generated', 'web_scraped', 'crowdsourced'
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
    if (!this.corpus.metadata.sources[source]) {
      this.corpus.metadata.sources[source] = 0;
    }
    this.corpus.metadata.sources[source]++;

    this.save();
    return entry.id;
  }

  /**
   * Mark sentence as verified
   */
  verifySentence(sentenceId, verifiedBy) {
    const sentence = this.corpus.sentences.find(s => s.id === sentenceId);
    if (!sentence) return false;

    if (!sentence.verified) {
      sentence.verified = true;
      sentence.verified_by = verifiedBy;
      sentence.verified_at = new Date().toISOString();
      sentence.confidence_score = 1.0;
      this.corpus.metadata.verified_sentences++;
      this.save();
    }

    return true;
  }

  /**
   * Track sentence usage
   */
  recordUsage(sentenceId) {
    const sentence = this.corpus.sentences.find(s => s.id === sentenceId);
    if (sentence) {
      sentence.times_used++;
      sentence.last_used = new Date().toISOString();
      this.save();
    }
  }

  /**
   * Get sentences by pattern
   */
  getByPattern(patternName) {
    return this.corpus.sentences.filter(s => s.pattern === patternName);
  }

  /**
   * Get verified sentences only
   */
  getVerified() {
    return this.corpus.sentences.filter(s => s.verified);
  }

  /**
   * Get sentences for LLM fine-tuning
   * Format: [{input: "...", output: "..."}]
   */
  getForFineTuning(format = 'openai') {
    const verified = this.getVerified();

    if (format === 'openai') {
      // OpenAI fine-tuning format
      return verified.map(s => ({
        messages: [
          {
            role: "system",
            content: "You are a Soussou language expert. Translate French to Soussou."
          },
          {
            role: "user",
            content: s.french
          },
          {
            role: "assistant",
            content: s.soussou
          }
        ]
      }));
    }

    if (format === 'gemini') {
      // Google Gemini format
      return verified.map(s => ({
        text_input: s.french,
        output: s.soussou
      }));
    }

    return verified;
  }

  /**
   * Export for RAG (Retrieval-Augmented Generation)
   */
  exportForRAG() {
    return this.corpus.sentences.map(s => ({
      id: s.id,
      content: `Soussou: ${s.soussou}\nFrench: ${s.french}\nPattern: ${s.pattern}`,
      metadata: {
        verified: s.verified,
        confidence: s.confidence_score,
        pattern: s.pattern,
        tags: s.tags
      }
    }));
  }

  /**
   * Statistics
   */
  getStats() {
    const verified = this.getVerified();

    // Pattern distribution
    const patternCounts = {};
    this.corpus.sentences.forEach(s => {
      const pattern = s.pattern || 'unknown';
      patternCounts[pattern] = (patternCounts[pattern] || 0) + 1;
    });

    // Source distribution
    const sourceCounts = this.corpus.metadata.sources;

    return {
      total_sentences: this.corpus.metadata.total_sentences,
      verified_sentences: this.corpus.metadata.verified_sentences,
      verification_rate: (verified.length / this.corpus.sentences.length * 100).toFixed(2) + '%',
      patterns: patternCounts,
      sources: sourceCounts,
      avg_confidence: (this.corpus.sentences.reduce((sum, s) => sum + s.confidence_score, 0) / this.corpus.sentences.length).toFixed(2),
      most_used: this.corpus.sentences
        .sort((a, b) => b.times_used - a.times_used)
        .slice(0, 10)
        .map(s => ({ sentence: s.soussou, uses: s.times_used }))
    };
  }
}

export default SentenceCorpus;

/**
 * USAGE EXAMPLE:
 *
 * const corpus = new SentenceCorpus('/path/to/data');
 *
 * // Add Z-Core's taught sentences
 * corpus.addSentence({
 *   soussou: "Ma woto fan mafoura",
 *   french: "Ma voiture est aussi rapide",
 *   english: "My car is also fast",
 *   pattern: "intensifier_with_fan",
 *   verified: true,
 *   verified_by: "Z-Core",
 *   source: "user_taught",
 *   contributed_by: "Z-Core",
 *   tags: ["transportation", "adjective", "intensifier"],
 *   confidence_score: 1.0
 * });
 *
 * // Get for fine-tuning
 * const trainingData = corpus.getForFineTuning('openai');
 * // Save to file for GPT fine-tuning
 *
 * // Get for RAG
 * const ragData = corpus.exportForRAG();
 * // Use with vector database for LLM context
 */
