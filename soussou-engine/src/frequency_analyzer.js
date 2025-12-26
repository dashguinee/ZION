#!/usr/bin/env node

/**
 * Soussou Engine - Word Frequency Analyzer
 *
 * Analyzes word frequencies across the entire Soussou corpus to identify:
 * - Most common Susu words for learning prioritization
 * - Most common English words from parallel text
 * - Word co-occurrence patterns
 * - Core vocabulary vs rare words
 *
 * Usage:
 *   node src/frequency_analyzer.js              # Run full analysis
 *   node src/frequency_analyzer.js --top 100    # Show top 100 words
 *   node src/frequency_analyzer.js --export     # Export to frequency_analysis.json
 */

const fs = require('fs');
const path = require('path');

// =============================================================================
// CONSTANTS
// =============================================================================

const DATA_DIR = path.join(__dirname, '..', 'data');
const OUTPUT_FILE = path.join(DATA_DIR, 'frequency_analysis.json');

// Stop words to optionally filter (common grammatical words)
const SUSU_STOP_WORDS = new Set([
  'a', 'e', 'i', 'o', 'u', 'na', 'ma', 'ra', 'xa', 'yi', 'nu', 'mu', 'ba', 'fa',
  'nan', 'nɛ', 'ne', 'ki', 'di', 'nun', 'naxa'
]);

const ENGLISH_STOP_WORDS = new Set([
  'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
  'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should',
  'may', 'might', 'must', 'shall', 'can', 'need', 'dare', 'ought', 'used',
  'to', 'of', 'in', 'for', 'on', 'with', 'at', 'by', 'from', 'as', 'into',
  'through', 'during', 'before', 'after', 'above', 'below', 'between',
  'and', 'but', 'or', 'nor', 'so', 'yet', 'both', 'either', 'neither',
  'not', 'only', 'own', 'same', 'than', 'too', 'very', 'just',
  'i', 'me', 'my', 'myself', 'we', 'our', 'ours', 'ourselves',
  'you', 'your', 'yours', 'yourself', 'yourselves',
  'he', 'him', 'his', 'himself', 'she', 'her', 'hers', 'herself',
  'it', 'its', 'itself', 'they', 'them', 'their', 'theirs', 'themselves',
  'what', 'which', 'who', 'whom', 'this', 'that', 'these', 'those',
  'am', 'if', 'then', 'because', 'while', 'although', 'unless', 'until',
  'when', 'where', 'why', 'how', 'all', 'each', 'every', 'any', 'some',
  'no', 'more', 'most', 'other', 'such', 'about', 'over', 'out', 'up', 'down'
]);

// =============================================================================
// TOKENIZATION
// =============================================================================

/**
 * Tokenize Susu text into words
 * Handles special characters and diacritics common in Susu
 */
function tokenizeSusu(text) {
  if (!text || typeof text !== 'string') return [];

  // Normalize text
  let normalized = text
    .toLowerCase()
    .replace(/[""''«»]/g, '') // Remove quotes
    .replace(/[.,;:!?()[\]{}]/g, ' ') // Replace punctuation with space
    .replace(/[''-]/g, '') // Remove apostrophes and hyphens within words
    .replace(/\d+/g, ' ') // Remove numbers
    .replace(/\s+/g, ' ') // Collapse whitespace
    .trim();

  // Split and filter
  return normalized
    .split(' ')
    .filter(word => word.length > 0 && !/^\d+$/.test(word));
}

/**
 * Tokenize English text into words
 */
function tokenizeEnglish(text) {
  if (!text || typeof text !== 'string') return [];

  return text
    .toLowerCase()
    .replace(/[""''«»]/g, '')
    .replace(/[.,;:!?()[\]{}]/g, ' ')
    .replace(/[''-]/g, "'") // Normalize apostrophes
    .replace(/\d+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .filter(word => word.length > 0 && !/^\d+$/.test(word));
}

// =============================================================================
// FREQUENCY ANALYSIS
// =============================================================================

class FrequencyAnalyzer {
  constructor() {
    this.susuFrequency = new Map();
    this.englishFrequency = new Map();
    this.susuBigrams = new Map(); // Word pairs
    this.englishBigrams = new Map();
    this.coOccurrences = new Map(); // Susu-English word co-occurrences
    this.totalSusuWords = 0;
    this.totalEnglishWords = 0;
    this.totalSentences = 0;
    this.sources = {};
  }

  /**
   * Load and analyze all data sources
   */
  async analyze() {
    console.log('Starting frequency analysis...\n');

    // Load unified index (main corpus)
    await this.loadUnifiedIndex();

    // Load Bible parallel corpus
    await this.loadBibleCorpus();

    console.log('\nAnalysis complete!');
    console.log(`Total Susu words processed: ${this.totalSusuWords.toLocaleString()}`);
    console.log(`Total English words processed: ${this.totalEnglishWords.toLocaleString()}`);
    console.log(`Total sentences analyzed: ${this.totalSentences.toLocaleString()}`);
    console.log(`Unique Susu words: ${this.susuFrequency.size.toLocaleString()}`);
    console.log(`Unique English words: ${this.englishFrequency.size.toLocaleString()}`);
  }

  /**
   * Load unified_index.json and analyze sentences
   */
  async loadUnifiedIndex() {
    const indexPath = path.join(DATA_DIR, 'unified_index.json');

    if (!fs.existsSync(indexPath)) {
      console.log('Warning: unified_index.json not found');
      return;
    }

    console.log('Loading unified_index.json...');
    const data = JSON.parse(fs.readFileSync(indexPath, 'utf8'));

    // Process sentences
    if (data.sentences && Array.isArray(data.sentences)) {
      console.log(`Processing ${data.sentences.length} sentences from unified index...`);

      for (const sentence of data.sentences) {
        this.processSentencePair(sentence.susu, sentence.english, sentence.source || 'unified');
      }
    }

    // Also extract from en_to_sus dictionary
    if (data.en_to_sus) {
      console.log(`Processing ${Object.keys(data.en_to_sus).length} dictionary entries...`);

      for (const [english, translations] of Object.entries(data.en_to_sus)) {
        // Count English word
        const englishWords = tokenizeEnglish(english);
        for (const word of englishWords) {
          this.incrementFrequency(this.englishFrequency, word);
          this.totalEnglishWords++;
        }

        // Count Susu translations
        for (const entry of translations) {
          if (entry.translations) {
            for (const susu of entry.translations) {
              const susuWords = tokenizeSusu(susu);
              for (const word of susuWords) {
                this.incrementFrequency(this.susuFrequency, word);
                this.totalSusuWords++;
              }
            }
          }
        }
      }
    }
  }

  /**
   * Load Bible parallel corpus
   */
  async loadBibleCorpus() {
    const biblePath = path.join(DATA_DIR, 'bible_susu', 'bible_parallel_corpus.json');

    if (!fs.existsSync(biblePath)) {
      console.log('Warning: bible_parallel_corpus.json not found');
      return;
    }

    console.log('Loading Bible parallel corpus...');
    const verses = JSON.parse(fs.readFileSync(biblePath, 'utf8'));

    console.log(`Processing ${verses.length} Bible verses...`);

    for (const verse of verses) {
      this.processSentencePair(verse.susu, verse.english, 'bible');
    }
  }

  /**
   * Process a parallel sentence pair
   */
  processSentencePair(susu, english, source) {
    if (!susu && !english) return;

    this.totalSentences++;
    this.sources[source] = (this.sources[source] || 0) + 1;

    // Tokenize
    const susuWords = tokenizeSusu(susu);
    const englishWords = tokenizeEnglish(english);

    // Count Susu words
    for (let i = 0; i < susuWords.length; i++) {
      const word = susuWords[i];
      this.incrementFrequency(this.susuFrequency, word);
      this.totalSusuWords++;

      // Count bigrams
      if (i < susuWords.length - 1) {
        const bigram = `${word} ${susuWords[i + 1]}`;
        this.incrementFrequency(this.susuBigrams, bigram);
      }
    }

    // Count English words
    for (let i = 0; i < englishWords.length; i++) {
      const word = englishWords[i];
      this.incrementFrequency(this.englishFrequency, word);
      this.totalEnglishWords++;

      // Count bigrams
      if (i < englishWords.length - 1) {
        const bigram = `${word} ${englishWords[i + 1]}`;
        this.incrementFrequency(this.englishBigrams, bigram);
      }
    }

    // Track co-occurrences (which Susu words appear with which English words)
    for (const susuWord of susuWords) {
      if (!this.coOccurrences.has(susuWord)) {
        this.coOccurrences.set(susuWord, new Map());
      }
      const coMap = this.coOccurrences.get(susuWord);
      for (const engWord of englishWords) {
        coMap.set(engWord, (coMap.get(engWord) || 0) + 1);
      }
    }
  }

  /**
   * Increment frequency counter
   */
  incrementFrequency(map, word) {
    map.set(word, (map.get(word) || 0) + 1);
  }

  /**
   * Get sorted frequency list
   */
  getSortedFrequencies(map, limit = null) {
    const sorted = Array.from(map.entries())
      .sort((a, b) => b[1] - a[1]);

    return limit ? sorted.slice(0, limit) : sorted;
  }

  /**
   * Get top N Susu words
   */
  getTopSusuWords(n = 1000, excludeStopWords = false) {
    let entries = this.getSortedFrequencies(this.susuFrequency);

    if (excludeStopWords) {
      entries = entries.filter(([word]) => !SUSU_STOP_WORDS.has(word));
    }

    return entries.slice(0, n).map(([word, count]) => ({
      word,
      count,
      frequency: (count / this.totalSusuWords * 100).toFixed(4)
    }));
  }

  /**
   * Get top N English words
   */
  getTopEnglishWords(n = 1000, excludeStopWords = false) {
    let entries = this.getSortedFrequencies(this.englishFrequency);

    if (excludeStopWords) {
      entries = entries.filter(([word]) => !ENGLISH_STOP_WORDS.has(word));
    }

    return entries.slice(0, n).map(([word, count]) => ({
      word,
      count,
      frequency: (count / this.totalEnglishWords * 100).toFixed(4)
    }));
  }

  /**
   * Get frequency of a specific word
   */
  getWordFrequency(word, language = 'susu') {
    const map = language === 'susu' ? this.susuFrequency : this.englishFrequency;
    const total = language === 'susu' ? this.totalSusuWords : this.totalEnglishWords;
    const count = map.get(word.toLowerCase()) || 0;

    return {
      word: word.toLowerCase(),
      count,
      frequency: total > 0 ? (count / total * 100).toFixed(4) : '0',
      rank: this.getWordRank(word, language)
    };
  }

  /**
   * Get rank of a word in frequency list
   */
  getWordRank(word, language = 'susu') {
    const map = language === 'susu' ? this.susuFrequency : this.englishFrequency;
    const sorted = this.getSortedFrequencies(map);
    const index = sorted.findIndex(([w]) => w === word.toLowerCase());
    return index >= 0 ? index + 1 : null;
  }

  /**
   * Get core vocabulary (words appearing 10+ times)
   */
  getCoreVocabulary(minOccurrences = 10) {
    const susuCore = Array.from(this.susuFrequency.entries())
      .filter(([, count]) => count >= minOccurrences)
      .sort((a, b) => b[1] - a[1])
      .map(([word, count]) => ({ word, count }));

    const englishCore = Array.from(this.englishFrequency.entries())
      .filter(([, count]) => count >= minOccurrences)
      .sort((a, b) => b[1] - a[1])
      .map(([word, count]) => ({ word, count }));

    return {
      susu: susuCore,
      english: englishCore,
      susuCount: susuCore.length,
      englishCount: englishCore.length
    };
  }

  /**
   * Get rare words (appearing only once - hapax legomena)
   */
  getRareWords() {
    const susuRare = Array.from(this.susuFrequency.entries())
      .filter(([, count]) => count === 1)
      .map(([word]) => word);

    const englishRare = Array.from(this.englishFrequency.entries())
      .filter(([, count]) => count === 1)
      .map(([word]) => word);

    return {
      susu: susuRare,
      english: englishRare,
      susuCount: susuRare.length,
      englishCount: englishRare.length
    };
  }

  /**
   * Get common word pairs/phrases (bigrams)
   */
  getCommonPhrases(n = 100, language = 'susu') {
    const map = language === 'susu' ? this.susuBigrams : this.englishBigrams;
    return this.getSortedFrequencies(map, n)
      .map(([phrase, count]) => ({ phrase, count }));
  }

  /**
   * Get Susu words that commonly co-occur with an English word
   */
  getTranslationCandidates(englishWord, topN = 10) {
    const candidates = [];

    for (const [susuWord, coMap] of this.coOccurrences.entries()) {
      const count = coMap.get(englishWord.toLowerCase()) || 0;
      if (count > 0) {
        candidates.push({ susuWord, count });
      }
    }

    return candidates
      .sort((a, b) => b.count - a.count)
      .slice(0, topN);
  }

  /**
   * Generate full analysis report
   */
  generateReport() {
    return {
      metadata: {
        generatedAt: new Date().toISOString(),
        totalSusuWords: this.totalSusuWords,
        totalEnglishWords: this.totalEnglishWords,
        totalSentences: this.totalSentences,
        uniqueSusuWords: this.susuFrequency.size,
        uniqueEnglishWords: this.englishFrequency.size,
        sources: this.sources
      },
      topSusuWords: this.getTopSusuWords(1000),
      topSusuWordsNoStopWords: this.getTopSusuWords(500, true),
      topEnglishWords: this.getTopEnglishWords(1000),
      topEnglishWordsNoStopWords: this.getTopEnglishWords(500, true),
      coreVocabulary: this.getCoreVocabulary(10),
      rareWords: {
        susuCount: this.getRareWords().susuCount,
        englishCount: this.getRareWords().englishCount,
        // Only include sample of rare words to save space
        susuSample: this.getRareWords().susu.slice(0, 100),
        englishSample: this.getRareWords().english.slice(0, 100)
      },
      commonSusuPhrases: this.getCommonPhrases(200, 'susu'),
      commonEnglishPhrases: this.getCommonPhrases(200, 'english'),
      frequencyDistribution: this.getFrequencyDistribution()
    };
  }

  /**
   * Get frequency distribution statistics
   */
  getFrequencyDistribution() {
    const susuCounts = Array.from(this.susuFrequency.values());
    const englishCounts = Array.from(this.englishFrequency.values());

    const getDistribution = (counts) => {
      if (counts.length === 0) return {};
      const sorted = counts.sort((a, b) => b - a);
      return {
        max: sorted[0],
        min: sorted[sorted.length - 1],
        mean: (counts.reduce((a, b) => a + b, 0) / counts.length).toFixed(2),
        median: sorted[Math.floor(sorted.length / 2)],
        hapaxLegomena: counts.filter(c => c === 1).length,
        disLegomena: counts.filter(c => c === 2).length,
        over10: counts.filter(c => c >= 10).length,
        over100: counts.filter(c => c >= 100).length,
        over1000: counts.filter(c => c >= 1000).length
      };
    };

    return {
      susu: getDistribution(susuCounts),
      english: getDistribution(englishCounts)
    };
  }

  /**
   * Export analysis to JSON file
   */
  exportToJSON(outputPath = OUTPUT_FILE) {
    const report = this.generateReport();
    fs.writeFileSync(outputPath, JSON.stringify(report, null, 2));
    console.log(`\nAnalysis exported to: ${outputPath}`);
    return outputPath;
  }
}

// =============================================================================
// EXPORTED FUNCTIONS (for use as module)
// =============================================================================

let _analyzer = null;

/**
 * Get or initialize the analyzer instance
 */
async function getAnalyzer() {
  if (!_analyzer) {
    _analyzer = new FrequencyAnalyzer();
    await _analyzer.analyze();
  }
  return _analyzer;
}

/**
 * Get top N Susu words
 */
async function getTopSusuWords(n = 100, excludeStopWords = false) {
  const analyzer = await getAnalyzer();
  return analyzer.getTopSusuWords(n, excludeStopWords);
}

/**
 * Get top N English words
 */
async function getTopEnglishWords(n = 100, excludeStopWords = false) {
  const analyzer = await getAnalyzer();
  return analyzer.getTopEnglishWords(n, excludeStopWords);
}

/**
 * Get frequency of a specific word
 */
async function getWordFrequency(word, language = 'susu') {
  const analyzer = await getAnalyzer();
  return analyzer.getWordFrequency(word, language);
}

/**
 * Get core vocabulary
 */
async function getCoreVocabulary(minOccurrences = 10) {
  const analyzer = await getAnalyzer();
  return analyzer.getCoreVocabulary(minOccurrences);
}

/**
 * Load pre-computed analysis from JSON file
 */
function loadAnalysis(filePath = OUTPUT_FILE) {
  if (!fs.existsSync(filePath)) {
    return null;
  }
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

// =============================================================================
// CLI EXECUTION
// =============================================================================

async function main() {
  const args = process.argv.slice(2);

  // Parse arguments
  const showHelp = args.includes('--help') || args.includes('-h');
  const exportFlag = args.includes('--export') || args.includes('-e');
  const topIndex = args.indexOf('--top');
  const topN = topIndex >= 0 ? parseInt(args[topIndex + 1]) || 50 : 50;
  const noStopWords = args.includes('--no-stopwords');
  const wordIndex = args.indexOf('--word');
  const lookupWord = wordIndex >= 0 ? args[wordIndex + 1] : null;

  if (showHelp) {
    console.log(`
Soussou Engine - Word Frequency Analyzer

Usage:
  node src/frequency_analyzer.js [options]

Options:
  --help, -h          Show this help message
  --export, -e        Export full analysis to data/frequency_analysis.json
  --top N             Show top N words (default: 50)
  --no-stopwords      Exclude common stop words from results
  --word WORD         Look up frequency of a specific word

Examples:
  node src/frequency_analyzer.js --top 100
  node src/frequency_analyzer.js --export
  node src/frequency_analyzer.js --word "ala" --no-stopwords
`);
    return;
  }

  // Run analysis
  const analyzer = new FrequencyAnalyzer();
  await analyzer.analyze();

  // Word lookup
  if (lookupWord) {
    console.log('\n--- Word Frequency Lookup ---');
    const susuFreq = analyzer.getWordFrequency(lookupWord, 'susu');
    const engFreq = analyzer.getWordFrequency(lookupWord, 'english');

    console.log(`\nSusu: "${lookupWord}"`);
    console.log(`  Count: ${susuFreq.count}`);
    console.log(`  Frequency: ${susuFreq.frequency}%`);
    console.log(`  Rank: ${susuFreq.rank || 'Not found'}`);

    console.log(`\nEnglish: "${lookupWord}"`);
    console.log(`  Count: ${engFreq.count}`);
    console.log(`  Frequency: ${engFreq.frequency}%`);
    console.log(`  Rank: ${engFreq.rank || 'Not found'}`);
    return;
  }

  // Show top words
  console.log(`\n--- Top ${topN} Susu Words ${noStopWords ? '(excluding stop words)' : ''} ---`);
  const topSusu = analyzer.getTopSusuWords(topN, noStopWords);
  topSusu.slice(0, 30).forEach((item, i) => {
    console.log(`${(i + 1).toString().padStart(3)}. ${item.word.padEnd(20)} ${item.count.toString().padStart(6)} (${item.frequency}%)`);
  });
  if (topN > 30) console.log(`    ... and ${topN - 30} more`);

  console.log(`\n--- Top ${topN} English Words ${noStopWords ? '(excluding stop words)' : ''} ---`);
  const topEng = analyzer.getTopEnglishWords(topN, noStopWords);
  topEng.slice(0, 30).forEach((item, i) => {
    console.log(`${(i + 1).toString().padStart(3)}. ${item.word.padEnd(20)} ${item.count.toString().padStart(6)} (${item.frequency}%)`);
  });
  if (topN > 30) console.log(`    ... and ${topN - 30} more`);

  // Core vocabulary summary
  const core = analyzer.getCoreVocabulary(10);
  console.log(`\n--- Core Vocabulary (10+ occurrences) ---`);
  console.log(`Susu core words: ${core.susuCount}`);
  console.log(`English core words: ${core.englishCount}`);

  // Rare words summary
  const rare = analyzer.getRareWords();
  console.log(`\n--- Rare Words (hapax legomena) ---`);
  console.log(`Susu rare words: ${rare.susuCount} (${(rare.susuCount / analyzer.susuFrequency.size * 100).toFixed(1)}% of vocabulary)`);
  console.log(`English rare words: ${rare.englishCount} (${(rare.englishCount / analyzer.englishFrequency.size * 100).toFixed(1)}% of vocabulary)`);

  // Common phrases
  console.log('\n--- Top 10 Susu Phrases ---');
  const susuPhrases = analyzer.getCommonPhrases(10, 'susu');
  susuPhrases.forEach((item, i) => {
    console.log(`${(i + 1).toString().padStart(3)}. "${item.phrase}" (${item.count})`);
  });

  // Export if requested
  if (exportFlag) {
    analyzer.exportToJSON();
  }
}

// Run if executed directly
if (require.main === module) {
  main().catch(console.error);
}

// =============================================================================
// MODULE EXPORTS
// =============================================================================

module.exports = {
  FrequencyAnalyzer,
  getTopSusuWords,
  getTopEnglishWords,
  getWordFrequency,
  getCoreVocabulary,
  loadAnalysis,
  tokenizeSusu,
  tokenizeEnglish,
  SUSU_STOP_WORDS,
  ENGLISH_STOP_WORDS
};
