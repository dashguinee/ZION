/**
 * Translation Quality Scorer for Soussou Engine
 *
 * Compares our translations with Google Translate to measure quality.
 * Uses multiple metrics: word overlap, character similarity, orthographic equivalence.
 *
 * Corpus: 30,966 Bible verses (English-Susu parallel)
 * Goal: Validate our translation engine against Google's output
 */

const fs = require('fs');
const path = require('path');
const { translateToSusu, translateFromSusu } = require('../scripts/google_translate_susu');
const { normalizeEither, areOrthographicallyEquivalent } = require('./orthography_converter');

// =============================================================================
// SIMILARITY METRICS
// =============================================================================

/**
 * Jaccard similarity (word overlap)
 * Range: 0 to 1 (1 = identical word sets)
 *
 * @param {string} text1 - First text
 * @param {string} text2 - Second text
 * @returns {number} Jaccard similarity score
 */
function jaccardSimilarity(text1, text2) {
  if (!text1 || !text2) return 0;

  const words1 = new Set(normalizeForComparison(text1).split(/\s+/).filter(w => w.length > 0));
  const words2 = new Set(normalizeForComparison(text2).split(/\s+/).filter(w => w.length > 0));

  if (words1.size === 0 && words2.size === 0) return 1;
  if (words1.size === 0 || words2.size === 0) return 0;

  const intersection = [...words1].filter(w => words2.has(w));
  const union = new Set([...words1, ...words2]);

  return intersection.length / union.size;
}

/**
 * Levenshtein distance (character-level edit distance)
 * Returns normalized similarity: 1 - (distance / max_length)
 *
 * @param {string} str1 - First string
 * @param {string} str2 - Second string
 * @returns {number} Normalized similarity score (0 to 1)
 */
function levenshteinSimilarity(str1, str2) {
  const s1 = normalizeForComparison(str1);
  const s2 = normalizeForComparison(str2);

  if (s1 === s2) return 1;
  if (s1.length === 0 || s2.length === 0) return 0;

  const matrix = [];

  // Initialize matrix
  for (let i = 0; i <= s1.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= s2.length; j++) {
    matrix[0][j] = j;
  }

  // Fill in the matrix
  for (let i = 1; i <= s1.length; i++) {
    for (let j = 1; j <= s2.length; j++) {
      const cost = s1[i - 1] === s2[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,     // deletion
        matrix[i][j - 1] + 1,     // insertion
        matrix[i - 1][j - 1] + cost // substitution
      );
    }
  }

  const distance = matrix[s1.length][s2.length];
  const maxLength = Math.max(s1.length, s2.length);

  return 1 - (distance / maxLength);
}

/**
 * Orthographic equivalence using our orthography converter
 * Returns 1 if texts normalize to same form, otherwise Jaccard on normalized forms
 *
 * @param {string} text1 - First text
 * @param {string} text2 - Second text
 * @returns {number} Orthographic similarity (0 to 1)
 */
function orthographicSimilarity(text1, text2) {
  if (!text1 || !text2) return 0;

  // Check if orthographically equivalent
  if (areOrthographicallyEquivalent(text1, text2)) {
    return 1;
  }

  // Otherwise, compare normalized forms with Jaccard
  const norm1 = normalizeEither(text1);
  const norm2 = normalizeEither(text2);

  return jaccardSimilarity(norm1, norm2);
}

/**
 * Normalize text for comparison
 * Removes punctuation, lowercases, handles Susu special characters
 *
 * @param {string} text - Text to normalize
 * @returns {string} Normalized text
 */
function normalizeForComparison(text) {
  if (!text) return '';

  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
    .replace(/['''`]/g, '')          // Remove apostrophes
    .replace(/[.,!?;:"""«»—–\-()[\]{}]/g, '') // Remove punctuation
    .replace(/\s+/g, ' ')
    .trim();
}

// =============================================================================
// SCORING FUNCTIONS
// =============================================================================

/**
 * Score a single translation comparison
 *
 * @param {string} ourTranslation - Our translation output
 * @param {string} googleTranslation - Google's translation output
 * @param {Object} options - Scoring options
 * @returns {Object} Detailed score breakdown
 */
function scoreTranslation(ourTranslation, googleTranslation, options = {}) {
  const jaccard = jaccardSimilarity(ourTranslation, googleTranslation);
  const levenshtein = levenshteinSimilarity(ourTranslation, googleTranslation);
  const orthographic = orthographicSimilarity(ourTranslation, googleTranslation);

  // Weighted composite score
  const weights = options.weights || { jaccard: 0.4, levenshtein: 0.3, orthographic: 0.3 };
  const composite = (
    jaccard * weights.jaccard +
    levenshtein * weights.levenshtein +
    orthographic * weights.orthographic
  );

  // Word-level analysis
  const ourWords = normalizeForComparison(ourTranslation).split(/\s+/).filter(w => w);
  const googleWords = normalizeForComparison(googleTranslation).split(/\s+/).filter(w => w);

  const ourSet = new Set(ourWords);
  const googleSet = new Set(googleWords);

  const commonWords = ourWords.filter(w => googleSet.has(w));
  const onlyInOurs = ourWords.filter(w => !googleSet.has(w));
  const onlyInGoogle = googleWords.filter(w => !ourSet.has(w));

  return {
    scores: {
      jaccard,
      levenshtein,
      orthographic,
      composite
    },
    texts: {
      ours: ourTranslation,
      google: googleTranslation,
      oursNormalized: normalizeEither(ourTranslation),
      googleNormalized: normalizeEither(googleTranslation)
    },
    wordAnalysis: {
      common: commonWords,
      onlyInOurs,
      onlyInGoogle,
      commonCount: commonWords.length,
      oursTotal: ourWords.length,
      googleTotal: googleWords.length
    },
    agreement: composite >= 0.7 ? 'high' : composite >= 0.4 ? 'medium' : 'low'
  };
}

// =============================================================================
// BATCH TESTING
// =============================================================================

/**
 * Load the Bible corpus
 *
 * @returns {Array} Array of verse objects { verse_num, english, susu }
 */
function loadCorpus() {
  const corpusPath = path.join(__dirname, '..', 'data', 'bible_susu', 'bible_parallel_corpus.json');

  if (!fs.existsSync(corpusPath)) {
    throw new Error(`Corpus not found at: ${corpusPath}`);
  }

  return JSON.parse(fs.readFileSync(corpusPath, 'utf8'));
}

/**
 * Get random samples from corpus
 *
 * @param {number} n - Number of samples
 * @param {Array} corpus - Corpus array (optional, will load if not provided)
 * @returns {Array} Random sample of verses
 */
function getRandomSamples(n, corpus = null) {
  const data = corpus || loadCorpus();
  const shuffled = [...data].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(n, data.length));
}

/**
 * Run batch quality check against Google Translate
 * Compares our Susu translations with Google's for the same English input
 *
 * @param {number} n - Number of samples to test
 * @param {Object} options - Options { verbose, delay }
 * @returns {Object} Batch results with statistics
 */
async function batchQualityCheck(n = 10, options = {}) {
  const { verbose = false, delay = 200 } = options;

  // Check API key
  if (!process.env.GOOGLE_TRANSLATE_API_KEY) {
    throw new Error('GOOGLE_TRANSLATE_API_KEY environment variable not set');
  }

  console.log(`\nRunning batch quality check on ${n} samples...\n`);

  const samples = getRandomSamples(n);
  const results = [];
  const errors = [];

  for (let i = 0; i < samples.length; i++) {
    const sample = samples[i];

    if (verbose) {
      console.log(`[${i + 1}/${n}] Testing verse ${sample.verse_num}...`);
    }

    try {
      // Get Google's translation for the same English input
      const googleTranslation = await translateToSusu(sample.english);

      // Score our translation vs Google's
      const score = scoreTranslation(sample.susu, googleTranslation);

      results.push({
        verseNum: sample.verse_num,
        english: sample.english,
        ourSusu: sample.susu,
        googleSusu: googleTranslation,
        score
      });

      if (verbose) {
        console.log(`   Composite: ${(score.scores.composite * 100).toFixed(1)}% [${score.agreement}]`);
      }

    } catch (error) {
      errors.push({
        verseNum: sample.verse_num,
        english: sample.english,
        error: error.message
      });

      if (verbose) {
        console.log(`   ERROR: ${error.message}`);
      }
    }

    // Rate limiting
    if (i < samples.length - 1) {
      await new Promise(r => setTimeout(r, delay));
    }
  }

  // Calculate aggregate statistics
  const stats = calculateBatchStats(results);

  return {
    sampleSize: n,
    successCount: results.length,
    errorCount: errors.length,
    results,
    errors,
    stats
  };
}

/**
 * Calculate aggregate statistics from batch results
 *
 * @param {Array} results - Array of scored results
 * @returns {Object} Aggregate statistics
 */
function calculateBatchStats(results) {
  if (results.length === 0) {
    return {
      avgJaccard: 0,
      avgLevenshtein: 0,
      avgOrthographic: 0,
      avgComposite: 0,
      highAgreement: 0,
      mediumAgreement: 0,
      lowAgreement: 0
    };
  }

  const sums = {
    jaccard: 0,
    levenshtein: 0,
    orthographic: 0,
    composite: 0
  };

  const agreements = { high: 0, medium: 0, low: 0 };

  for (const r of results) {
    sums.jaccard += r.score.scores.jaccard;
    sums.levenshtein += r.score.scores.levenshtein;
    sums.orthographic += r.score.scores.orthographic;
    sums.composite += r.score.scores.composite;
    agreements[r.score.agreement]++;
  }

  const n = results.length;

  return {
    avgJaccard: sums.jaccard / n,
    avgLevenshtein: sums.levenshtein / n,
    avgOrthographic: sums.orthographic / n,
    avgComposite: sums.composite / n,
    highAgreement: agreements.high,
    mediumAgreement: agreements.medium,
    lowAgreement: agreements.low,
    highAgreementPct: (agreements.high / n * 100),
    mediumAgreementPct: (agreements.medium / n * 100),
    lowAgreementPct: (agreements.low / n * 100)
  };
}

// =============================================================================
// REPORT GENERATION
// =============================================================================

/**
 * Generate a comprehensive quality report
 *
 * @param {Object} batchResults - Results from batchQualityCheck
 * @param {Object} options - Report options
 * @returns {Object} Structured report
 */
function generateReport(batchResults, options = {}) {
  const { includeExamples = true, exampleLimit = 5 } = options;

  const report = {
    summary: {
      title: 'Soussou Engine Translation Quality Report',
      timestamp: new Date().toISOString(),
      sampleSize: batchResults.sampleSize,
      successfulTests: batchResults.successCount,
      errors: batchResults.errorCount
    },
    overallAgreement: {
      compositeScore: (batchResults.stats.avgComposite * 100).toFixed(1) + '%',
      interpretation: interpretScore(batchResults.stats.avgComposite),
      breakdown: {
        jaccardAvg: (batchResults.stats.avgJaccard * 100).toFixed(1) + '%',
        levenshteinAvg: (batchResults.stats.avgLevenshtein * 100).toFixed(1) + '%',
        orthographicAvg: (batchResults.stats.avgOrthographic * 100).toFixed(1) + '%'
      }
    },
    agreementDistribution: {
      high: `${batchResults.stats.highAgreement} (${batchResults.stats.highAgreementPct.toFixed(1)}%)`,
      medium: `${batchResults.stats.mediumAgreement} (${batchResults.stats.mediumAgreementPct.toFixed(1)}%)`,
      low: `${batchResults.stats.lowAgreement} (${batchResults.stats.lowAgreementPct.toFixed(1)}%)`
    },
    commonDifferences: analyzeCommonDifferences(batchResults.results),
    wordDiscrepancies: analyzeWordDiscrepancies(batchResults.results)
  };

  if (includeExamples) {
    // Best examples (highest agreement)
    const sorted = [...batchResults.results].sort(
      (a, b) => b.score.scores.composite - a.score.scores.composite
    );

    report.examples = {
      best: sorted.slice(0, exampleLimit).map(r => ({
        english: r.english,
        ourSusu: r.ourSusu,
        googleSusu: r.googleSusu,
        score: (r.score.scores.composite * 100).toFixed(1) + '%'
      })),
      worst: sorted.slice(-exampleLimit).reverse().map(r => ({
        english: r.english,
        ourSusu: r.ourSusu,
        googleSusu: r.googleSusu,
        score: (r.score.scores.composite * 100).toFixed(1) + '%'
      }))
    };
  }

  return report;
}

/**
 * Interpret a composite score
 *
 * @param {number} score - Composite score (0 to 1)
 * @returns {string} Human-readable interpretation
 */
function interpretScore(score) {
  if (score >= 0.8) return 'Excellent - Our translations closely match Google';
  if (score >= 0.6) return 'Good - Strong agreement with some variation';
  if (score >= 0.4) return 'Moderate - Notable differences but core meaning likely preserved';
  if (score >= 0.2) return 'Low - Significant differences, review recommended';
  return 'Very Low - Major discrepancies, investigation needed';
}

/**
 * Analyze common difference patterns
 *
 * @param {Array} results - Batch results
 * @returns {Object} Common difference patterns
 */
function analyzeCommonDifferences(results) {
  const patterns = {
    apostropheUsage: 0,
    gnVsNy: 0,
    diacriticDifferences: 0,
    wordOrderDifferences: 0
  };

  for (const r of results) {
    const ours = r.ourSusu || '';
    const google = r.googleSusu || '';

    // Check apostrophe patterns
    if ((ours.includes("'") || ours.includes("'")) !== (google.includes("'") || google.includes("'"))) {
      patterns.apostropheUsage++;
    }

    // Check gn vs ny
    if ((ours.toLowerCase().includes('gn') && google.toLowerCase().includes('ny')) ||
        (ours.toLowerCase().includes('ny') && google.toLowerCase().includes('gn'))) {
      patterns.gnVsNy++;
    }

    // Check diacritics
    const oursHasDiacritics = /[àâäéèêëîïôöùûüçñ]/i.test(ours);
    const googleHasDiacritics = /[àâäéèêëîïôöùûüçñ]/i.test(google);
    if (oursHasDiacritics !== googleHasDiacritics) {
      patterns.diacriticDifferences++;
    }

    // Check word order (simple heuristic: same words, different order)
    const ourWords = normalizeForComparison(ours).split(/\s+/);
    const googleWords = normalizeForComparison(google).split(/\s+/);
    const ourSet = new Set(ourWords);
    const googleSet = new Set(googleWords);

    // If 70%+ words overlap but Jaccard < 0.8, likely word order difference
    const overlap = [...ourSet].filter(w => googleSet.has(w)).length;
    const minSize = Math.min(ourSet.size, googleSet.size);
    if (minSize > 0 && overlap / minSize > 0.7 && r.score.scores.jaccard < 0.8) {
      patterns.wordOrderDifferences++;
    }
  }

  const total = results.length || 1;

  return {
    apostropheUsage: {
      count: patterns.apostropheUsage,
      percentage: (patterns.apostropheUsage / total * 100).toFixed(1) + '%',
      description: 'Different apostrophe conventions (N\'tan vs Ntan)'
    },
    gnVsNy: {
      count: patterns.gnVsNy,
      percentage: (patterns.gnVsNy / total * 100).toFixed(1) + '%',
      description: 'Palatal nasal spelling (gn vs ny)'
    },
    diacriticDifferences: {
      count: patterns.diacriticDifferences,
      percentage: (patterns.diacriticDifferences / total * 100).toFixed(1) + '%',
      description: 'Diacritic usage differences (è, é, ô, etc.)'
    },
    wordOrderDifferences: {
      count: patterns.wordOrderDifferences,
      percentage: (patterns.wordOrderDifferences / total * 100).toFixed(1) + '%',
      description: 'Same words in different order'
    }
  };
}

/**
 * Analyze word-level discrepancies
 *
 * @param {Array} results - Batch results
 * @returns {Object} Word frequency analysis
 */
function analyzeWordDiscrepancies(results) {
  const onlyInOurs = {};
  const onlyInGoogle = {};

  for (const r of results) {
    for (const word of r.score.wordAnalysis.onlyInOurs) {
      onlyInOurs[word] = (onlyInOurs[word] || 0) + 1;
    }
    for (const word of r.score.wordAnalysis.onlyInGoogle) {
      onlyInGoogle[word] = (onlyInGoogle[word] || 0) + 1;
    }
  }

  // Sort by frequency
  const sortedOurs = Object.entries(onlyInOurs)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
    .map(([word, count]) => ({ word, count }));

  const sortedGoogle = Object.entries(onlyInGoogle)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
    .map(([word, count]) => ({ word, count }));

  return {
    wordsUniqueToOurs: {
      description: 'Words appearing in our translations but not Google\'s',
      topWords: sortedOurs
    },
    wordsUniqueToGoogle: {
      description: 'Words appearing in Google\'s translations but not ours',
      topWords: sortedGoogle
    }
  };
}

/**
 * Print report to console in readable format
 *
 * @param {Object} report - Report object from generateReport
 */
function printReport(report) {
  console.log('\n' + '='.repeat(70));
  console.log(report.summary.title);
  console.log('='.repeat(70));
  console.log(`Generated: ${report.summary.timestamp}`);
  console.log(`Samples tested: ${report.summary.successfulTests} / ${report.summary.sampleSize}`);
  if (report.summary.errors > 0) {
    console.log(`Errors: ${report.summary.errors}`);
  }

  console.log('\n--- OVERALL AGREEMENT ---');
  console.log(`Composite Score: ${report.overallAgreement.compositeScore}`);
  console.log(`Interpretation: ${report.overallAgreement.interpretation}`);
  console.log('\nBreakdown:');
  console.log(`  Jaccard (word overlap): ${report.overallAgreement.breakdown.jaccardAvg}`);
  console.log(`  Levenshtein (character): ${report.overallAgreement.breakdown.levenshteinAvg}`);
  console.log(`  Orthographic (normalized): ${report.overallAgreement.breakdown.orthographicAvg}`);

  console.log('\n--- AGREEMENT DISTRIBUTION ---');
  console.log(`  High (>=70%):   ${report.agreementDistribution.high}`);
  console.log(`  Medium (40-70%): ${report.agreementDistribution.medium}`);
  console.log(`  Low (<40%):     ${report.agreementDistribution.low}`);

  console.log('\n--- COMMON DIFFERENCE PATTERNS ---');
  for (const [key, val] of Object.entries(report.commonDifferences)) {
    console.log(`  ${val.description}: ${val.count} (${val.percentage})`);
  }

  console.log('\n--- WORD DISCREPANCIES ---');
  console.log('Top words unique to our translations:');
  for (const { word, count } of report.wordDiscrepancies.wordsUniqueToOurs.topWords.slice(0, 10)) {
    console.log(`    "${word}": ${count}x`);
  }

  console.log('\nTop words unique to Google translations:');
  for (const { word, count } of report.wordDiscrepancies.wordsUniqueToGoogle.topWords.slice(0, 10)) {
    console.log(`    "${word}": ${count}x`);
  }

  if (report.examples) {
    console.log('\n--- BEST MATCHES (Highest Agreement) ---');
    for (const ex of report.examples.best) {
      console.log(`\n  [${ex.score}] EN: ${ex.english.substring(0, 60)}...`);
      console.log(`  OURS:   ${ex.ourSusu.substring(0, 60)}...`);
      console.log(`  GOOGLE: ${ex.googleSusu.substring(0, 60)}...`);
    }

    console.log('\n--- WORST MATCHES (Lowest Agreement) ---');
    for (const ex of report.examples.worst) {
      console.log(`\n  [${ex.score}] EN: ${ex.english.substring(0, 60)}...`);
      console.log(`  OURS:   ${ex.ourSusu.substring(0, 60)}...`);
      console.log(`  GOOGLE: ${ex.googleSusu.substring(0, 60)}...`);
    }
  }

  console.log('\n' + '='.repeat(70) + '\n');
}

/**
 * Save report to JSON file
 *
 * @param {Object} report - Report object
 * @param {string} filepath - Output file path
 */
function saveReport(report, filepath) {
  fs.writeFileSync(filepath, JSON.stringify(report, null, 2), 'utf8');
  console.log(`Report saved to: ${filepath}`);
}

// =============================================================================
// EXPORTS
// =============================================================================

module.exports = {
  // Core scoring
  scoreTranslation,
  jaccardSimilarity,
  levenshteinSimilarity,
  orthographicSimilarity,

  // Batch testing
  batchQualityCheck,
  getRandomSamples,
  loadCorpus,

  // Reporting
  generateReport,
  printReport,
  saveReport,

  // Utilities
  normalizeForComparison,
  calculateBatchStats
};

// =============================================================================
// CLI INTERFACE
// =============================================================================

if (require.main === module) {
  const args = process.argv.slice(2);

  const showHelp = () => {
    console.log(`
Soussou Engine Translation Quality Scorer

Usage:
  node quality_scorer.js [command] [options]

Commands:
  batch <n>      Run batch quality check on n random samples (default: 10)
  score          Score a single translation pair (interactive)
  corpus-stats   Show corpus statistics

Options:
  --verbose      Show detailed progress
  --save <file>  Save report to JSON file

Environment:
  GOOGLE_TRANSLATE_API_KEY must be set

Examples:
  node quality_scorer.js batch 50 --verbose
  node quality_scorer.js batch 100 --save quality_report.json
  node quality_scorer.js corpus-stats
`);
  };

  const runBatch = async () => {
    const nIndex = args.findIndex(a => !isNaN(parseInt(a)));
    const n = nIndex >= 0 ? parseInt(args[nIndex]) : 10;
    const verbose = args.includes('--verbose');
    const saveIndex = args.indexOf('--save');
    const saveFile = saveIndex >= 0 ? args[saveIndex + 1] : null;

    try {
      const batchResults = await batchQualityCheck(n, { verbose });
      const report = generateReport(batchResults);

      printReport(report);

      if (saveFile) {
        saveReport(report, saveFile);
      }

    } catch (error) {
      console.error('Error:', error.message);
      process.exit(1);
    }
  };

  const showCorpusStats = () => {
    try {
      const corpus = loadCorpus();
      console.log('\n--- Bible Corpus Statistics ---');
      console.log(`Total verses: ${corpus.length}`);

      // Sample verse lengths
      const susuLengths = corpus.map(v => v.susu.length);
      const englishLengths = corpus.map(v => v.english.length);

      console.log(`\nSusu text lengths:`);
      console.log(`  Average: ${(susuLengths.reduce((a, b) => a + b, 0) / susuLengths.length).toFixed(0)} chars`);
      console.log(`  Min: ${Math.min(...susuLengths)} chars`);
      console.log(`  Max: ${Math.max(...susuLengths)} chars`);

      console.log(`\nEnglish text lengths:`);
      console.log(`  Average: ${(englishLengths.reduce((a, b) => a + b, 0) / englishLengths.length).toFixed(0)} chars`);
      console.log(`  Min: ${Math.min(...englishLengths)} chars`);
      console.log(`  Max: ${Math.max(...englishLengths)} chars`);

      console.log('\nSample verses:');
      const samples = getRandomSamples(3, corpus);
      for (const s of samples) {
        console.log(`\n  [${s.verse_num}] EN: ${s.english.substring(0, 70)}...`);
        console.log(`        SU: ${s.susu.substring(0, 70)}...`);
      }

    } catch (error) {
      console.error('Error:', error.message);
    }
  };

  // Parse command
  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    showHelp();
  } else if (args[0] === 'batch') {
    runBatch();
  } else if (args[0] === 'corpus-stats') {
    showCorpusStats();
  } else if (args[0] === 'score') {
    console.log('Interactive scoring not yet implemented. Use batch mode.');
  } else {
    // Default to batch if just a number is provided
    if (!isNaN(parseInt(args[0]))) {
      runBatch();
    } else {
      console.log(`Unknown command: ${args[0]}`);
      showHelp();
    }
  }
}
