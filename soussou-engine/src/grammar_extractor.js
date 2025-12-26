/**
 * Susu Grammar Pattern Extractor
 *
 * Extracts grammatical patterns from parallel Susu-English sentences.
 * Uses the 31,829 parallel Bible sentences to identify:
 * - Common sentence structures (SOV, SVO variations)
 * - Verb patterns and conjugations
 * - Pronoun usage patterns
 * - Question formation rules
 * - Negation patterns
 * - Reduplication and emphasis
 *
 * Key Susu Grammar Rules:
 * - Subject + Object + Verb (SOV) word order
 * - "na" as linking verb (like "is")
 * - "naxa" as narrative past tense marker
 * - Postpositions instead of prepositions
 * - "mu" for negation before verb
 * - "a" prefix for 3rd person pronouns
 * - "-xi" suffix for past/perfective
 * - "-fe" suffix for progressive/action
 */

const fs = require('fs');
const path = require('path');

// Import normalization utilities if available
let normalize, normalizePhrase;
try {
  const normalizer = require('./normalize.js');
  normalize = normalizer.normalize;
  normalizePhrase = normalizer.normalizePhrase;
} catch (e) {
  // Fallback normalization
  normalize = (s) => s?.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim() || '';
  normalizePhrase = normalize;
}

// ============================================================================
// LINGUISTIC CONSTANTS
// ============================================================================

// Subject pronouns with all variants
const PRONOUNS = {
  // First person singular
  'n': { person: '1s', english: 'I', type: 'subject' },
  'ntan': { person: '1s', english: 'I', type: 'emphatic' },
  "n'tan": { person: '1s', english: 'I', type: 'emphatic' },
  "n'na": { person: '1s', english: 'I am', type: 'progressive' },
  'nna': { person: '1s', english: 'I am', type: 'progressive' },

  // Second person singular
  'i': { person: '2s', english: 'you', type: 'subject' },
  'itan': { person: '2s', english: 'you', type: 'emphatic' },
  'ina': { person: '2s', english: 'you are', type: 'progressive' },
  'wo': { person: '2s', english: 'you (formal)', type: 'formal' },
  'wotan': { person: '2s', english: 'you (formal)', type: 'emphatic' },

  // Third person singular
  'a': { person: '3s', english: 'he/she/it', type: 'subject' },
  'atan': { person: '3s', english: 'he/she/it', type: 'emphatic' },
  'ana': { person: '3s', english: 'he/she is', type: 'progressive' },

  // First person plural inclusive
  'won': { person: '1pi', english: 'we (incl.)', type: 'subject' },
  "whon'": { person: '1pi', english: 'we (incl.)', type: 'subject' },
  'whon': { person: '1pi', english: 'we (incl.)', type: 'subject' },

  // First person plural exclusive
  'muxu': { person: '1pe', english: 'we (excl.)', type: 'subject' },
  'moukhou': { person: '1pe', english: 'we (excl.)', type: 'subject' },

  // Third person plural
  'e': { person: '3p', english: 'they', type: 'subject' },
  'etan': { person: '3p', english: 'they', type: 'emphatic' },
};

// Possessive markers
const POSSESSIVES = {
  "n'ma": { person: '1s', english: 'my' },
  'nma': { person: '1s', english: 'my' },
  "m'ma": { person: '1s', english: 'my' },
  'mma': { person: '1s', english: 'my' },
  'ikha': { person: '2s', english: 'your' },
  'i kha': { person: '2s', english: 'your' },
  'akha': { person: '3s', english: 'his/her' },
  'a kha': { person: '3s', english: 'his/her' },
  'wonma': { person: '1pi', english: 'our' },
  'whonma': { person: '1pi', english: 'our' },
  'ekha': { person: '3p', english: 'their' },
  'e kha': { person: '3p', english: 'their' },
};

// Tense/Aspect markers
const TENSE_MARKERS = {
  'naxa': { tense: 'past_narrative', english: 'did/was', usage: 'biblical/formal past' },
  'bara': { tense: 'perfective', english: 'has/have', usage: 'completed action' },
  'nu': { tense: 'past', english: 'was/were', usage: 'past state' },
  'na': { tense: 'present', english: 'is/are', usage: 'present state/copula' },
  'noma': { tense: 'ability', english: 'can/able', usage: 'ability/possibility' },
  'fama': { tense: 'future', english: 'will', usage: 'future tense' },
};

// Verb suffixes
const VERB_SUFFIXES = {
  'xi': { aspect: 'perfective', english: '-ed', meaning: 'completed action' },
  'fe': { aspect: 'progressive', english: '-ing', meaning: 'ongoing action' },
  'de': { aspect: 'agent', english: '-er', meaning: 'one who does' },
  'ma': { aspect: 'present', english: '-s/-ing', meaning: 'present tense' },
};

// Negation markers
const NEGATION = {
  'mu': { type: 'standard', position: 'before_verb', english: 'not' },
  "m'ma": { type: 'contracted', position: 'before_verb', english: "don't/doesn't" },
  'mma': { type: 'contracted', position: 'before_verb', english: "don't/doesn't" },
};

// Question markers
const QUESTION_WORDS = {
  'minde': { type: 'where', english: 'where' },
  'di': { type: 'what', english: 'what' },
  'nde': { type: 'who', english: 'who' },
  'yiri': { type: 'which/how_much', english: 'which/how much' },
  'munfe': { type: 'why', english: 'why' },
  'tuma': { type: 'when', english: 'when' },
};

// Connectors and particles
const CONNECTORS = {
  'nun': { type: 'conjunction', english: 'and' },
  'barima': { type: 'causal', english: 'because' },
  'alako': { type: 'purpose', english: 'so that' },
  'kono': { type: 'adversative', english: 'but' },
  'xa': { type: 'conditional/possessive', english: 'if/of' },
  'naxan': { type: 'relative', english: 'which/that/who' },
  'fo': { type: 'exceptive', english: 'except/only' },
};

// Postpositions (come after the noun they modify)
const POSTPOSITIONS = {
  'ra': { meaning: 'at/in/by', type: 'locative' },
  'ma': { meaning: 'on/at', type: 'locative' },
  'bun': { meaning: 'under', type: 'locative' },
  'fari': { meaning: 'on top of', type: 'locative' },
  'kui': { meaning: 'in/inside', type: 'locative' },
  'xun': { meaning: 'on/above', type: 'locative' },
  'be': { meaning: 'for/to', type: 'dative' },
  'yire': { meaning: 'place/there', type: 'locative' },
};

// ============================================================================
// PATTERN STORAGE
// ============================================================================

const extractedPatterns = {
  sentenceStructures: new Map(),  // Common sentence patterns
  verbPatterns: new Map(),        // Verb conjugation patterns
  pronounPatterns: new Map(),     // Pronoun usage patterns
  questionPatterns: new Map(),    // Question formation patterns
  negationPatterns: new Map(),    // Negation patterns
  templates: [],                  // Translation templates
  grammarMarkers: new Map(),      // Grammar marker statistics
  collocations: new Map(),        // Word co-occurrence patterns
};

// ============================================================================
// TOKENIZATION
// ============================================================================

/**
 * Tokenize a Susu sentence into words, preserving contractions
 */
function tokenize(sentence) {
  if (!sentence) return [];

  return sentence
    .replace(/[.,;:!?()«»""]/g, ' ')
    .replace(/([nmNM])[''](\w)/g, "$1'$2")  // Preserve n'tan, m'ma
    .split(/\s+/)
    .filter(w => w.length > 0);
}

/**
 * Get normalized token for pattern matching
 */
function normalizeToken(token) {
  return normalize(token);
}

// ============================================================================
// PATTERN EXTRACTION FUNCTIONS
// ============================================================================

/**
 * Extract grammatical patterns from a parallel sentence pair
 */
function extractPatterns(susuSentence, englishSentence) {
  const patterns = {
    structure: null,
    tense: null,
    negation: false,
    question: false,
    pronouns: [],
    verbs: [],
    markers: [],
    template: null,
  };

  const tokens = tokenize(susuSentence);
  const normalizedTokens = tokens.map(t => normalizeToken(t));

  if (tokens.length === 0) return patterns;

  // 1. Identify pronouns
  for (let i = 0; i < tokens.length; i++) {
    const normalized = normalizedTokens[i];
    if (PRONOUNS[normalized]) {
      patterns.pronouns.push({
        form: tokens[i],
        position: i,
        info: PRONOUNS[normalized],
      });
    }
    if (POSSESSIVES[normalized]) {
      patterns.pronouns.push({
        form: tokens[i],
        position: i,
        type: 'possessive',
        info: POSSESSIVES[normalized],
      });
    }
  }

  // 2. Identify tense markers
  for (let i = 0; i < tokens.length; i++) {
    const normalized = normalizedTokens[i];
    if (TENSE_MARKERS[normalized]) {
      patterns.tense = {
        marker: tokens[i],
        position: i,
        info: TENSE_MARKERS[normalized],
      };
      patterns.markers.push({
        type: 'tense',
        form: tokens[i],
        position: i,
        info: TENSE_MARKERS[normalized],
      });
    }
  }

  // 3. Check for negation
  for (let i = 0; i < tokens.length; i++) {
    const normalized = normalizedTokens[i];
    if (NEGATION[normalized]) {
      patterns.negation = true;
      patterns.markers.push({
        type: 'negation',
        form: tokens[i],
        position: i,
        info: NEGATION[normalized],
      });
    }
  }

  // 4. Check for questions
  for (let i = 0; i < tokens.length; i++) {
    const normalized = normalizedTokens[i];
    if (QUESTION_WORDS[normalized]) {
      patterns.question = true;
      patterns.markers.push({
        type: 'question',
        form: tokens[i],
        position: i,
        info: QUESTION_WORDS[normalized],
      });
    }
  }

  // 5. Identify verb patterns (by suffix)
  for (let i = 0; i < tokens.length; i++) {
    const normalized = normalizedTokens[i];
    for (const [suffix, info] of Object.entries(VERB_SUFFIXES)) {
      if (normalized.endsWith(suffix) && normalized.length > suffix.length + 1) {
        const root = normalized.slice(0, -suffix.length);
        patterns.verbs.push({
          form: tokens[i],
          root: root,
          suffix: suffix,
          position: i,
          info: info,
        });
      }
    }
  }

  // 6. Identify connectors
  for (let i = 0; i < tokens.length; i++) {
    const normalized = normalizedTokens[i];
    if (CONNECTORS[normalized]) {
      patterns.markers.push({
        type: 'connector',
        form: tokens[i],
        position: i,
        info: CONNECTORS[normalized],
      });
    }
  }

  // 7. Analyze sentence structure
  patterns.structure = analyzeStructure(tokens, normalizedTokens, patterns);

  // 8. Generate template if applicable
  patterns.template = generateTemplate(tokens, patterns, englishSentence);

  return patterns;
}

/**
 * Analyze sentence structure (SOV, narrative, etc.)
 */
function analyzeStructure(tokens, normalizedTokens, patterns) {
  const structure = {
    type: 'unknown',
    order: [],
    markers: [],
  };

  // Check for narrative past (Subject + naxa + Verb)
  if (normalizedTokens.includes('naxa')) {
    structure.type = 'narrative_past';
    structure.markers.push('naxa');
  }

  // Check for existential (X na Y)
  if (normalizedTokens.includes('na') && !normalizedTokens.includes('naxa')) {
    const naIndex = normalizedTokens.indexOf('na');
    if (naIndex > 0 && naIndex < normalizedTokens.length - 1) {
      structure.type = 'existential';
      structure.markers.push('na');
    }
  }

  // Check for perfective (Subject + bara + Verb)
  if (normalizedTokens.includes('bara')) {
    structure.type = 'perfective';
    structure.markers.push('bara');
  }

  // Check for negation pattern
  if (patterns.negation) {
    structure.type = structure.type === 'unknown' ? 'negation' : structure.type + '_negation';
  }

  // Check for question
  if (patterns.question) {
    structure.type = structure.type === 'unknown' ? 'question' : structure.type + '_question';
  }

  // Identify word order
  if (patterns.pronouns.length > 0) {
    const firstPronounPos = patterns.pronouns[0].position;
    if (firstPronounPos === 0) {
      structure.order.push('S'); // Subject at start
    }
  }

  if (patterns.verbs.length > 0) {
    const lastVerbPos = patterns.verbs[patterns.verbs.length - 1].position;
    if (lastVerbPos === tokens.length - 1 || lastVerbPos === tokens.length - 2) {
      structure.order.push('V'); // Verb at end (SOV)
      structure.type = structure.type === 'unknown' ? 'sov' : structure.type;
    }
  }

  return structure;
}

/**
 * Generate a translation template from the sentence
 */
function generateTemplate(tokens, patterns, englishSentence) {
  if (tokens.length < 2 || tokens.length > 10) return null;

  const template = {
    susu: [],
    english: englishSentence,
    slots: [],
  };

  // Create template with slots for variable parts
  for (let i = 0; i < tokens.length; i++) {
    const normalized = normalizeToken(tokens[i]);

    // Check if this is a replaceable slot
    const pronoun = patterns.pronouns.find(p => p.position === i);
    if (pronoun && pronoun.info) {
      template.susu.push(`{${pronoun.info.type || 'subject'}}`);
      template.slots.push({
        type: pronoun.info.type || 'subject',
        position: i,
        example: tokens[i],
      });
    } else if (TENSE_MARKERS[normalized] || NEGATION[normalized] || CONNECTORS[normalized]) {
      // Keep grammar markers as-is
      template.susu.push(tokens[i]);
    } else if (patterns.verbs.find(v => v.position === i)) {
      template.susu.push(`{verb}`);
      template.slots.push({
        type: 'verb',
        position: i,
        example: tokens[i],
      });
    } else {
      // Check if it might be a noun/object
      if (i > 0 && i < tokens.length - 1) {
        template.susu.push(`{noun}`);
        template.slots.push({
          type: 'noun',
          position: i,
          example: tokens[i],
        });
      } else {
        template.susu.push(tokens[i]);
      }
    }
  }

  if (template.slots.length === 0) return null;

  template.pattern = template.susu.join(' ');
  return template;
}

// ============================================================================
// PATTERN AGGREGATION
// ============================================================================

/**
 * Process parallel corpus and extract aggregate patterns
 */
function processCorpus(corpusPath) {
  const corpus = JSON.parse(fs.readFileSync(corpusPath, 'utf8'));

  const stats = {
    totalSentences: 0,
    processedSentences: 0,
    patterns: {
      narrative_past: 0,
      perfective: 0,
      existential: 0,
      negation: 0,
      question: 0,
      sov: 0,
    },
    tenseMarkers: {},
    pronounUsage: {},
    verbSuffixes: {},
    templates: [],
  };

  for (const entry of corpus) {
    stats.totalSentences++;

    const susu = entry.susu || entry.sus || entry.soussou;
    const english = entry.english || entry.en;

    if (!susu || !english) continue;

    const patterns = extractPatterns(susu, english);
    stats.processedSentences++;

    // Count structure types
    if (patterns.structure?.type) {
      const types = patterns.structure.type.split('_');
      for (const type of types) {
        if (stats.patterns[type] !== undefined) {
          stats.patterns[type]++;
        }
      }
    }

    // Count tense markers
    if (patterns.tense?.info) {
      const marker = patterns.tense.marker;
      stats.tenseMarkers[marker] = (stats.tenseMarkers[marker] || 0) + 1;
    }

    // Count pronoun usage
    for (const pronoun of patterns.pronouns) {
      const form = normalizeToken(pronoun.form);
      stats.pronounUsage[form] = (stats.pronounUsage[form] || 0) + 1;
    }

    // Count verb suffixes
    for (const verb of patterns.verbs) {
      stats.verbSuffixes[verb.suffix] = (stats.verbSuffixes[verb.suffix] || 0) + 1;
    }

    // Collect useful templates (unique and complete)
    if (patterns.template && patterns.template.slots.length >= 1 && patterns.template.slots.length <= 3) {
      const existing = stats.templates.find(t => t.pattern === patterns.template.pattern);
      if (!existing) {
        stats.templates.push(patterns.template);
      }
    }
  }

  return stats;
}

/**
 * Build common patterns from corpus statistics
 */
function buildCommonPatterns(corpusStats) {
  const patterns = {
    sentenceTypes: [],
    verbPatterns: [],
    pronounPatterns: [],
    templates: [],
    grammarRules: [],
  };

  // Sentence type patterns
  for (const [type, count] of Object.entries(corpusStats.patterns)) {
    if (count > 100) {
      patterns.sentenceTypes.push({
        type,
        count,
        percentage: ((count / corpusStats.processedSentences) * 100).toFixed(2),
      });
    }
  }

  // Tense marker patterns
  const sortedTenseMarkers = Object.entries(corpusStats.tenseMarkers)
    .sort((a, b) => b[1] - a[1]);

  for (const [marker, count] of sortedTenseMarkers) {
    patterns.verbPatterns.push({
      marker,
      count,
      info: TENSE_MARKERS[normalizeToken(marker)] || { usage: 'unknown' },
    });
  }

  // Pronoun patterns (top 20)
  const sortedPronouns = Object.entries(corpusStats.pronounUsage)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20);

  for (const [form, count] of sortedPronouns) {
    patterns.pronounPatterns.push({
      form,
      count,
      info: PRONOUNS[form] || POSSESSIVES[form] || { english: 'unknown' },
    });
  }

  // Verb suffix patterns
  const sortedSuffixes = Object.entries(corpusStats.verbSuffixes)
    .sort((a, b) => b[1] - a[1]);

  for (const [suffix, count] of sortedSuffixes) {
    if (VERB_SUFFIXES[suffix]) {
      patterns.verbPatterns.push({
        suffix: `-${suffix}`,
        count,
        info: VERB_SUFFIXES[suffix],
      });
    }
  }

  // Unique templates (top 50)
  patterns.templates = corpusStats.templates.slice(0, 50);

  // Grammar rules summary
  patterns.grammarRules = [
    {
      rule: 'SOV Word Order',
      description: 'Subject-Object-Verb is the default word order',
      example: { susu: 'Ala koore daa', english: 'God heaven created' },
    },
    {
      rule: 'Narrative Past with naxa',
      description: 'Use "naxa" between subject and verb for narrative past tense',
      example: { susu: 'Ala naxa a masen', english: 'God said' },
    },
    {
      rule: 'Perfective with bara',
      description: 'Use "bara" to indicate completed action',
      example: { susu: 'A bara siga', english: 'He/she has gone' },
    },
    {
      rule: 'Negation with mu',
      description: 'Place "mu" before the verb to negate',
      example: { susu: 'A mu siga', english: 'He/she did not go' },
    },
    {
      rule: 'Progressive with -fe suffix',
      description: 'Add "-fe" to verb root for progressive/ongoing action',
      example: { susu: 'N na sigafe', english: 'I am going' },
    },
    {
      rule: 'Past/Perfective with -xi suffix',
      description: 'Add "-xi" to verb root for completed action',
      example: { susu: 'A sigaxi', english: 'He/she went' },
    },
    {
      rule: 'Existential with na',
      description: 'Use "na" as copula for existential statements',
      example: { susu: 'Ala na', english: 'God is/exists' },
    },
    {
      rule: 'Postpositions',
      description: 'Location markers come after the noun (not before like English prepositions)',
      example: { susu: 'banxi ra', english: 'at the house' },
    },
    {
      rule: 'Possessive with xa',
      description: 'Use "xa" between possessor and possessed noun',
      example: { susu: 'Ala xa sɛrɛ', english: "God's creation" },
    },
    {
      rule: 'Relative Clause with naxan',
      description: 'Use "naxan" to introduce relative clauses',
      example: { susu: 'mixi naxan na', english: 'the person who is there' },
    },
  ];

  return patterns;
}

// ============================================================================
// PATTERN MATCHING
// ============================================================================

/**
 * Match an input sentence against known patterns
 */
function matchPattern(inputSentence) {
  const patterns = extractPatterns(inputSentence, '');

  const result = {
    input: inputSentence,
    structure: patterns.structure,
    detected: {
      pronouns: patterns.pronouns.map(p => ({
        form: p.form,
        english: p.info?.english || 'unknown',
      })),
      tense: patterns.tense ? {
        marker: patterns.tense.marker,
        english: patterns.tense.info?.english || 'unknown',
      } : null,
      negation: patterns.negation,
      question: patterns.question,
      verbs: patterns.verbs.map(v => ({
        form: v.form,
        root: v.root,
        suffix: v.suffix,
        aspect: v.info?.aspect || 'unknown',
      })),
    },
    suggestedTranslation: generateSuggestedTranslation(patterns),
  };

  return result;
}

/**
 * Generate a suggested translation based on detected patterns
 */
function generateSuggestedTranslation(patterns) {
  const parts = [];

  // Add pronouns
  for (const pronoun of patterns.pronouns) {
    if (pronoun.info?.english) {
      parts.push(pronoun.info.english);
    }
  }

  // Add tense markers
  if (patterns.tense?.info?.english) {
    parts.push(patterns.tense.info.english);
  }

  // Add negation
  if (patterns.negation) {
    parts.push('not');
  }

  // Add verbs
  for (const verb of patterns.verbs) {
    if (verb.root) {
      let verbForm = verb.root;
      if (verb.info?.english) {
        verbForm += ` (${verb.info.english})`;
      }
      parts.push(verbForm);
    }
  }

  return parts.length > 0 ? parts.join(' ') : null;
}

// ============================================================================
// DATA PERSISTENCE
// ============================================================================

/**
 * Save extracted patterns to JSON file
 */
function savePatternsToFile(patterns, outputPath) {
  const data = {
    version: '1.0',
    generatedAt: new Date().toISOString(),
    language: 'Susu (Soussou)',
    description: 'Grammar patterns extracted from parallel corpus',
    ...patterns,
  };

  fs.writeFileSync(outputPath, JSON.stringify(data, null, 2), 'utf8');
  console.log(`Patterns saved to: ${outputPath}`);
  return data;
}

/**
 * Load patterns from JSON file
 */
function loadPatternsFromFile(inputPath) {
  if (!fs.existsSync(inputPath)) {
    return null;
  }
  return JSON.parse(fs.readFileSync(inputPath, 'utf8'));
}

// ============================================================================
// EXPORTED API
// ============================================================================

/**
 * Get common patterns (loads from file or extracts from corpus)
 */
function getCommonPatterns(options = {}) {
  const dataDir = options.dataDir || path.join(__dirname, '..', 'data');
  const patternsPath = path.join(dataDir, 'grammar_patterns.json');

  // Try to load existing patterns
  if (!options.forceRefresh) {
    const existing = loadPatternsFromFile(patternsPath);
    if (existing) {
      return existing;
    }
  }

  // Extract patterns from corpus
  const corpusPath = path.join(dataDir, 'bible_susu', 'bible_parallel_corpus.json');

  if (!fs.existsSync(corpusPath)) {
    console.warn('Corpus not found at:', corpusPath);
    return null;
  }

  console.log('Extracting patterns from corpus...');
  const stats = processCorpus(corpusPath);
  const patterns = buildCommonPatterns(stats);

  // Add statistics
  patterns.statistics = {
    totalSentences: stats.totalSentences,
    processedSentences: stats.processedSentences,
    extractedAt: new Date().toISOString(),
  };

  // Save for future use
  savePatternsToFile(patterns, patternsPath);

  return patterns;
}

// ============================================================================
// MODULE EXPORTS
// ============================================================================

module.exports = {
  // Core extraction
  extractPatterns,
  matchPattern,
  getCommonPatterns,

  // Corpus processing
  processCorpus,
  buildCommonPatterns,

  // Utilities
  tokenize,
  normalizeToken,
  generateSuggestedTranslation,

  // Data persistence
  savePatternsToFile,
  loadPatternsFromFile,

  // Linguistic constants
  PRONOUNS,
  POSSESSIVES,
  TENSE_MARKERS,
  VERB_SUFFIXES,
  NEGATION,
  QUESTION_WORDS,
  CONNECTORS,
  POSTPOSITIONS,
};

// ============================================================================
// CLI EXECUTION
// ============================================================================

if (require.main === module) {
  console.log('=== SUSU GRAMMAR PATTERN EXTRACTOR ===\n');

  // Test pattern extraction on sample sentences
  const testSentences = [
    { susu: 'Ala naxa koore nun bɔxi daa.', english: 'God made the heaven and the earth.' },
    { susu: 'Ala naxa a masen, «Naiyalanyi xa mini.»', english: 'And God said, Let there be light.' },
    { susu: 'Duniɲa mu nu yailanxi', english: 'The earth was waste and without form' },
    { susu: 'A bara siga', english: 'He has gone' },
    { susu: 'N na sigafe', english: 'I am going' },
    { susu: 'Wo minde?', english: 'Where are you?' },
    { susu: 'A mu noma', english: 'He/she cannot' },
  ];

  console.log('Pattern extraction examples:\n');

  for (const test of testSentences) {
    console.log(`Susu: "${test.susu}"`);
    console.log(`English: "${test.english}"`);

    const patterns = extractPatterns(test.susu, test.english);
    console.log('Detected patterns:');
    console.log(`  Structure: ${patterns.structure?.type || 'unknown'}`);
    console.log(`  Pronouns: ${patterns.pronouns.map(p => p.form).join(', ') || 'none'}`);
    console.log(`  Tense: ${patterns.tense?.marker || 'none'}`);
    console.log(`  Negation: ${patterns.negation}`);
    console.log(`  Verbs: ${patterns.verbs.map(v => `${v.root}-${v.suffix}`).join(', ') || 'none'}`);
    console.log();
  }

  // Extract patterns from corpus if available
  console.log('\n=== CORPUS PATTERN EXTRACTION ===\n');

  const dataDir = path.join(__dirname, '..', 'data');
  const corpusPath = path.join(dataDir, 'bible_susu', 'bible_parallel_corpus.json');

  if (fs.existsSync(corpusPath)) {
    console.log('Processing Bible parallel corpus...');
    const patterns = getCommonPatterns({ dataDir, forceRefresh: true });

    console.log('\nExtraction complete!');
    console.log(`Total sentences: ${patterns.statistics.totalSentences}`);
    console.log(`Processed: ${patterns.statistics.processedSentences}`);

    console.log('\nSentence type distribution:');
    for (const type of patterns.sentenceTypes) {
      console.log(`  ${type.type}: ${type.count} (${type.percentage}%)`);
    }

    console.log('\nTop tense markers:');
    for (const marker of patterns.verbPatterns.slice(0, 5)) {
      if (marker.marker) {
        console.log(`  ${marker.marker}: ${marker.count}`);
      }
    }

    console.log('\nTop pronouns:');
    for (const pronoun of patterns.pronounPatterns.slice(0, 5)) {
      console.log(`  ${pronoun.form}: ${pronoun.count} (${pronoun.info?.english || 'unknown'})`);
    }

    console.log('\nGrammar rules extracted:', patterns.grammarRules.length);
    console.log('Templates extracted:', patterns.templates.length);
  } else {
    console.log('Corpus not found. Run with corpus to extract patterns.');
  }

  console.log('\n=== PATTERN MATCHING DEMO ===\n');

  const matchTests = [
    'A naxa siga',
    'Wo mu fafe',
    'N bara a to',
    'Ala naxa koore daa',
  ];

  for (const sentence of matchTests) {
    const match = matchPattern(sentence);
    console.log(`Input: "${sentence}"`);
    console.log(`  Structure: ${match.structure?.type || 'unknown'}`);
    console.log(`  Suggested: ${match.suggestedTranslation || 'none'}`);
    console.log();
  }
}
