/**
 * Susu Sentence Parser
 *
 * Real Susu rules from native speaker (Dash):
 *
 * 1. MOVEMENT VERBS REQUIRE DESTINATION
 *    - "I went" alone is incomplete
 *    - "Ntan Sigaxi Ne Ekol" = I went TO school
 *    - "Ne" = locative particle (to)
 *
 * 2. PAST TENSE HAS MULTIPLE FORMS
 *    - -xi suffix (formal): Sigaxi
 *    - -xi dropped (modern spoken): Siga
 *    - -nè suffix (contraction of -xi+ne): Siganè = Sigaxinè
 *    All mean the same: past tense
 *
 * 3. PRESENT/FUTURE WITH -fe/-fé
 *    - sigafe/sigafé = going (present progressive)
 *    - Ntan Sigafe = I am going
 *    - Ntan Sigafe tinan = I will go tomorrow (future = -fe + future time)
 *
 * 4. FAFE vs SIGAFE
 *    - fafe = coming (towards speaker)
 *    - sigafe = going (away from speaker)
 *    - Often interchangeable in casual speech
 */

const fs = require('fs');
const path = require('path');

// ============================================================================
// LINGUISTIC CONSTANTS (From native speaker knowledge)
// ============================================================================

// Locative particles
const LOCATIVES = {
  'ne': { meaning: 'to', usage: 'direction/destination' },
  'nè': { meaning: 'to', usage: 'direction/destination (variant)' },
  'ra': { meaning: 'at/in', usage: 'location' },
  'ma': { meaning: 'on/at', usage: 'surface/time' },
  'kui': { meaning: 'in/inside', usage: 'interior' },
  'fari': { meaning: 'on top', usage: 'surface' },
  'bun': { meaning: 'under', usage: 'below' },
};

// Tense/Aspect suffixes
const TENSE_SUFFIXES = {
  // Past tense variants (all equivalent)
  // Order matters: longer suffixes first to avoid false matches
  'xine': { tense: 'past', formal: false, notes: 'past + locative', includesLocative: true },
  'xinè': { tense: 'past', formal: false, notes: 'past + locative', includesLocative: true },
  'xi': { tense: 'past', formal: true, notes: 'formal past' },
  'xI': { tense: 'past', formal: true, notes: 'formal past (caps)' },
  // NOTE: 'ane' removed - it was matching incorrectly with verbs ending in 'a' like siga+nè
  'anè': { tense: 'past', formal: false, notes: 'a-stem verb + nè', includesLocative: true, requiresAStem: true },

  // Present/Future progressive
  'afe': { tense: 'progressive', notes: 'a-stem verb + fe', requiresAStem: true },
  'afé': { tense: 'progressive', notes: 'a-stem verb + fé', requiresAStem: true },
  'fe': { tense: 'progressive', notes: 'present progressive or future with time word' },
  'fé': { tense: 'progressive', notes: 'present progressive (accented)' },
  'fè': { tense: 'progressive', notes: 'present progressive (variant)' },
};

// Verbs that have -fe built in (already progressive)
const PROGRESSIVE_VERBS = {
  'fafe': { root: 'fa', meaning: 'come', tense: 'progressive', requiresDestination: false },
  'fafé': { root: 'fa', meaning: 'come', tense: 'progressive', requiresDestination: false },
  'sigafe': { root: 'siga', meaning: 'go', tense: 'progressive', requiresDestination: true },
  'sigafé': { root: 'siga', meaning: 'go', tense: 'progressive', requiresDestination: true },
  // Common verb forms with progressive
  'donfe': { root: 'don', meaning: 'eat', tense: 'progressive', requiresDestination: false },
  'walile': { root: 'wali', meaning: 'work', tense: 'progressive', requiresDestination: false },
};

// Time words that trigger future interpretation with -fe
const FUTURE_TIME_WORDS = new Set([
  'tinan', 'tina',           // tomorrow
  'sinma',                    // later
  'danguikhambi',            // later
  'yakha',                    // soon
  'wulé', 'wule',            // next
]);

// Past time words
const PAST_TIME_WORDS = new Set([
  'khoro', 'koro',           // yesterday
  'kunu',                     // yesterday (variant)
  'dangui',                   // before
]);

// Movement verbs (require destination)
const MOVEMENT_VERBS = {
  'siga': { meaning: 'go', direction: 'away', requiresDestination: true },
  'fafe': { meaning: 'come', direction: 'towards', requiresDestination: false },
  'fafé': { meaning: 'come', direction: 'towards', requiresDestination: false },
  'fa': { meaning: 'come (imperative)', direction: 'towards', requiresDestination: false },
  'gnèrè': { meaning: 'walk', direction: 'neutral', requiresDestination: true },
  'gui': { meaning: 'run', direction: 'neutral', requiresDestination: true },
};

// Subject pronouns (with all variants)
const PRONOUNS = {
  // Full forms
  'ntan': { person: '1s', meaning: 'I' },
  "n'tan": { person: '1s', meaning: 'I' },
  'n': { person: '1s', meaning: 'I (contracted)' },

  'itan': { person: '2s', meaning: 'you' },
  'wotan': { person: '2s', meaning: 'you' },
  'i': { person: '2s', meaning: 'you (contracted)' },
  'wo': { person: '2s', meaning: 'you (formal)' },

  'atan': { person: '3s', meaning: 'he/she/it' },
  'a': { person: '3s', meaning: 'he/she/it (contracted)' },
  'ä': { person: '3s', meaning: 'he/she/it (Google spelling)' },

  'moutan': { person: '1p', meaning: 'we' },
  'mou tan': { person: '1p', meaning: 'we' },
  'won': { person: '1p', meaning: 'we (contracted)' },
  'mou': { person: '1p', meaning: 'we (contracted)' },

  'etan': { person: '3p', meaning: 'they' },
  'e': { person: '3p', meaning: 'they (contracted)' },
};

// Negation markers
const NEGATION = {
  'mu': { type: 'standard', position: 'before verb' },
  "m'ma": { type: 'contracted', position: 'before verb', notes: 'mu + ma' },
  'mma': { type: 'contracted', position: 'before verb' },
};

// Common places (for destination)
const PLACES = {
  'ekol': 'school',
  'école': 'school',
  'ecole': 'school',
  'aeroport': 'airport',
  'aeropot': 'airport',
  'banxi': 'house/home',
  'dala': 'market',
  'mosquée': 'mosque',
  'église': 'church',
  'wali': 'work',
};

// Common fixed expressions (idioms)
const FIXED_EXPRESSIONS = {
  "m'ma kolon": { translation: "I don't know", notes: 'fixed expression' },
  "mma kolon": { translation: "I don't know", notes: 'fixed expression' },
  "m'ma fakhamou": { translation: "I don't understand", notes: 'fixed expression' },
  "tanàmoufègnê": { translation: "How are you? / Good morning", notes: 'greeting' },
  "tanamoufegne": { translation: "How are you? / Good morning", notes: 'greeting (normalized)' },
  "i rafan ma": { translation: "I love you", notes: 'fixed expression' },
  "won na tèmou": { translation: "See you / Goodbye", notes: 'farewell' },
  "won tina": { translation: "See you tomorrow", notes: 'farewell' },
  "wonou wali": { translation: "Thank you", notes: 'fixed expression' },
  "n'na fafe": { translation: "I'm coming", notes: 'fixed expression' },
  "nna fafe": { translation: "I'm coming", notes: 'fixed expression (normalized)' },
};

// ============================================================================
// PARSING FUNCTIONS
// ============================================================================

/**
 * Normalize Susu text for parsing
 */
function normalize(text) {
  if (!text) return '';
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')  // Remove diacritics for matching
    .trim();
}

/**
 * Tokenize sentence into words
 */
function tokenize(sentence) {
  // Handle apostrophes - keep them attached to following word
  return sentence
    .replace(/([nmNM])[''](\w)/g, "$1'$2")  // n'tan, m'ma
    .split(/\s+/)
    .filter(w => w.length > 0);
}

// Known verb roots for validation
const KNOWN_VERB_ROOTS = new Set([
  'siga', 'fa', 'kolon', 'kolonyi', 'fala', 'to', 'toé', 'wali',
  'dondé', 'yemin', 'khi', 'woyén', 'falè', 'wakhon', 'arafan',
  'allo', 'fin', 'tongo', 'raba', 'gnèrè', 'gui', 'kharan',
  'sebèliti', 'magnön', 'fakhamou', 'don', 'dökhö', 'béré',
]);

/**
 * Identify the verb and its tense
 */
function parseVerb(word) {
  const normalized = normalize(word);
  const result = {
    original: word,
    normalized: normalized,
    root: null,
    tense: 'present',
    isMovement: false,
    requiresDestination: false,
    includesLocative: false,
  };

  // First check if it's a progressive verb (fafe, sigafe)
  if (PROGRESSIVE_VERBS[normalized]) {
    const progVerb = PROGRESSIVE_VERBS[normalized];
    result.root = progVerb.root;
    result.tense = progVerb.tense;
    result.verbMeaning = progVerb.meaning;
    result.isMovement = progVerb.meaning === 'go' || progVerb.meaning === 'come';
    result.requiresDestination = progVerb.requiresDestination;
    return result;
  }

  // Check for tense suffixes (sorted by length - longest first)
  // But validate that the remaining root is a known verb
  const sortedSuffixes = Object.entries(TENSE_SUFFIXES)
    .sort((a, b) => b[0].length - a[0].length);

  for (const [suffix, info] of sortedSuffixes) {
    const normalizedSuffix = normalize(suffix);
    if (normalized.endsWith(normalizedSuffix) && normalized.length > normalizedSuffix.length + 1) {
      const potentialRoot = normalized.slice(0, -normalizedSuffix.length);

      // For a-stem suffixes like 'ane', 'afe', check if root+a is a known verb
      if (info.requiresAStem) {
        const aRoot = potentialRoot + 'a';
        if (KNOWN_VERB_ROOTS.has(aRoot) || MOVEMENT_VERBS[aRoot]) {
          result.root = aRoot;
          result.tense = info.tense;
          result.tenseMarker = suffix;
          result.includesLocative = info.includesLocative || false;
          break;
        }
      } else if (KNOWN_VERB_ROOTS.has(potentialRoot) || MOVEMENT_VERBS[potentialRoot] || potentialRoot.length >= 2) {
        // Accept if root is known, or if it's reasonably long (might be unknown verb)
        result.root = potentialRoot;
        result.tense = info.tense;
        result.tenseMarker = suffix;
        result.includesLocative = info.includesLocative || false;
        break;
      }
    }
  }

  // If no suffix found, root is the whole word
  if (!result.root) {
    result.root = normalized;
  }

  // Check if it's a movement verb
  const rootVariants = [result.root, normalized];
  for (const variant of rootVariants) {
    if (MOVEMENT_VERBS[variant]) {
      result.isMovement = true;
      result.direction = MOVEMENT_VERBS[variant].direction;
      // If -nè already includes locative, destination requirement is reduced
      result.requiresDestination = MOVEMENT_VERBS[variant].requiresDestination && !result.includesLocative;
      result.verbMeaning = MOVEMENT_VERBS[variant].meaning;
      break;
    }
  }

  return result;
}

/**
 * Parse a complete Susu sentence
 */
function parseSentence(sentence) {
  if (!sentence) return null;

  const tokens = tokenize(sentence);
  const normalizedSentence = normalize(sentence);

  // Step 0: Check for fixed expressions FIRST (idioms, greetings, etc.)
  for (const [expr, info] of Object.entries(FIXED_EXPRESSIONS)) {
    const normalizedExpr = normalize(expr);
    if (normalizedSentence === normalizedExpr || normalizedSentence.includes(normalizedExpr)) {
      return {
        original: sentence,
        tokens: tokens,
        structure: { fixedExpression: true },
        tense: 'present',
        mood: 'declarative',
        isComplete: true,
        notes: [info.notes],
        translation: info.translation,
        isFixedExpression: true,
      };
    }
  }

  const result = {
    original: sentence,
    tokens: tokens,
    structure: {
      subject: null,
      negation: null,
      verb: null,
      locative: null,
      destination: null,
      timeWord: null,
    },
    tense: 'present',
    mood: 'declarative',
    isComplete: true,
    notes: [],
    translation: null,
  };

  let i = 0;

  // Step 1: Find subject pronoun
  for (; i < tokens.length; i++) {
    const normalized = normalize(tokens[i]);
    const withApostrophe = tokens[i].toLowerCase();

    if (PRONOUNS[normalized] || PRONOUNS[withApostrophe]) {
      result.structure.subject = {
        form: tokens[i],
        info: PRONOUNS[normalized] || PRONOUNS[withApostrophe],
        index: i
      };
      i++;
      break;
    }
  }

  // Step 2: Check for negation
  for (; i < tokens.length; i++) {
    const normalized = normalize(tokens[i]);
    const withApostrophe = tokens[i].toLowerCase();

    if (NEGATION[normalized] || NEGATION[withApostrophe]) {
      result.structure.negation = {
        form: tokens[i],
        info: NEGATION[normalized] || NEGATION[withApostrophe],
        index: i
      };
      result.mood = 'negative';
      i++;
      break;
    }

    // If we hit a verb or something else, negation is absent
    break;
  }

  // Step 3: Find verb
  for (; i < tokens.length; i++) {
    const verbParse = parseVerb(tokens[i]);

    // Check if this looks like a verb (has known root or tense marker)
    if (verbParse.root && (verbParse.tenseMarker || MOVEMENT_VERBS[verbParse.root] || verbParse.root.length > 2)) {
      result.structure.verb = {
        form: tokens[i],
        parsed: verbParse,
        index: i
      };
      result.tense = verbParse.tense;
      i++;
      break;
    }
  }

  // Step 4: Find locative particle and destination
  // Special case: if verb suffix includes locative (-nè), next word is destination directly
  if (result.structure.verb?.parsed.includesLocative && i < tokens.length) {
    const normalized = normalize(tokens[i]);
    // Check it's not a time word
    if (!FUTURE_TIME_WORDS.has(normalized) && !PAST_TIME_WORDS.has(normalized)) {
      result.structure.locative = {
        form: '(embedded in verb suffix)',
        info: LOCATIVES['ne'],  // Use 'to' meaning
        embedded: true,
        index: null
      };
      result.structure.destination = {
        form: tokens[i],
        meaning: PLACES[normalized] || tokens[i],
        index: i
      };
      i++;
    }
  }

  for (; i < tokens.length; i++) {
    const normalized = normalize(tokens[i]);

    // Check for locative particle
    if (LOCATIVES[normalized] && !result.structure.locative) {
      result.structure.locative = {
        form: tokens[i],
        info: LOCATIVES[normalized],
        index: i
      };

      // Next word should be destination
      if (i + 1 < tokens.length) {
        i++;
        result.structure.destination = {
          form: tokens[i],
          meaning: PLACES[normalize(tokens[i])] || tokens[i],
          index: i
        };
      }
      continue;
    }

    // Check for time word
    if (FUTURE_TIME_WORDS.has(normalized)) {
      result.structure.timeWord = {
        form: tokens[i],
        type: 'future',
        index: i
      };
      // -fe + future time = future tense
      if (result.tense === 'progressive') {
        result.tense = 'future';
      }
      continue;
    }

    if (PAST_TIME_WORDS.has(normalized)) {
      result.structure.timeWord = {
        form: tokens[i],
        type: 'past',
        index: i
      };
      continue;
    }

    // If it's not a known particle, might be destination
    if (result.structure.locative && !result.structure.destination) {
      result.structure.destination = {
        form: tokens[i],
        meaning: PLACES[normalized] || tokens[i],
        index: i
      };
    }
  }

  // Step 5: Validate completeness
  if (result.structure.verb?.parsed.requiresDestination && !result.structure.destination) {
    result.isComplete = false;
    result.notes.push(`Movement verb "${result.structure.verb.form}" typically requires a destination (e.g., "ne ekol" = to school)`);
  }

  // Step 6: Generate translation
  result.translation = generateTranslation(result);

  return result;
}

// Map person codes to clean subject pronouns and verb agreement
const PERSON_TO_SUBJECT = {
  '1s': { subject: 'I', verbBe: 'am', verbDo: 'do' },
  '2s': { subject: 'you', verbBe: 'are', verbDo: 'do' },
  '3s': { subject: 'he/she', verbBe: 'is', verbDo: 'does' },
  '1p': { subject: 'we', verbBe: 'are', verbDo: 'do' },
  '3p': { subject: 'they', verbBe: 'are', verbDo: 'do' },
};

/**
 * Generate English translation from parsed structure
 */
function generateTranslation(parsed) {
  const parts = [];

  // Get person info for verb agreement
  const person = parsed.structure.subject?.info?.person || '3s';
  const personInfo = PERSON_TO_SUBJECT[person] || PERSON_TO_SUBJECT['3s'];

  // Subject
  if (parsed.structure.subject) {
    parts.push(personInfo.subject);
  }

  // Negation
  if (parsed.structure.negation) {
    if (parsed.tense === 'past') {
      parts.push("didn't");
    } else if (parsed.tense === 'future') {
      parts.push("won't");
    } else {
      parts.push(personInfo.verbDo === 'does' ? "doesn't" : "don't");
    }
  }

  // Verb
  if (parsed.structure.verb) {
    let verbForm = parsed.structure.verb.parsed.verbMeaning || parsed.structure.verb.parsed.root;

    if (parsed.tense === 'past' && !parsed.structure.negation) {
      // Simple past
      if (verbForm === 'go') verbForm = 'went';
      else if (verbForm === 'come') verbForm = 'came';
      else verbForm = verbForm + 'ed';
    } else if (parsed.tense === 'progressive' || parsed.tense === 'future') {
      // Present progressive or future
      if (verbForm === 'go') verbForm = parsed.tense === 'future' ? 'will go' : personInfo.verbBe + ' going';
      else if (verbForm === 'come') verbForm = parsed.tense === 'future' ? 'will come' : personInfo.verbBe + ' coming';
      else verbForm = (parsed.tense === 'future' ? 'will ' : personInfo.verbBe + ' ') + verbForm + 'ing';
    }

    parts.push(verbForm);
  }

  // Locative + Destination
  if (parsed.structure.locative && parsed.structure.destination) {
    parts.push(parsed.structure.locative.info.meaning);
    parts.push(parsed.structure.destination.meaning);
  }

  // Time word
  if (parsed.structure.timeWord) {
    if (parsed.structure.timeWord.type === 'future') {
      parts.push('tomorrow'); // Simplified
    } else {
      parts.push('yesterday');
    }
  }

  return parts.join(' ');
}

/**
 * Quick parse - just get the meaning
 */
function quickParse(sentence) {
  const parsed = parseSentence(sentence);
  return {
    input: sentence,
    translation: parsed.translation,
    tense: parsed.tense,
    complete: parsed.isComplete,
    notes: parsed.notes,
  };
}

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = {
  parseSentence,
  parseVerb,
  quickParse,
  tokenize,
  normalize,
  generateTranslation,
  LOCATIVES,
  TENSE_SUFFIXES,
  PRONOUNS,
  NEGATION,
  MOVEMENT_VERBS,
  FUTURE_TIME_WORDS,
  PAST_TIME_WORDS,
  FIXED_EXPRESSIONS,
  PROGRESSIVE_VERBS,
  KNOWN_VERB_ROOTS,
  PLACES,
};

// ============================================================================
// CLI TEST
// ============================================================================

if (require.main === module) {
  console.log('=== SUSU SENTENCE PARSER ===\n');
  console.log('Native speaker rules applied:\n');
  console.log('  1. Movement verbs require destination');
  console.log('  2. -xi (formal) = -nè (contracted) = past');
  console.log('  3. -fe + future time word = future tense');
  console.log('  4. fafe/sigafe interchangeable in casual speech\n');

  const testSentences = [
    // Fixed expressions (idioms) - should match immediately
    "M'ma kolon",               // I don't know (fixed)
    "tanàmoufègnê",             // How are you / Good morning (fixed)
    "wonou wali",               // Thank you (fixed)
    "i rafan ma",               // I love you (fixed)

    // Past tense variants (all same meaning)
    "Ntan Sigaxi ne Ekol",      // I went to school (formal)
    "Ntan Siga ne Ekol",        // I went to school (modern, -xi dropped)
    "Ntan Siganè Ekol",         // I went to school (contracted -xi+ne, COMPLETE because -nè includes locative)

    // Present/Future with -fe
    "Ntan Sigafe",              // I am going (incomplete without destination)
    "Ntan Sigafe tinan",        // I will go tomorrow (future)

    // Coming vs Going
    "N'tan fafe",               // I am coming (complete - coming doesn't require destination)
    "A sigafe ne banxi",        // He/she is going to house

    // Negation
    "Ntan mu siga ne ekol",     // I don't go to school

    // Incomplete (missing destination)
    "Ntan sigaxi",              // I went (incomplete - where?)
  ];

  for (const sentence of testSentences) {
    console.log(`Input: "${sentence}"`);
    const result = quickParse(sentence);
    console.log(`  Translation: ${result.translation}`);
    console.log(`  Tense: ${result.tense}`);
    console.log(`  Complete: ${result.complete}`);
    if (result.notes.length > 0) {
      console.log(`  Notes: ${result.notes.join('; ')}`);
    }
    console.log();
  }

  console.log('=== VERB PARSING ===\n');

  const verbTests = ['sigaxi', 'siganè', 'sigafe', 'fafe', 'siga'];
  for (const verb of verbTests) {
    const parsed = parseVerb(verb);
    console.log(`"${verb}":`);
    console.log(`  Root: ${parsed.root}`);
    console.log(`  Tense: ${parsed.tense}`);
    if (parsed.tenseMarker) {
      console.log(`  Marker: -${parsed.tenseMarker}`);
    }
    console.log();
  }
}
