/**
 * GUINIUS - Grammar-Aware Susu Sentence Generator
 *
 * Generates natural Susu sentences from English input by applying
 * Susu grammar rules:
 * 1. SOV (Subject-Object-Verb) word order
 * 2. Tense markers: na+VERB-fe (progressive), bara+VERB (perfective), naxa (narrative past)
 * 3. Negation: mu before verb
 * 4. Question words typically at end
 * 5. Drop articles (the, a, an)
 *
 * Verified against Google Translate patterns.
 */

const fs = require('fs');
const path = require('path');

// Import grammar extractor constants
let grammarExtractor;
try {
  grammarExtractor = require('./grammar_extractor.js');
} catch (e) {
  grammarExtractor = null;
}

// Import normalization
let normalize, normalizePhrase;
try {
  const normalizer = require('./normalize.js');
  normalize = normalizer.normalize;
  normalizePhrase = normalizer.normalizePhrase;
} catch (e) {
  normalize = (s) => s?.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim() || '';
  normalizePhrase = normalize;
}

// ============================================================================
// CORE DICTIONARIES - English to Susu
// ============================================================================

const PRONOUNS = {
  // Subject pronouns
  'i': 'N',
  'me': 'N',
  'you': 'I',
  'he': 'A',
  'she': 'A',
  'it': 'A',
  'we': 'Won',
  'us': 'Won',
  'they': 'E',
  'them': 'E',

  // Formal you
  'you_formal': 'Wo',
};

const PRONOUNS_EMPHATIC = {
  'i': 'Ntan',
  'me': 'Ntan',
  'you': 'Itan',
  'he': 'Atan',
  'she': 'Atan',
  'it': 'Atan',
  'we': 'Muxu',
  'they': 'Etan',
};

const POSSESSIVES = {
  'my': 'N ma',
  'your': 'I kha',
  'his': 'A kha',
  'her': 'A kha',
  'its': 'A kha',
  'our': 'Won ma',
  'their': 'E kha',
};

// Core verbs: English -> { base, progressive, perfective, imperative }
const VERBS = {
  // Movement
  'go': { base: 'siga', progressive: 'sigafe', perfective: 'sigaxi', imperative: 'siga' },
  'come': { base: 'fa', progressive: 'fafe', perfective: 'faxi', imperative: 'fa' },
  'run': { base: 'gi', progressive: 'gife', perfective: 'gixi', imperative: 'gi' },
  'walk': { base: 'ɲɛrɛ', progressive: 'ɲɛrɛfe', perfective: 'ɲɛrɛxi', imperative: 'ɲɛrɛ' },
  'return': { base: 'gbilen', progressive: 'gbilenfe', perfective: 'gbilenxi', imperative: 'gbilen' },
  'leave': { base: 'keli', progressive: 'kelife', perfective: 'kelixi', imperative: 'keli' },
  'enter': { base: 'so', progressive: 'sofe', perfective: 'soxi', imperative: 'so' },
  'exit': { base: 'mini', progressive: 'minife', perfective: 'minixi', imperative: 'mini' },

  // Communication
  'say': { base: 'fala', progressive: 'falafe', perfective: 'falaxi', imperative: 'fala' },
  'speak': { base: 'wɔyɛn', progressive: 'wɔyɛnfe', perfective: 'wɔyɛnxi', imperative: 'wɔyɛn' },
  'tell': { base: 'fala', progressive: 'falafe', perfective: 'falaxi', imperative: 'fala' },
  'ask': { base: 'maxɔrin', progressive: 'maxɔrinfe', perfective: 'maxɔrinxi', imperative: 'maxɔrin' },
  'answer': { base: 'yaabi', progressive: 'yaabife', perfective: 'yaabixi', imperative: 'yaabi' },
  'call': { base: 'xili', progressive: 'xilife', perfective: 'xilixi', imperative: 'xili' },
  'hear': { base: 'mɛ', progressive: 'mɛfe', perfective: 'mɛxi', imperative: 'mɛ' },
  'listen': { base: 'tuli mati', progressive: 'tuli matife', perfective: 'tuli matixi', imperative: 'tuli mati' },

  // Cognition
  'know': { base: 'kolon', progressive: 'kolonfe', perfective: 'kolonxi', imperative: 'kolon' },
  'understand': { base: 'faxamu', progressive: 'faxamufe', perfective: 'faxamuxi', imperative: 'faxamu' },
  'think': { base: 'maɲɔxun', progressive: 'maɲɔxunfe', perfective: 'maɲɔxunxi', imperative: 'maɲɔxun' },
  'remember': { base: 'ratu', progressive: 'ratufe', perfective: 'ratuxi', imperative: 'ratu' },
  'forget': { base: 'nɛɛmu', progressive: 'nɛɛmufe', perfective: 'nɛɛmuxi', imperative: 'nɛɛmu' },
  'learn': { base: 'xaran', progressive: 'xaranfe', perfective: 'xaranxi', imperative: 'xaran' },
  'want': { base: 'wama', progressive: 'wamafe', perfective: 'wamaxi', imperative: 'wama' },
  'need': { base: 'wama', progressive: 'wamafe', perfective: 'wamaxi', imperative: 'wama' },

  // Physical actions
  'eat': { base: 'don', progressive: 'donfe', perfective: 'donxi', imperative: 'don' },
  'drink': { base: 'min', progressive: 'minfe', perfective: 'minxi', imperative: 'min' },
  'sleep': { base: 'xi', progressive: 'xife', perfective: 'xixi', imperative: 'xi' },
  'wake': { base: 'xunu', progressive: 'xunufe', perfective: 'xunuxi', imperative: 'xunu' },
  'see': { base: 'to', progressive: 'tofe', perfective: 'toxi', imperative: 'to' },
  'look': { base: 'mato', progressive: 'matofe', perfective: 'matoxi', imperative: 'mato' },
  'watch': { base: 'mato', progressive: 'matofe', perfective: 'matoxi', imperative: 'mato' },
  'give': { base: 'fi', progressive: 'fife', perfective: 'fixi', imperative: 'fi' },
  'take': { base: 'tongo', progressive: 'tongofe', perfective: 'tongoxi', imperative: 'tongo' },
  'bring': { base: 'fa', progressive: 'fafe', perfective: 'faxi', imperative: 'fa' },
  'put': { base: 'dɔxɔ', progressive: 'dɔxɔfe', perfective: 'dɔxɔxi', imperative: 'dɔxɔ' },
  'make': { base: 'raba', progressive: 'rabafe', perfective: 'rabaxi', imperative: 'raba' },
  'do': { base: 'raba', progressive: 'rabafe', perfective: 'rabaxi', imperative: 'raba' },
  'work': { base: 'wali', progressive: 'walife', perfective: 'walixi', imperative: 'wali' },
  'help': { base: 'mali', progressive: 'malife', perfective: 'malixi', imperative: 'mali' },
  'buy': { base: 'sara', progressive: 'sarafe', perfective: 'saraxi', imperative: 'sara' },
  'sell': { base: 'mati', progressive: 'matife', perfective: 'matixi', imperative: 'mati' },
  'get': { base: 'sɔtɔ', progressive: 'sɔtɔfe', perfective: 'sɔtɔxi', imperative: 'sɔtɔ' },
  'find': { base: 'to', progressive: 'tofe', perfective: 'toxi', imperative: 'to' },
  'lose': { base: 'lɔɛ', progressive: 'lɔɛfe', perfective: 'lɔɛxi', imperative: 'lɔɛ' },
  'write': { base: 'sɛbɛli', progressive: 'sɛbɛlife', perfective: 'sɛbɛlixi', imperative: 'sɛbɛli' },
  'read': { base: 'xaran', progressive: 'xaranfe', perfective: 'xaranxi', imperative: 'xaran' },
  'open': { base: 'rabi', progressive: 'rabife', perfective: 'rabixi', imperative: 'rabi' },
  'close': { base: 'balan', progressive: 'balanfe', perfective: 'balanxi', imperative: 'balan' },
  'sit': { base: 'dɔxɔ', progressive: 'dɔxɔfe', perfective: 'dɔxɔxi', imperative: 'dɔxɔ' },
  'stand': { base: 'ti', progressive: 'tife', perfective: 'tixi', imperative: 'ti' },
  'wait': { base: 'mame', progressive: 'mamefe', perfective: 'mamexi', imperative: 'mame' },

  // States/Being
  'be': { base: 'na', copula: true },
  'have': { base: 'na', possessive: true },
  'like': { base: 'rafan', progressive: 'rafanfe', perfective: 'rafanxi', imperative: 'rafan' },
  'love': { base: 'xanu', progressive: 'xanufe', perfective: 'xanuxi', imperative: 'xanu' },
  'hate': { base: 'xɔn', progressive: 'xɔnfe', perfective: 'xɔnxi', imperative: 'xɔn' },
  'feel': { base: 'kolon', progressive: 'kolonfe', perfective: 'kolonxi', imperative: 'kolon' },
  'can': { base: 'nɔma', modal: true },
  'must': { base: 'lan', modal: true },
  'should': { base: 'lan', modal: true },
  'tire': { base: 'tagan', progressive: 'taganfe', perfective: 'taganxi', imperative: 'tagan' },
};

// Common greetings and phrases
const GREETINGS = {
  'hello': 'i kena',
  'hi': 'i kena',
  'good morning': 'tana mafere',
  'good evening': 'tana wure',
  'goodbye': 'an bena tina',
  'thank you': 'i niin',
  'thanks': 'i niin',
  'please': 'yandi',
  'sorry': 'hakketo',
  'excuse me': 'hakketo',
  'welcome': 'kena ke',
  'how are you': 'i kena',
  'i am fine': 'tana yo mun ma',
  'yes': 'iyo',
  'no': 'ade',
  'ok': 'o ye',
  'maybe': 'tɛmui',
  'of course': 'a na na',
};

// Common nouns
const NOUNS = {
  // Greetings-related
  'student': 'xarandiyi',
  'teacher': 'karamɔxɔ',
  'doctor': 'dɔkitɛrɛ',
  'farmer': 'xɛɛkulayi',
  'worker': 'walilayi',
  'king': 'mangɛ',

  // Food
  'rice': 'malo',
  'food': 'donsee',
  'water': 'ye',
  'meat': 'sube',
  'fish': 'yɛxɛ',
  'bread': 'buru',
  'fruit': 'tɔnsɔɛ',
  'milk': 'nɔnɔn',
  'salt': 'kɔɔ',
  'sugar': 'sukari',
  'oil': 'ture',

  // Family
  'father': 'baba',
  'mother': 'na',
  'child': 'di',
  'children': 'die',
  'son': 'di xɛmɛ',
  'daughter': 'di ginɛ',
  'brother': 'tara',
  'sister': 'tara ginɛ',
  'wife': 'ginɛ',
  'husband': 'xɛmɛ',
  'family': 'denbaya',
  'friend': 'booree',
  'person': 'mixi',
  'people': 'mixie',
  'man': 'xɛmɛ',
  'woman': 'ginɛ',
  'boy': 'fonikɛ',
  'girl': 'sungutu',

  // Places
  'house': 'banxi',
  'home': 'banxi',
  'school': 'ekɔli',
  'market': 'sinee',
  'hospital': 'dɔkitɛrɛ banxi',
  'church': 'sali banxi',
  'mosque': 'misidi',
  'city': 'taade',
  'village': 'sode',
  'road': 'kira',
  'street': 'kira',
  'place': 'yire',
  'country': 'bɔxi',
  'world': 'duniɲa',

  // Body
  'head': 'xun',
  'eye': 'ya',
  'eyes': 'yae',
  'ear': 'tuli',
  'mouth': 'dɛ',
  'hand': 'bɛlɛ',
  'hands': 'bɛlɛe',
  'foot': 'san',
  'feet': 'sane',
  'heart': 'bɔɲɛ',
  'body': 'fate',

  // Time
  'day': 'lɔxɔ',
  'night': 'kɔɛ',
  'morning': 'soge',
  'evening': 'nunmari',
  'today': 'bi',
  'tomorrow': 'tina',
  'yesterday': 'bire',
  'week': 'lɔxɔ solofere',
  'month': 'kike',
  'year': 'ɲɛ',
  'time': 'waxati',
  'hour': 'waxati',
  'minute': 'miniti',

  // Nature
  'sun': 'soge',
  'moon': 'kike',
  'star': 'tɔlɔngɛ',
  'sky': 'koore',
  'rain': 'tunɛ',
  'wind': 'foye',
  'fire': 'tɛ',
  'earth': 'bɔxi',
  'tree': 'wuri',
  'river': 'xure',
  'mountain': 'gɛya',

  // Objects
  'book': 'buki',
  'money': 'kɔbiri',
  'car': 'woto',
  'phone': 'telefɔn',
  'door': 'naadɛ',
  'table': 'tabali',
  'chair': 'kongodɛ',
  'bed': 'saade',
  'clothes': 'sosee',
  'thing': 'fe',
  'things': 'fee',
  'work': 'wali',
  'word': 'masenyi',
  'name': 'xili',
  'god': 'Ala',
  'truth': 'nɔndi',
  'life': 'dunifee',
  'death': 'faxafe',
  'love': 'xanunteya',
  'peace': 'bɔɲɛsa',
};

// Adjectives
const ADJECTIVES = {
  'good': 'fanyi',
  'bad': 'kobi',
  'big': 'gbeli',
  'small': 'xurun',
  'new': 'nɛɛmu',
  'old': 'fori',
  'young': 'fonikɛ',
  'hot': 'wolen',
  'cold': 'xinde',
  'beautiful': 'tofan',
  'ugly': 'yagude',
  'long': 'kuya',
  'short': 'xute',
  'fast': 'xulun',
  'slow': 'sama',
  'strong': 'sɛnbɛ',
  'weak': 'sɛnbɛtare',
  'happy': 'sɛɛwa',
  'sad': 'sunnun',
  'hungry': 'kaamɛ',
  'thirsty': 'yeli',
  'tired': 'tagan',
  'sick': 'fura',
  'healthy': 'kɛnde',
  'rich': 'nafulu',
  'poor': 'setare',
  'many': 'wuyaxi',
  'few': 'diinɛ',
  'all': 'birin',
  'every': 'birin',
  'other': 'gbɛtɛ',
  'same': 'keren',
  'different': 'gbɛtɛ',
  'first': 'singe',
  'last': 'dɔnxɔɛ',
  'easy': 'mali',
  'hard': 'xɔrɔxɔ',
  'true': 'nɔndi',
  'false': 'wule',
  'right': 'tinxin',
  'wrong': 'tinxintare',
  'clean': 'sɛniyɛn',
  'dirty': 'mara',
};

// Question words
const QUESTION_WORDS = {
  'where': 'minden',
  'what': 'munse',
  'who': 'nde',
  'when': 'mun tuma',
  'why': 'munfe ra',
  'how': 'di',
  'which': 'naxan',
  'how much': 'yiri',
  'how many': 'yiri',
};

// Prepositions/Postpositions
const PREPOSITIONS = {
  'in': 'kui',
  'at': 'ra',
  'on': 'fari',
  'under': 'bun',
  'to': 'ma',
  'from': 'keli',
  'with': 'nun',
  'for': 'bɛ',
  'about': 'xa fe',
  'before': 'yara',
  'after': 'xanbi',
  'between': 'tagi',
  'near': 'fɛ ma',
  'far': 'makuya',
  'here': 'be',
  'there': 'mɛnni',
  'inside': 'kui',
  'outside': 'fari ma',
  'up': 'fari',
  'down': 'bun',
};

// Connectors
const CONNECTORS = {
  'and': 'nun',
  'or': 'xa na mu',
  'but': 'kɔnɔ',
  'because': 'barima',
  'so': 'na nan a',
  'if': 'xa',
  'then': 'na',
  'also': 'fan',
  'very': 'gbo',
  'too': 'fan',
  'only': 'gbansan',
  'just': 'gbansan',
  'still': 'haali',
  'already': 'bara',
  'not': 'mu',
  'never': 'abadan mu',
  'always': 'waxati birin',
  'now': 'yakɔsi',
  'again': 'man',
  'please': 'yandi',
  'thank you': 'i niin',
  'yes': 'iyo',
  'no': 'ade',
};

// Numbers
const NUMBERS = {
  'one': 'keren',
  'two': 'firin',
  'three': 'saxan',
  'four': 'naani',
  'five': 'suli',
  'six': 'senni',
  'seven': 'solofere',
  'eight': 'solomasaxan',
  'nine': 'solomanaani',
  'ten': 'fu',
  'hundred': 'keme',
  'thousand': 'wulu',
};

// ============================================================================
// ENGLISH PARSING
// ============================================================================

/**
 * Tokenize and normalize English sentence
 */
function tokenizeEnglish(sentence) {
  // First handle contractions before splitting
  let processed = sentence.toLowerCase()
    // Handle "don't", "doesn't", "didn't", etc.
    .replace(/don't/g, 'do not')
    .replace(/doesn't/g, 'does not')
    .replace(/didn't/g, 'did not')
    .replace(/won't/g, 'will not')
    .replace(/can't/g, 'cannot')
    .replace(/couldn't/g, 'could not')
    .replace(/wouldn't/g, 'would not')
    .replace(/shouldn't/g, 'should not')
    .replace(/isn't/g, 'is not')
    .replace(/aren't/g, 'are not')
    .replace(/wasn't/g, 'was not')
    .replace(/weren't/g, 'were not')
    .replace(/haven't/g, 'have not')
    .replace(/hasn't/g, 'has not')
    .replace(/hadn't/g, 'had not')
    // Handle "'s" for "is" and "'re" for "are"
    .replace(/i'm/g, 'i am')
    .replace(/you're/g, 'you are')
    .replace(/he's/g, 'he is')
    .replace(/she's/g, 'she is')
    .replace(/it's/g, 'it is')
    .replace(/we're/g, 'we are')
    .replace(/they're/g, 'they are')
    .replace(/i've/g, 'i have')
    .replace(/you've/g, 'you have')
    .replace(/we've/g, 'we have')
    .replace(/they've/g, 'they have')
    .replace(/i'll/g, 'i will')
    .replace(/you'll/g, 'you will')
    .replace(/he'll/g, 'he will')
    .replace(/she'll/g, 'she will')
    .replace(/we'll/g, 'we will')
    .replace(/they'll/g, 'they will');

  return processed
    .replace(/[.,!?;:'"]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 0);
}

/**
 * Detect sentence type (statement, question, command, negation)
 */
function detectSentenceType(sentence, tokens) {
  const s = sentence.toLowerCase();
  const firstWord = tokens[0] || '';

  const isQuestion = s.includes('?') ||
    ['what', 'where', 'when', 'who', 'why', 'how', 'which', 'do', 'does', 'did', 'is', 'are', 'was', 'were', 'can', 'could', 'will', 'would', 'should'].includes(firstWord);

  const isCommand = ['go', 'come', 'eat', 'drink', 'look', 'listen', 'wait', 'give', 'take', 'open', 'close', 'sit', 'stand', 'stop', 'please'].includes(firstWord);

  const hasNegation = tokens.some(t => ['not', "n't", "don't", "doesn't", "didn't", "won't", "can't", "couldn't", "wouldn't", "shouldn't", "isn't", "aren't", "wasn't", "weren't", "never"].includes(t));

  return {
    question: isQuestion,
    command: isCommand,
    negative: hasNegation,
    declarative: !isQuestion && !isCommand,
  };
}

/**
 * Detect tense from English sentence
 */
function detectTense(tokens) {
  const hasAuxiliaries = {
    present_progressive: tokens.some(t => ['am', 'is', 'are'].includes(t)) && tokens.some(t => t.endsWith('ing')),
    past_progressive: tokens.some(t => ['was', 'were'].includes(t)) && tokens.some(t => t.endsWith('ing')),
    future: tokens.some(t => ['will', 'shall'].includes(t)),
    past_simple: tokens.some(t => ['did', 'was', 'were'].includes(t)),
    past_participle: tokens.some(t => ['have', 'has', 'had'].includes(t)),
    present: true, // default
  };

  // Check for -ing verbs
  const hasIng = tokens.some(t => t.endsWith('ing') && t.length > 4);

  // Check for past tense (-ed)
  const hasEd = tokens.some(t => t.endsWith('ed') && t.length > 3);

  // Check for irregular past tense forms
  const hasIrregularPast = tokens.some(t => IRREGULAR_PAST_FORMS.has(t.toLowerCase()));

  if (hasAuxiliaries.present_progressive || hasIng) {
    return { tense: 'progressive', auxiliary: 'na', suffix: 'fe' };
  }
  if (hasAuxiliaries.future) {
    return { tense: 'future', auxiliary: 'fama' };
  }
  if (hasAuxiliaries.past_participle) {
    return { tense: 'perfective', auxiliary: 'bara' };
  }
  if (hasAuxiliaries.past_simple || hasEd || hasIrregularPast) {
    return { tense: 'past', auxiliary: 'bara', suffix: 'xi' };
  }

  return { tense: 'present', auxiliary: null };
}

// Irregular verb mappings - { form: { base, isPast } }
const IRREGULAR_PAST_FORMS = new Set([
  'ate', 'eaten', 'went', 'gone', 'came', 'saw', 'seen', 'gave', 'given',
  'took', 'taken', 'knew', 'known', 'said', 'heard', 'ran', 'left', 'slept',
  'woke', 'wrote', 'written', 'made', 'found', 'sat', 'stood', 'brought',
  'thought', 'understood', 'forgot', 'forgotten'
]);

// Irregular verb mappings
const IRREGULAR_VERBS = {
  // Past tense forms
  'ate': 'eat',
  'eaten': 'eat',
  'went': 'go',
  'gone': 'go',
  'came': 'come',
  'come': 'come',
  'saw': 'see',
  'seen': 'see',
  'gave': 'give',
  'given': 'give',
  'took': 'take',
  'taken': 'take',
  'knew': 'know',
  'known': 'know',
  'said': 'say',
  'heard': 'hear',
  'ran': 'run',
  'left': 'leave',
  'slept': 'sleep',
  'woke': 'wake',
  'wrote': 'write',
  'written': 'write',
  'read': 'read',
  'made': 'make',
  'found': 'find',
  'sat': 'sit',
  'stood': 'stand',
  'brought': 'bring',
  'thought': 'think',
  'understood': 'understand',
  'forgot': 'forget',
  'forgotten': 'forget',

  // Present 3rd person
  'comes': 'come',
  'goes': 'go',
  'eats': 'eat',
  'sees': 'see',
  'knows': 'know',
  'says': 'say',
  'gives': 'give',
  'takes': 'take',
  'makes': 'make',
  'works': 'work',
  'helps': 'help',
  'loves': 'love',
  'likes': 'like',
  'wants': 'want',
  'needs': 'need',
  'thinks': 'think',
  'hears': 'hear',
  'speaks': 'speak',
  'runs': 'run',
  'walks': 'walk',

  // -ing forms (for when base extraction fails)
  'coming': 'come',
  'going': 'go',
  'eating': 'eat',
  'seeing': 'see',
  'knowing': 'know',
  'giving': 'give',
  'taking': 'take',
  'making': 'make',
  'running': 'run',
  'writing': 'write',
  'sitting': 'sit',
  'standing': 'stand',
  'getting': 'get',
  'putting': 'put',
};

/**
 * Extract verb from English tokens (remove -ing, -ed, -s suffixes)
 */
function extractVerbBase(word) {
  let base = word.toLowerCase();

  // First check irregular verbs
  if (IRREGULAR_VERBS[base]) {
    return IRREGULAR_VERBS[base];
  }

  // Remove common suffixes
  if (base.endsWith('ing')) {
    base = base.slice(0, -3);
    // Handle doubling (running -> run, eating -> eat)
    if (base.length > 1 && base[base.length - 1] === base[base.length - 2]) {
      base = base.slice(0, -1);
    }
    // Handle "coming" -> "come" (add back 'e')
    if (VERBS[base + 'e']) {
      base = base + 'e';
    }
  } else if (base.endsWith('ed')) {
    base = base.slice(0, -2);
    if (base.endsWith('i')) {
      base = base.slice(0, -1) + 'y'; // carried -> carry
    }
  } else if (base.endsWith('es')) {
    base = base.slice(0, -2);
  } else if (base.endsWith('s') && !['is', 'was', 'has', 'does', 'goes'].includes(base)) {
    base = base.slice(0, -1);
  }

  return base;
}

/**
 * Parse English sentence into components
 */
function parseEnglish(sentence) {
  const tokens = tokenizeEnglish(sentence);
  const sentenceType = detectSentenceType(sentence, tokens);
  const tenseInfo = detectTense(tokens);

  const result = {
    original: sentence,
    tokens,
    sentenceType,
    tenseInfo,
    subject: null,
    verb: null,
    object: null,
    modifiers: [],
    questionWord: null,
    prepositions: [],
    unknownWords: [],
  };

  // Filter out auxiliary verbs and articles
  const auxVerbs = ['am', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'can', 'may', 'might', 'must', 'shall'];
  const articles = ['a', 'an', 'the'];
  const negations = ["n't", 'not', "don't", "doesn't", "didn't", "won't", "can't", "couldn't", "wouldn't", "shouldn't", "isn't", "aren't", "wasn't", "weren't", 'never'];
  const skip = [...auxVerbs, ...articles, 'to', ...negations];

  let foundSubject = false;
  let foundVerb = false;

  for (const token of tokens) {
    if (skip.includes(token)) continue;

    // Check for question words
    if (QUESTION_WORDS[token]) {
      result.questionWord = token;
      continue;
    }

    // Check for possessives (like "my", "your", etc.)
    if (POSSESSIVES[token]) {
      result.modifiers.push({ type: 'possessive', word: token });
      continue;
    }

    // Check for pronouns (subject)
    if (!foundSubject && PRONOUNS[token]) {
      result.subject = token;
      foundSubject = true;
      continue;
    }

    // Check for verb
    const verbBase = extractVerbBase(token);
    if (!foundVerb && VERBS[verbBase]) {
      result.verb = verbBase;
      foundVerb = true;
      continue;
    }

    // Check for nouns (likely object)
    if (NOUNS[token]) {
      if (!result.object) {
        result.object = token;
      } else {
        result.modifiers.push({ type: 'noun', word: token });
      }
      continue;
    }

    // Check for adjectives (some can act as verb complements like "tired")
    if (ADJECTIVES[token]) {
      // Check if this adjective is used as a predicate (e.g., "I am tired")
      if (!foundVerb && ['tired', 'hungry', 'thirsty', 'sick', 'happy', 'sad'].includes(token)) {
        // These adjectives indicate a state - treat as verb complement
        result.verb = 'be';  // implicit "be" verb
        result.modifiers.push({ type: 'predicate_adjective', word: token });
      } else {
        result.modifiers.push({ type: 'adjective', word: token });
      }
      continue;
    }

    // Check for prepositions
    if (PREPOSITIONS[token]) {
      result.prepositions.push(token);
      continue;
    }

    // Check for connectors
    if (CONNECTORS[token]) {
      result.modifiers.push({ type: 'connector', word: token });
      continue;
    }

    // Check for numbers
    if (NUMBERS[token]) {
      result.modifiers.push({ type: 'number', word: token });
      continue;
    }

    // Unknown word
    result.unknownWords.push(token);
  }

  return result;
}

// ============================================================================
// SUSU GENERATION
// ============================================================================

/**
 * Translate a single word to Susu
 */
function translateWord(word, context = {}) {
  const w = word.toLowerCase();

  // Check in order: pronouns, verbs, nouns, adjectives, etc.
  if (PRONOUNS[w]) return PRONOUNS[w];
  if (POSSESSIVES[w]) return POSSESSIVES[w];
  if (NOUNS[w]) return NOUNS[w];
  if (ADJECTIVES[w]) return ADJECTIVES[w];
  if (CONNECTORS[w]) return CONNECTORS[w];
  if (PREPOSITIONS[w]) return PREPOSITIONS[w];
  if (QUESTION_WORDS[w]) return QUESTION_WORDS[w];
  if (NUMBERS[w]) return NUMBERS[w];

  // Check verb with base extraction
  const verbBase = extractVerbBase(w);
  if (VERBS[verbBase]) {
    const verb = VERBS[verbBase];
    if (context.progressive) return verb.progressive || verb.base + 'fe';
    if (context.perfective) return verb.perfective || verb.base + 'xi';
    if (context.imperative) return verb.imperative || verb.base;
    return verb.base;
  }

  return null;
}

/**
 * Generate Susu sentence from parsed English
 */
function generateSusu(parsed) {
  const parts = [];
  const notes = [];
  let confidence = 100;

  const { sentenceType, tenseInfo, subject, verb, object, modifiers, questionWord, unknownWords } = parsed;

  // For commands, put verb first then location/object
  if (sentenceType.command) {
    // Handle verb first for commands
    if (verb) {
      const verbInfo = VERBS[verb];
      if (verbInfo) {
        parts.push(verbInfo.imperative || verbInfo.base);
      } else {
        parts.push(`[${verb}]`);
        confidence -= 20;
        notes.push(`Unknown verb: ${verb}`);
      }
    }

    // Then add object/location
    if (object) {
      const susuObject = NOUNS[object];
      if (susuObject) {
        parts.push(susuObject);
      } else {
        parts.push(`[${object}]`);
        confidence -= 15;
      }
    }

    // Add prepositions (like "here", "there")
    for (const prep of parsed.prepositions) {
      const susuPrep = PREPOSITIONS[prep];
      if (susuPrep) {
        parts.push(susuPrep);
      }
    }

    // Skip normal processing
    return {
      susu: parts.join(' '),
      confidence: Math.max(0, confidence),
      confidenceLevel: confidence >= 80 ? 'high' : confidence >= 50 ? 'medium' : 'low',
      notes,
      parsed,
    };
  }

  // 1. Handle Subject
  // Check if there's a possessive that matches the subject (e.g., "I love my mother")
  const possessive = modifiers.find(m => m.type === 'possessive');
  const possessiveMatchesSubject = possessive && (
    (subject === 'i' && possessive.word === 'my') ||
    (subject === 'you' && possessive.word === 'your') ||
    (subject === 'he' && possessive.word === 'his') ||
    (subject === 'she' && possessive.word === 'her') ||
    (subject === 'we' && possessive.word === 'our') ||
    (subject === 'they' && possessive.word === 'their')
  );

  if (subject) {
    const susuSubject = PRONOUNS[subject];
    if (susuSubject) {
      parts.push(susuSubject);
    } else {
      parts.push(`[${subject}]`);
      confidence -= 10;
      notes.push(`Unknown subject: ${subject}`);
    }
  }

  // 2. Handle Negation (mu before verb in Susu)
  if (sentenceType.negative) {
    parts.push('mu');
  }

  // 3. Handle possessives (my, your, his, etc.)
  // Only add possessive if it's different from subject context
  if (possessive && !possessiveMatchesSubject) {
    parts.push(POSSESSIVES[possessive.word]);
  } else if (possessive) {
    // Use "ma" for 1st person, "kha" for others when subject matches
    if (possessive.word === 'my') {
      parts.push('ma');  // Just "ma" since subject "N" is already there
    } else if (['your', 'his', 'her', 'its', 'their'].includes(possessive.word)) {
      parts.push('kha');
    } else if (possessive.word === 'our') {
      parts.push('ma');
    }
  }

  // 4. Handle Object (SOV: object before verb)
  if (object) {
    const susuObject = NOUNS[object];
    if (susuObject) {
      // Add adjectives before noun
      for (const mod of modifiers) {
        if (mod.type === 'adjective' && ADJECTIVES[mod.word]) {
          parts.push(ADJECTIVES[mod.word]);
        }
      }

      parts.push(susuObject);
    } else {
      // Check if it's an unknown noun from parse
      const translated = translateWord(object);
      if (translated) {
        parts.push(translated);
      } else {
        parts.push(`[${object}]`);
        confidence -= 15;
        notes.push(`Unknown object: ${object}`);
      }
    }
  }

  // 4b. Handle additional nouns from modifiers (like "rice" in "child eats rice")
  for (const mod of modifiers) {
    if (mod.type === 'noun' && NOUNS[mod.word]) {
      parts.push(NOUNS[mod.word]);
    }
  }

  // 4. Handle Tense markers and Verb
  if (verb) {
    const verbInfo = VERBS[verb];

    // Check for predicate adjectives (e.g., "I am tired" -> "N bara taganxi")
    const predicateAdj = modifiers.find(m => m.type === 'predicate_adjective');
    if (predicateAdj && verb === 'be') {
      // Special handling for state adjectives
      const adjWord = predicateAdj.word;
      // Use perfective "bara" for states like tired, hungry
      parts.push('bara');
      parts.push(ADJECTIVES[adjWord] + 'xi');
    } else if (verbInfo) {
      // Apply tense
      if (sentenceType.command) {
        parts.push(verbInfo.imperative || verbInfo.base);
      } else if (tenseInfo.tense === 'progressive') {
        parts.push('na');
        parts.push(verbInfo.progressive || verbInfo.base + 'fe');
      } else if (tenseInfo.tense === 'perfective' || tenseInfo.tense === 'past') {
        parts.push('bara');
        parts.push(verbInfo.perfective || verbInfo.base + 'xi');
      } else if (tenseInfo.tense === 'future') {
        parts.push('fama');
        parts.push(verbInfo.base);
      } else {
        // Present simple - just base verb
        parts.push(verbInfo.base);
      }
    } else if (verb !== 'be') {
      // Only add unknown marker if not a predicate adjective case
      parts.push(`[${verb}]`);
      confidence -= 20;
      notes.push(`Unknown verb: ${verb}`);
    }
  }

  // 5. Handle prepositions/postpositions (come after noun in Susu)
  for (const prep of parsed.prepositions) {
    const susuPrep = PREPOSITIONS[prep];
    if (susuPrep) {
      parts.push(susuPrep);
    }
  }

  // 6. Handle Question word (typically at end in Susu)
  if (questionWord) {
    const susuQ = QUESTION_WORDS[questionWord];
    if (susuQ) {
      parts.push(susuQ);
    }
  }

  // 7. Add remaining modifiers (connectors, etc.)
  for (const mod of modifiers) {
    if (mod.type === 'connector' && CONNECTORS[mod.word]) {
      parts.push(CONNECTORS[mod.word]);
    }
  }

  // Calculate confidence based on unknown words
  if (unknownWords.length > 0) {
    confidence -= unknownWords.length * 10;
    notes.push(`Unknown words: ${unknownWords.join(', ')}`);

    // Add unknown words in brackets
    for (const unk of unknownWords) {
      parts.push(`[${unk}]`);
    }
  }

  // Determine confidence level
  let confidenceLevel;
  if (confidence >= 80) {
    confidenceLevel = 'high';
  } else if (confidence >= 50) {
    confidenceLevel = 'medium';
  } else {
    confidenceLevel = 'low';
  }

  return {
    susu: parts.join(' '),
    confidence: Math.max(0, confidence),
    confidenceLevel,
    notes,
    parsed,
  };
}

// ============================================================================
// MAIN API
// ============================================================================

/**
 * Translate English to Susu with grammar rules applied
 * @param {string} english - English sentence
 * @returns {Object} Translation result with Susu, confidence, notes
 */
function translate(english) {
  if (!english || typeof english !== 'string') {
    return {
      susu: '',
      confidence: 0,
      confidenceLevel: 'low',
      error: 'Empty input',
    };
  }

  // Check for common greetings/phrases first
  const normalizedInput = english.toLowerCase().trim().replace(/[.!?]/g, '');
  if (GREETINGS[normalizedInput]) {
    return {
      english,
      susu: GREETINGS[normalizedInput],
      confidence: 100,
      confidenceLevel: 'high',
      notes: ['Common phrase - direct translation'],
      grammar: {
        sentenceType: { greeting: true },
        tense: 'present',
        wordOrder: 'fixed',
      },
    };
  }

  const parsed = parseEnglish(english);
  const result = generateSusu(parsed);

  return {
    english,
    susu: result.susu,
    confidence: result.confidence,
    confidenceLevel: result.confidenceLevel,
    notes: result.notes,
    grammar: {
      sentenceType: result.parsed.sentenceType,
      tense: result.parsed.tenseInfo.tense,
      wordOrder: 'SOV',
    },
  };
}

/**
 * Translate with multiple variations
 */
function translateWithVariations(english) {
  const base = translate(english);
  const variations = [];

  // Add emphatic form
  const parsed = parseEnglish(english);
  if (parsed.subject && PRONOUNS_EMPHATIC[parsed.subject]) {
    const emphatic = { ...base };
    emphatic.susu = emphatic.susu.replace(
      PRONOUNS[parsed.subject],
      PRONOUNS_EMPHATIC[parsed.subject]
    );
    emphatic.variation = 'emphatic';
    variations.push(emphatic);
  }

  return {
    primary: base,
    variations,
  };
}

/**
 * Get word translation only
 */
function translateWordOnly(word) {
  const translated = translateWord(word);
  if (translated) {
    return {
      english: word,
      susu: translated,
      found: true,
    };
  }
  return {
    english: word,
    susu: null,
    found: false,
  };
}

/**
 * Get verb conjugation table
 */
function getVerbConjugation(verb) {
  const verbInfo = VERBS[verb.toLowerCase()];
  if (!verbInfo) {
    return null;
  }

  return {
    english: verb,
    base: verbInfo.base,
    progressive: verbInfo.progressive || verbInfo.base + 'fe',
    perfective: verbInfo.perfective || verbInfo.base + 'xi',
    imperative: verbInfo.imperative || verbInfo.base,
    examples: {
      present: `N ${verbInfo.base}`,
      progressive: `N na ${verbInfo.progressive || verbInfo.base + 'fe'}`,
      past: `N bara ${verbInfo.perfective || verbInfo.base + 'xi'}`,
      negative: `N mu ${verbInfo.base}`,
      imperative: verbInfo.imperative || verbInfo.base,
    },
  };
}

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = {
  // Main API
  translate,
  translateWithVariations,
  translateWordOnly,
  getVerbConjugation,

  // Parsing utilities
  parseEnglish,
  tokenizeEnglish,
  detectSentenceType,
  detectTense,
  extractVerbBase,

  // Generation
  generateSusu,
  translateWord,

  // Dictionaries (for extension)
  PRONOUNS,
  PRONOUNS_EMPHATIC,
  POSSESSIVES,
  VERBS,
  NOUNS,
  ADJECTIVES,
  QUESTION_WORDS,
  PREPOSITIONS,
  CONNECTORS,
  NUMBERS,
  GREETINGS,
  IRREGULAR_VERBS,
  IRREGULAR_PAST_FORMS,
};

// ============================================================================
// CLI & TESTS
// ============================================================================

if (require.main === module) {
  console.log('=== GUINIUS - Susu Sentence Generator ===\n');

  // Test sentences with expected outputs (based on Google Translate patterns)
  const testCases = [
    // Basic SOV
    { en: 'I eat rice', expectedPattern: 'N malo don' },
    { en: 'I am eating rice', expectedPattern: 'N na malo donfe' },
    { en: 'I ate rice', expectedPattern: 'N bara malo donxi' },

    // Pronouns
    { en: 'You go', expectedPattern: 'I siga' },
    { en: 'He comes', expectedPattern: 'A fa' },
    { en: 'We work', expectedPattern: 'Won wali' },
    { en: 'They see', expectedPattern: 'E to' },

    // Progressive
    { en: 'I am going', expectedPattern: 'N na sigafe' },
    { en: 'He is coming', expectedPattern: 'A na fafe' },

    // Perfective/Past
    { en: 'I have eaten', expectedPattern: 'N bara donxi' },
    { en: 'She went', expectedPattern: 'A bara sigaxi' },
    { en: 'I am tired', expectedPattern: 'N bara taganxi' },

    // Negation
    { en: "I don't know", expectedPattern: 'N mu kolon' },
    { en: "I don't understand", expectedPattern: 'N mu faxamu' },
    { en: "He doesn't come", expectedPattern: 'A mu fa' },

    // Questions
    { en: 'Where are you going?', expectedPattern: 'I na sigafe minden' },
    { en: 'What do you want?', expectedPattern: 'I wama munse' },
    { en: 'Who is he?', expectedPattern: 'A nde' },

    // Commands
    { en: 'Come here', expectedPattern: 'Fa be' },
    { en: 'Go home', expectedPattern: 'Siga banxi' },
    { en: 'Eat', expectedPattern: 'Don' },

    // With nouns
    { en: 'I see the house', expectedPattern: 'N banxi to' },
    { en: 'The child eats rice', expectedPattern: 'di malo don' },
    { en: 'I love my mother', expectedPattern: 'N ma na xanu' },

    // Future
    { en: 'I will come', expectedPattern: 'N fama fa' },
    { en: 'He will go', expectedPattern: 'A fama siga' },
  ];

  console.log('--- Translation Tests ---\n');

  let passed = 0;
  let total = testCases.length;

  for (const test of testCases) {
    const result = translate(test.en);
    const match = result.susu.toLowerCase().includes(test.expectedPattern.toLowerCase().split(' ')[0]);

    console.log(`EN: "${test.en}"`);
    console.log(`SU: "${result.susu}"`);
    console.log(`Expected pattern: "${test.expectedPattern}"`);
    console.log(`Confidence: ${result.confidence}% (${result.confidenceLevel})`);
    if (result.notes.length > 0) {
      console.log(`Notes: ${result.notes.join('; ')}`);
    }
    console.log(`Grammar: ${JSON.stringify(result.grammar)}`);
    console.log('');

    if (match) passed++;
  }

  console.log(`\n--- Results: ${passed}/${total} tests contain expected key words ---\n`);

  // Test verb conjugations
  console.log('--- Verb Conjugation Table: "go" ---\n');
  const goConj = getVerbConjugation('go');
  console.log(JSON.stringify(goConj, null, 2));

  console.log('\n--- Verb Conjugation Table: "eat" ---\n');
  const eatConj = getVerbConjugation('eat');
  console.log(JSON.stringify(eatConj, null, 2));

  // Interactive examples
  console.log('\n--- Word Translations ---\n');
  const words = ['mother', 'father', 'child', 'house', 'water', 'good', 'big', 'go', 'come', 'eat'];
  for (const word of words) {
    const result = translateWordOnly(word);
    console.log(`${word} -> ${result.susu || '[not found]'}`);
  }

  console.log('\n--- Susu Grammar Rules Applied ---');
  console.log('1. Word Order: SOV (Subject-Object-Verb)');
  console.log('2. Progressive: N na VERB-fe (I am doing)');
  console.log('3. Perfective: N bara VERB-xi (I have done)');
  console.log('4. Negation: N mu VERB (I don\'t do)');
  console.log('5. Questions: Question word at END');
  console.log('6. Articles (the, a, an) are dropped');
}
