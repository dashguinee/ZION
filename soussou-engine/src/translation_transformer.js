/**
 * Translation Transformer - Pattern-based Susu Translation Improvement
 *
 * Transforms raw word-by-word translations into natural Susu based on
 * patterns learned from Google Translate and verified corpus.
 *
 * Key transformations:
 * 1. Pronoun simplification: "N'tan" → "N" in standard context
 * 2. Article removal: Drop "The", "A", "An"
 * 3. SOV reordering: English SVO → Susu SOV
 * 4. Tense marker insertion: bara (completed), na (present)
 * 5. Linking verb handling: X na Y (X is Y)
 */

const fs = require('fs');
const path = require('path');

// ===========================================================================
// TRANSFORMATION RULES (Learned from Google Translate patterns)
// ===========================================================================

// Pronoun transformations (emphatic → simple)
const PRONOUN_SIMPLIFY = {
  "n'tan": 'n',
  'ntan': 'n',
  "i'tan": 'i',
  'itan': 'i',
  'atan': 'a',
  "a'tan": 'a',
  'etan': 'e',
  'muxutan': 'muxu',
  'wontan': 'won'
};

// Articles to remove (Susu doesn't use articles like English)
const ARTICLES = ['the', 'a', 'an'];

// Common English words to drop (context-dependent)
const DROP_WORDS = ['the', 'a', 'an', 'to', 'is', 'are', 'am', 'do', 'does'];

// Verb conjugation patterns
const VERB_PATTERNS = {
  // Present progressive: "I am eating" → "N tare donma" (not "N na don")
  present_progressive: {
    markers: ['am', 'is', 'are'],
    verbs: ['eating', 'drinking', 'sleeping', 'walking', 'running', 'working'],
    transform: (pronoun, verb) => {
      // Remove -ing and add -ma suffix
      const baseVerb = verb.replace(/ing$/, '');
      return `${pronoun} tare ${baseVerb}ma`;
    }
  },
  // Simple present: "I eat" → "N bara don" (completed aspect common)
  simple_present: {
    transform: (pronoun, verb, object) => {
      if (object) {
        return `${pronoun} ${object} ${verb}ma`;  // SOV order
      }
      return `${pronoun} ${verb}ma`;
    }
  }
};

// Common phrase transformations (verified against Google)
const PHRASE_TRANSFORMS = {
  // Pronouns
  'i am': 'n',
  'i have': 'n hayi na',
  'i need': 'n hayi na',
  'i want': 'n waxi na',
  'i like': 'n rafan',
  'i love': 'n xanunten',
  'you are': 'i',
  'he is': 'a',
  'she is': 'a',
  'it is': 'a',
  'we are': 'won',
  'they are': 'e',

  // Common phrases
  'there is': 'na',
  'there are': 'na',
  'how are you': 'tanayo',
  'what is your name': 'ikhilidi',
  'my name is': 'n xili',
  'i don\'t know': 'n mu a kolon',
  'i don\'t understand': 'n mu a famu',

  // States
  'is good': 'fanyi',
  'is bad': 'muxuxi',
  'is hot': 'xoroxo',
  'is cold': 'xinbeli',
  'is big': 'gbo',
  'is small': 'dixin',

  // Locations
  'to the': 'ma',
  'at the': 'ra',
  'in the': 'kui',
  'from the': 'biri',
};

// Word-level transformations (verified mappings)
const WORD_TRANSFORMS = {
  // Pronouns
  'i': 'n',
  'you': 'i',
  'he': 'a',
  'she': 'a',
  'it': 'a',
  'we': 'won',
  'they': 'e',

  // Possessives
  'my': "n'ma",
  'your': "i kha",
  'his': "a kha",
  'her': "a kha",
  'our': "won ma",
  'their': "e kha",

  // Common verbs (base forms)
  'eat': 'don',
  'drink': 'min',
  'sleep': 'xi',
  'walk': 'siga',
  'run': 'giri',
  'come': 'fa',
  'go': 'siga',
  'see': 'to',
  'hear': 'meme',
  'speak': 'wori',
  'say': 'fala',
  'give': 'so',
  'take': 'ton',
  'want': 'waxi',
  'need': 'hayi',
  'know': 'kolon',
  'love': 'xanu',
  'like': 'rafan',
  'help': 'mali',
  'work': 'wali',
  'learn': 'xaran',
  'teach': 'xaranyi',

  // Common nouns
  'water': 'ye',
  'food': 'donse',
  'rice': 'malo',
  'sun': 'soge',
  'moon': 'kike',
  'house': 'banxi',
  'person': 'mixi',
  'man': 'xeme',
  'woman': 'ginye',
  'child': 'di',
  'mother': 'nga',
  'father': 'baba',
  'friend': 'bore',
  'money': 'kObiri',
  'day': 'lOnyi',
  'night': 'koe',
  'god': 'ala',
  'lord': 'marigi',

  // Adjectives
  'good': 'fanyi',
  'bad': 'muxuxi',
  'big': 'gbo',
  'small': 'dixin',
  'hot': 'xoroxo',
  'cold': 'xinbeli',
  'new': 'nEExE',
  'old': 'fori',
  'happy': 'sewa',
  'sad': 'nimisa',
  'hungry': 'khamE',
  'tired': 'fata',

  // Question words
  'what': 'munse',
  'where': 'minende',
  'when': 'mundun',
  'who': 'nde',
  'why': 'munfe',
  'how': 'di',

  // Negation
  'no': 'ade',
  'not': 'mu',
  'never': 'abadan',

  // Other common
  'yes': 'iyo',
  'please': 'nbari khandi',
  'thank': 'iniKE',
  'sorry': 'tantu',
  'hello': 'wo kena',
  'goodbye': 'an xa taa',
};

// ===========================================================================
// TRANSFORMATION ENGINE
// ===========================================================================

/**
 * Transform word-by-word translation to natural Susu
 * @param {string} wordByWord - Raw word-by-word translation
 * @param {string} originalEnglish - Original English text
 * @returns {Object} Transformed translation with confidence
 */
function transform(wordByWord, originalEnglish) {
  const english = originalEnglish.toLowerCase().replace(/[?!.,;:'"()]/g, '').trim();
  const words = english.split(/\s+/);

  let result = {
    original: wordByWord,
    transformed: wordByWord,
    confidence: 0.3,
    appliedRules: []
  };

  // 1. Try phrase-level transforms first (highest confidence)
  for (const [phrase, susu] of Object.entries(PHRASE_TRANSFORMS)) {
    if (english.includes(phrase)) {
      result.appliedRules.push(`phrase: ${phrase} → ${susu}`);
      result.confidence = Math.min(result.confidence + 0.1, 0.8);
    }
  }

  // 2. Build translation from scratch using word transforms
  const susuWords = [];
  let i = 0;

  while (i < words.length) {
    const word = words[i];

    // Skip articles
    if (ARTICLES.includes(word)) {
      result.appliedRules.push(`drop_article: ${word}`);
      i++;
      continue;
    }

    // Check for multi-word phrases
    let matched = false;
    for (let len = 3; len >= 2; len--) {
      const phrase = words.slice(i, i + len).join(' ');
      if (PHRASE_TRANSFORMS[phrase]) {
        susuWords.push(PHRASE_TRANSFORMS[phrase]);
        result.appliedRules.push(`phrase_match: ${phrase}`);
        i += len;
        matched = true;
        break;
      }
    }

    if (matched) continue;

    // Single word transform
    if (WORD_TRANSFORMS[word]) {
      susuWords.push(WORD_TRANSFORMS[word]);
      result.appliedRules.push(`word: ${word} → ${WORD_TRANSFORMS[word]}`);
    } else {
      // Keep unknown word (might be name or untranslatable)
      susuWords.push(`[${word}]`);
    }

    i++;
  }

  // 3. Apply SOV reordering if we have pronoun + object + verb pattern
  const reordered = applySOV(susuWords, words, result);

  // 4. Simplify pronouns if at sentence start
  if (reordered.length > 0) {
    const first = reordered[0].toLowerCase();
    if (PRONOUN_SIMPLIFY[first]) {
      reordered[0] = PRONOUN_SIMPLIFY[first];
      result.appliedRules.push(`simplify_pronoun: ${first} → ${reordered[0]}`);
    }
  }

  result.transformed = reordered.join(' ');

  // Boost confidence if we matched most words
  const knownWords = susuWords.filter(w => !w.startsWith('[')).length;
  const totalWords = words.filter(w => !ARTICLES.includes(w)).length;
  if (totalWords > 0) {
    const coverage = knownWords / totalWords;
    result.confidence = Math.min(0.3 + (coverage * 0.5), 0.85);
  }

  return result;
}

/**
 * Apply Subject-Object-Verb word order transformation
 */
function applySOV(susuWords, englishWords, result) {
  // Simple heuristic: if we have [Subject] [Verb] [Object], reorder to [Subject] [Object] [Verb]
  // This is a simplified version - real Susu grammar is more complex

  const pronouns = ['n', 'i', 'a', 'won', 'e'];
  const verbs = Object.values(WORD_TRANSFORMS).filter(v =>
    ['don', 'min', 'xi', 'siga', 'giri', 'fa', 'to', 'meme', 'wori', 'fala', 'so', 'ton', 'waxi', 'hayi', 'kolon', 'xanu', 'rafan', 'mali', 'wali', 'xaran'].includes(v)
  );

  // For now, return as-is but add tense marker for states
  // Pattern: "X is Y" → "X na Y" or "X bara Y"

  const joined = susuWords.join(' ');

  // Add linking verb "na" for "is" constructions
  // e.g., "sun is hot" → "soge na xoroxo" (not "soge xoroxo")
  if (englishWords.includes('is') || englishWords.includes('are') || englishWords.includes('am')) {
    // Check if we have adjective at end
    const lastWord = susuWords[susuWords.length - 1];
    const adjectives = ['fanyi', 'muxuxi', 'gbo', 'dixin', 'xoroxo', 'xinbeli', 'nEExE', 'fori', 'sewa', 'nimisa'];

    if (adjectives.includes(lastWord) && susuWords.length >= 2) {
      // Insert "bara" before adjective for state
      const newWords = [...susuWords];
      newWords.splice(susuWords.length - 1, 0, 'bara');
      result.appliedRules.push('insert_bara_state');
      return newWords;
    }
  }

  return susuWords;
}

/**
 * Generate natural Susu from English using transformation rules
 * This is used when no corpus match is found
 * @param {string} english - English text
 * @returns {Object} Generated translation
 */
function generateSusu(english) {
  const normalized = english.toLowerCase().replace(/[?!.,;:'"()]/g, '').trim();

  // First check complete phrase transforms
  for (const [phrase, susu] of Object.entries(PHRASE_TRANSFORMS)) {
    if (normalized === phrase) {
      return {
        translation: susu,
        confidence: 0.85,
        source: 'phrase_transform',
        rules: [`exact_phrase: ${phrase}`]
      };
    }
  }

  // Build word-by-word then transform
  const words = normalized.split(/\s+/);
  const susuWords = [];
  const rules = [];

  for (let i = 0; i < words.length; i++) {
    const word = words[i];

    // Skip articles
    if (ARTICLES.includes(word)) {
      rules.push(`drop: ${word}`);
      continue;
    }

    // Try phrase match (2-word)
    if (i < words.length - 1) {
      const twoWord = `${word} ${words[i+1]}`;
      if (PHRASE_TRANSFORMS[twoWord]) {
        susuWords.push(PHRASE_TRANSFORMS[twoWord]);
        rules.push(`phrase: ${twoWord}`);
        i++; // skip next word
        continue;
      }
    }

    // Single word
    if (WORD_TRANSFORMS[word]) {
      susuWords.push(WORD_TRANSFORMS[word]);
      rules.push(`word: ${word}`);
    } else {
      susuWords.push(`[${word}]`);
      rules.push(`unknown: ${word}`);
    }
  }

  // Calculate confidence based on known vs unknown
  const unknown = rules.filter(r => r.startsWith('unknown')).length;
  const total = rules.length;
  const confidence = total > 0 ? Math.max(0.2, 0.7 - (unknown / total) * 0.5) : 0.1;

  return {
    translation: susuWords.join(' '),
    confidence,
    source: 'transformation',
    rules
  };
}

// ===========================================================================
// PATTERN LEARNING (Harvest from Google)
// ===========================================================================

/**
 * Learn transformation patterns from Google translation examples
 * @param {Array} examples - Array of {english, google, ours} objects
 * @returns {Object} Learned patterns
 */
function learnPatterns(examples) {
  const patterns = {
    pronounSimplifications: {},
    wordMappings: {},
    phrasePatterns: [],
    structuralPatterns: []
  };

  for (const ex of examples) {
    const engWords = ex.english.toLowerCase().split(/\s+/);
    const googleWords = ex.google.toLowerCase().split(/\s+/);

    // Learn word alignments
    // This is a simple approach - real alignment is complex
    for (let i = 0; i < Math.min(engWords.length, googleWords.length); i++) {
      const eng = engWords[i].replace(/[?!.,]/g, '');
      const sus = googleWords[i];

      if (eng && sus && !ARTICLES.includes(eng)) {
        if (!patterns.wordMappings[eng]) {
          patterns.wordMappings[eng] = {};
        }
        patterns.wordMappings[eng][sus] = (patterns.wordMappings[eng][sus] || 0) + 1;
      }
    }

    // Learn full phrase if short
    if (engWords.length <= 4) {
      patterns.phrasePatterns.push({
        english: ex.english.toLowerCase().replace(/[?!.,]/g, ''),
        susu: ex.google
      });
    }
  }

  return patterns;
}

// ===========================================================================
// EXPORTS
// ===========================================================================

module.exports = {
  transform,
  generateSusu,
  learnPatterns,

  // Constants for external use
  WORD_TRANSFORMS,
  PHRASE_TRANSFORMS,
  PRONOUN_SIMPLIFY,

  // Test
  test: () => {
    console.log('=== Translation Transformer Test ===\n');

    const tests = [
      'I am happy',
      'The sun is hot',
      'I need help',
      'I eat rice',
      'What is your name',
      'I love you',
      'The water is cold'
    ];

    for (const eng of tests) {
      const result = generateSusu(eng);
      console.log(`"${eng}"`);
      console.log(`  => "${result.translation}"`);
      console.log(`  [${result.source}, ${(result.confidence * 100).toFixed(0)}%]`);
      console.log(`  Rules: ${result.rules.join(', ')}\n`);
    }
  }
};

// CLI test
if (require.main === module) {
  module.exports.test();
}
