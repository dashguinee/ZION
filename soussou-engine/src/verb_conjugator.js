/**
 * Susu Verb Conjugation System
 *
 * Handles:
 * - Person (I, you, he/she, we, they)
 * - Tense (past, present, future)
 * - Aspect (perfective, imperfective)
 * - Mood (declarative, imperative, interrogative)
 * - Negation
 *
 * Based on patterns extracted from Google SMOL data
 */

// ============================================================================
// PRONOUN SYSTEM
// ============================================================================

const PRONOUNS = {
  // Subject pronouns (used before verbs)
  subject: {
    'I': { short: 'n', full: 'ntan', emphatic: "n'tan", contraction: "n'" },
    'you': { short: 'i', full: 'itan', emphatic: 'wotan', formal: 'wo' },
    'he': { short: 'a', full: 'atan', emphatic: 'atan' },
    'she': { short: 'a', full: 'atan', emphatic: 'guinèma' },
    'we': { short: 'won', full: 'moutan', emphatic: 'mou tan' },
    'they': { short: 'e', full: 'etan', emphatic: 'etan' },
  },

  // Object pronouns
  object: {
    'me': 'ntan',
    'you': 'wotan',
    'him': 'ä',
    'her': 'akha',
    'us': 'mou tan',
    'them': 'etan',
  },

  // Possessive markers (suffixes or standalone)
  possessive: {
    'my': { standalone: 'oun', suffix: '-ma' },
    'your': { standalone: 'i', suffix: '-oun' },
    'his/her': { standalone: 'akha', suffix: '-kha' },
    'our': { standalone: 'mou', suffix: null },
    'their': { standalone: 'é', suffix: null },
  }
};

// ============================================================================
// COMMON VERBS
// ============================================================================

const VERBS = {
  // Movement
  'go': { base: 'siga', imperative: 'siga' },
  'come': { base: 'fafé', imperative: 'fâ', variants: ['fafe'] },
  'run': { base: 'igui', imperative: 'gui' },
  'walk': { base: 'gnèrè', imperative: 'gnèrè' },

  // Communication
  'speak': { base: 'woyénfé', imperative: 'woyén' },
  'say': { base: 'falèfé', imperative: 'fala' },
  'hear': { base: 'kharamè', imperative: 'kharan' },
  'call': { base: 'khili', imperative: 'khili' },

  // Cognition
  'know': { base: 'kolonyi', imperative: 'kolon', negativeBase: 'kolon' },
  'understand': { base: 'fakhamou', imperative: 'fakhamou' },
  'think': { base: 'magnönyi', imperative: 'magnön' },
  'want': { base: 'wakhonyi', imperative: 'wakhon', variants: ['wama'] },

  // Physical actions
  'eat': { base: 'donfé', imperative: 'don' },
  'drink': { base: 'yeminfé', imperative: 'yemin' },
  'sleep': { base: 'khifé', imperative: 'khi' },
  'see': { base: 'toé', imperative: 'to' },
  'give': { base: 'finma', imperative: 'fin' },
  'take': { base: 'tongoï', imperative: 'tongo' },

  // State/Being
  'be': { base: 'iyètè', variants: ['na', 'lu'] },
  'have': { base: 'moun', variants: ['bara'] },
  'like': { base: 'allo', variants: ['rafan'] },
  'love': { base: 'arafan', variants: ['rafan'] },

  // Work/Activity
  'work': { base: 'wali', imperative: 'wali' },
  'do/make': { base: 'araba', imperative: 'raba' },
  'read': { base: 'kharanyi', imperative: 'kharan' },
  'write': { base: 'sebèlitifé', imperative: 'sebèliti' },
};

// ============================================================================
// TENSE/ASPECT MARKERS
// ============================================================================

const TENSE_MARKERS = {
  // Past (perfective) - add suffix -xi
  past: {
    suffix: '-xi',
    notes: 'Indicates completed action'
  },

  // Present (imperfective) - base form, often with 'na' auxiliary
  present: {
    auxiliary: 'na',
    notes: 'Base verb or with "na" for ongoing action'
  },

  // Future - use 'na' or 'bara' auxiliary before verb
  future: {
    auxiliary: ['na', 'bara'],
    notes: '"na" for near future, "bara" for intention'
  },

  // Progressive - 'na' before verb
  progressive: {
    auxiliary: 'na',
    notes: 'Subject + na + verb for ongoing action'
  }
};

// ============================================================================
// CONJUGATION FUNCTIONS
// ============================================================================

/**
 * Conjugate a verb with given parameters
 * @param {string} verbEn - English verb (key in VERBS)
 * @param {Object} options - Conjugation options
 * @returns {string} Conjugated Susu verb phrase
 */
function conjugate(verbEn, options = {}) {
  const {
    person = 'I',           // I, you, he, she, we, they
    tense = 'present',      // past, present, future
    negative = false,       // Add negation?
    imperative = false,     // Command form?
    formal = false,         // Formal "you"?
    includeSubject = true,  // Include subject pronoun?
  } = options;

  const verb = VERBS[verbEn.toLowerCase()];
  if (!verb) {
    return `[Unknown verb: ${verbEn}]`;
  }

  const pronoun = PRONOUNS.subject[person];
  if (!pronoun && !imperative) {
    return `[Unknown person: ${person}]`;
  }

  let result = [];

  // Imperative (command) - no subject needed
  if (imperative) {
    if (negative) {
      result.push('i');  // "you" implied
      result.push('m\'ma');  // negation
      result.push(verb.imperative || verb.base);
    } else {
      result.push(verb.imperative || verb.base);
    }
    return result.join(' ');
  }

  // Add subject pronoun
  if (includeSubject) {
    if (formal && person === 'you') {
      result.push(pronoun.formal);
    } else {
      result.push(pronoun.full);
    }
  }

  // Add negation if needed
  if (negative) {
    result.push('mu');  // Or m'ma before certain verbs
  }

  // Add tense markers and verb
  let verbForm = verb.base;

  switch (tense) {
    case 'past':
      // Past: verb + -xi
      verbForm = verb.base.replace(/[éèêfey]$/, '') + 'xi';
      break;

    case 'future':
      // Future: add auxiliary before verb
      result.push('na');
      break;

    case 'progressive':
      // Progressive: na + verb
      result.push('na');
      break;

    case 'present':
    default:
      // Present: base form
      break;
  }

  result.push(verbForm);

  return result.join(' ');
}

/**
 * Generate a simple sentence
 */
function makeSentence(pattern, slots = {}) {
  const patterns = {
    'greeting': 'tanàmoufègnê',  // How are you / Good morning
    'greeting_response': 'tana yo moun ma',  // I'm fine

    'i_am_coming': 'n\'na fafé',
    'see_you': 'won na tèmou',
    'see_you_tomorrow': 'won tina',
    'goodbye': 'gnoungouî',

    'i_love_you': 'i rafan ma',
    'i_miss_you': 'i khöli nä m\'ma',

    'i_dont_know': 'm\'ma kolon',
    'i_dont_understand': 'm\'ma fakhamou',

    'what_is_your_name': 'i khili di?',
    'my_name_is': `n khili ${slots.name || '...'}`,

    'where_are_you_going': 'i na siga mindé?',
    'i_am_going_to': `n\'na siga ${slots.place || '...'}`,

    'thank_you': 'wonou wali',
    'please': 'nbari khandi',
    'sorry': 'nbara tantan',
    'excuse_me': 'dignèn ma',
  };

  return patterns[pattern] || `[Unknown pattern: ${pattern}]`;
}

/**
 * Get conjugation table for a verb
 */
function getConjugationTable(verbEn) {
  const verb = VERBS[verbEn.toLowerCase()];
  if (!verb) return null;

  const persons = ['I', 'you', 'he', 'we', 'they'];
  const tenses = ['present', 'past', 'future'];

  const table = {
    verb: verbEn,
    base: verb.base,
    imperative: verb.imperative,
    conjugations: {}
  };

  for (const person of persons) {
    table.conjugations[person] = {};
    for (const tense of tenses) {
      table.conjugations[person][tense] = {
        affirmative: conjugate(verbEn, { person, tense }),
        negative: conjugate(verbEn, { person, tense, negative: true })
      };
    }
  }

  return table;
}

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = {
  conjugate,
  makeSentence,
  getConjugationTable,
  PRONOUNS,
  VERBS,
  TENSE_MARKERS,
};

// ============================================================================
// CLI TEST
// ============================================================================

if (require.main === module) {
  console.log('=== SUSU VERB CONJUGATION SYSTEM ===\n');

  // Test basic conjugation
  console.log('--- Basic Conjugations ---\n');

  const testCases = [
    { verb: 'go', person: 'I', tense: 'present' },
    { verb: 'go', person: 'I', tense: 'past' },
    { verb: 'go', person: 'you', tense: 'future' },
    { verb: 'come', person: 'he', tense: 'present' },
    { verb: 'know', person: 'I', tense: 'present', negative: true },
    { verb: 'understand', person: 'I', tense: 'present', negative: true },
  ];

  for (const tc of testCases) {
    const result = conjugate(tc.verb, tc);
    const neg = tc.negative ? ' (negative)' : '';
    console.log(`${tc.verb} (${tc.person}, ${tc.tense}${neg}): ${result}`);
  }

  console.log('\n--- Imperatives ---\n');
  console.log(`go!: ${conjugate('go', { imperative: true })}`);
  console.log(`come!: ${conjugate('come', { imperative: true })}`);
  console.log(`don't go!: ${conjugate('go', { imperative: true, negative: true })}`);

  console.log('\n--- Common Sentences ---\n');
  const sentences = [
    'greeting',
    'greeting_response',
    'i_am_coming',
    'see_you_tomorrow',
    'i_love_you',
    'i_dont_know',
    'what_is_your_name',
    'thank_you',
    'sorry',
  ];

  for (const s of sentences) {
    console.log(`${s}: ${makeSentence(s)}`);
  }

  console.log('\n--- Full Conjugation Table (go) ---\n');
  const table = getConjugationTable('go');
  console.log(`Verb: ${table.verb}`);
  console.log(`Base: ${table.base}`);
  console.log(`Imperative: ${table.imperative}`);
  console.log('\nConjugations:');
  for (const [person, tenses] of Object.entries(table.conjugations)) {
    console.log(`  ${person}:`);
    for (const [tense, forms] of Object.entries(tenses)) {
      console.log(`    ${tense}: ${forms.affirmative}`);
      console.log(`    ${tense} (neg): ${forms.negative}`);
    }
  }
}
