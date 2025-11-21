/**
 * LLM INTEGRATION LAYER
 *
 * Allows GPT-4, Gemini, Claude to use our Soussou files
 *
 * Three approaches:
 * 1. RAG (Retrieval-Augmented Generation) - RECOMMENDED
 * 2. Fine-tuning - EXPENSIVE but powerful
 * 3. Prompt Engineering - IMMEDIATE, zero cost
 */

import SentenceCorpus from './sentence_corpus.js';

class LLMIntegration {
  constructor(lexicon, templates, corpus) {
    this.lexicon = lexicon;
    this.templates = templates;
    this.corpus = corpus;
  }

  /**
   * APPROACH 1: RAG (Retrieval-Augmented Generation)
   *
   * How it works:
   * 1. User asks: "How do I say 'my car is fast' in Soussou?"
   * 2. System searches corpus for similar sentences
   * 3. Returns relevant examples to LLM as context
   * 4. LLM generates answer using our verified data
   *
   * Speed: Fast (< 100ms search + LLM time)
   * Cost: Low (only pays for LLM tokens)
   * Accuracy: High (uses verified data)
   */
  async generateWithRAG(userQuery, llmClient) {
    // Step 1: Search corpus for relevant sentences
    const relevantSentences = this.searchCorpus(userQuery, limit = 5);

    // Step 2: Search lexicon for relevant words
    const relevantWords = this.searchLexicon(userQuery, limit = 10);

    // Step 3: Find matching patterns
    const relevantPatterns = this.searchPatterns(userQuery);

    // Step 4: Build context for LLM
    const context = this.buildRAGContext(relevantSentences, relevantWords, relevantPatterns);

    // Step 5: Call LLM with enriched context
    const prompt = `
You are a Soussou language expert. Use the following verified data to help the user.

VERIFIED SENTENCES:
${relevantSentences.map(s => `- ${s.soussou} = ${s.french} (${s.english})`).join('\n')}

VERIFIED WORDS:
${relevantWords.map(w => `- ${w.base}: ${w.english} / ${w.french} [${w.category}]`).join('\n')}

GRAMMAR PATTERNS:
${relevantPatterns.map(p => `- ${p.pattern}: ${p.examples.join(', ')}`).join('\n')}

User question: ${userQuery}

Provide accurate Soussou translation using the verified data above.
`;

    const response = await llmClient.generate(prompt);

    return {
      answer: response,
      sources: {
        sentences: relevantSentences.length,
        words: relevantWords.length,
        patterns: relevantPatterns.length
      },
      confidence: this.calculateConfidence(relevantSentences, relevantWords)
    };
  }

  /**
   * APPROACH 2: Fine-tuning Data Export
   *
   * Generate training files for GPT-4, Gemini, Claude fine-tuning
   *
   * Requirements:
   * - Minimum 100 verified sentences (we have potential for 1000s)
   * - Cost: $0.008/1K tokens for GPT-4 fine-tuning
   * - Training time: ~30 minutes
   */
  exportFineTuningData(format = 'openai') {
    const sentences = this.corpus.getVerified();

    if (sentences.length < 100) {
      console.warn(`⚠️  Only ${sentences.length} verified sentences. Recommend 100+ for fine-tuning.`);
    }

    if (format === 'openai') {
      // OpenAI JSONL format
      const jsonl = sentences.map(s => JSON.stringify({
        messages: [
          { role: "system", content: "You are a Soussou language expert." },
          { role: "user", content: `Translate to Soussou: ${s.french}` },
          { role: "assistant", content: s.soussou }
        ]
      })).join('\n');

      return {
        format: 'openai_jsonl',
        data: jsonl,
        sentence_count: sentences.length,
        estimated_cost: (sentences.length * 0.008).toFixed(2) + ' USD',
        instructions: 'Upload this file to OpenAI fine-tuning dashboard'
      };
    }

    if (format === 'gemini') {
      // Google Gemini tuning format
      return {
        format: 'gemini_csv',
        data: sentences.map(s => `"${s.french}","${s.soussou}"`).join('\n'),
        sentence_count: sentences.length,
        instructions: 'Upload to Google AI Studio for tuning'
      };
    }

    if (format === 'claude') {
      // Anthropic Claude (similar to OpenAI)
      return {
        format: 'claude_jsonl',
        data: sentences.map(s => JSON.stringify({
          prompt: `Human: Translate to Soussou: ${s.french}\n\nAssistant:`,
          completion: ` ${s.soussou}`
        })).join('\n'),
        sentence_count: sentences.length
      };
    }
  }

  /**
   * APPROACH 3: Prompt Engineering (Zero-shot)
   *
   * Load lexicon + patterns into system prompt
   *
   * Pros: Immediate, no training needed
   * Cons: Limited by context window
   */
  generateSystemPrompt(includeExamples = 20) {
    const topWords = this.lexicon
      .filter(w => w.english && w.french)
      .slice(0, 100); // Top 100 verified words

    const exampleSentences = this.corpus
      .getVerified()
      .slice(0, includeExamples);

    const patterns = Object.entries(this.templates.templates)
      .slice(0, 10); // Top 10 patterns

    return `
You are a Soussou language AI assistant.

SOUSSOU LEXICON (verified words):
${topWords.map(w => `${w.base} = ${w.english} / ${w.french}`).join('\n')}

GRAMMAR PATTERNS:
${patterns.map(([name, p]) => `${name}: ${p.pattern}\n  Example: ${p.examples[0]}`).join('\n\n')}

VERIFIED SENTENCES:
${exampleSentences.map(s => `${s.soussou} = ${s.french}`).join('\n')}

PHONETIC RULES:
- No copula "to be" - say "Ma woto mafoura" not "Ma woto is mafoura"
- Intensifier "fan" = "is also" (between noun and adjective)
- Question marker "eske" at start for formal questions
- Confirmation tag "ka" at end for "right?"

Use this knowledge to translate and teach Soussou accurately.
`;
  }

  /**
   * Search corpus for relevant sentences
   */
  searchCorpus(query, limit = 5) {
    // Simple keyword matching (can be enhanced with embeddings)
    const keywords = query.toLowerCase().split(' ');

    const results = this.corpus.sentences
      .map(s => {
        const score = keywords.reduce((acc, word) => {
          if (s.soussou.toLowerCase().includes(word)) acc += 2;
          if (s.french.toLowerCase().includes(word)) acc += 1;
          if (s.english?.toLowerCase().includes(word)) acc += 1;
          return acc;
        }, 0);

        return { ...s, relevance_score: score };
      })
      .filter(s => s.relevance_score > 0 && s.verified)
      .sort((a, b) => b.relevance_score - a.relevance_score)
      .slice(0, limit);

    return results;
  }

  /**
   * Search lexicon for relevant words
   */
  searchLexicon(query, limit = 10) {
    const keywords = query.toLowerCase().split(' ');

    return this.lexicon
      .filter(w => {
        return keywords.some(kw =>
          w.base.toLowerCase().includes(kw) ||
          w.english?.toLowerCase().includes(kw) ||
          w.french?.toLowerCase().includes(kw)
        );
      })
      .filter(w => w.english && w.french) // Only verified
      .slice(0, limit);
  }

  /**
   * Search patterns
   */
  searchPatterns(query) {
    // Find patterns that match query intent
    const patterns = [];

    if (query.includes('question') || query.includes('?')) {
      patterns.push(this.templates.templates.formal_question_eske);
      patterns.push(this.templates.templates.confirmation_tag_ka);
    }

    if (query.includes('also') || query.includes('aussi')) {
      patterns.push(this.templates.templates.intensifier_with_fan);
    }

    return patterns;
  }

  /**
   * Build RAG context string
   */
  buildRAGContext(sentences, words, patterns) {
    return {
      sentences: sentences.map(s => ({
        soussou: s.soussou,
        french: s.french,
        english: s.english
      })),
      words: words.map(w => ({
        base: w.base,
        english: w.english,
        french: w.french,
        category: w.category
      })),
      patterns: patterns.map(p => ({
        pattern: p.pattern,
        examples: p.examples
      }))
    };
  }

  /**
   * Calculate confidence based on available data
   */
  calculateConfidence(sentences, words) {
    const sentenceConfidence = Math.min(sentences.length / 3, 1.0); // 3+ sentences = full confidence
    const wordConfidence = Math.min(words.length / 5, 1.0); // 5+ words = full confidence

    return ((sentenceConfidence + wordConfidence) / 2).toFixed(2);
  }
}

export default LLMIntegration;

/**
 * USAGE EXAMPLE - RAG with OpenAI:
 *
 * import OpenAI from 'openai';
 * const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
 *
 * const integration = new LLMIntegration(lexicon, templates, corpus);
 *
 * const result = await integration.generateWithRAG(
 *   "How do I say 'my car is fast' in Soussou?",
 *   {
 *     generate: async (prompt) => {
 *       const response = await openai.chat.completions.create({
 *         model: "gpt-4",
 *         messages: [{ role: "user", content: prompt }]
 *       });
 *       return response.choices[0].message.content;
 *     }
 *   }
 * );
 *
 * console.log(result.answer); // "Ma woto mafoura"
 * console.log(result.confidence); // 0.95
 */

/**
 * USAGE EXAMPLE - Fine-tuning export:
 *
 * const integration = new LLMIntegration(lexicon, templates, corpus);
 *
 * // Export for OpenAI fine-tuning
 * const finetune = integration.exportFineTuningData('openai');
 * fs.writeFileSync('soussou_training.jsonl', finetune.data);
 *
 * // Then upload to OpenAI:
 * // openai api fine_tunes.create -t soussou_training.jsonl -m gpt-3.5-turbo
 */

/**
 * USAGE EXAMPLE - Prompt engineering:
 *
 * const systemPrompt = integration.generateSystemPrompt(20);
 *
 * const response = await openai.chat.completions.create({
 *   model: "gpt-4",
 *   messages: [
 *     { role: "system", content: systemPrompt },
 *     { role: "user", content: "How do I say 'Is my boat also pretty?' in Soussou?" }
 *   ]
 * });
 *
 * // GPT-4 will use our lexicon + patterns to answer accurately
 */
