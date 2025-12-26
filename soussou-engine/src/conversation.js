/**
 * GUINIUS Conversation Module - Multi-turn Dialogue Handler for Susu
 *
 * Enables natural conversations in Susu with:
 * - Context tracking (history, user preferences, pronouns)
 * - Common dialogue patterns (Q&A, greetings, requests)
 * - Smart response generation
 * - Conversation templates for common scenarios
 *
 * Part of GUINIUS - Unified Susu AI Translation Engine
 * Target: Soussou AI v1 by Jan 01 2026
 */

const fs = require('fs');
const path = require('path');

// Import core modules
const susuAI = require('./susu_ai');
const { normalizeEither, detectOrthography } = require('./orthography_converter');
const { FIXED_EXPRESSIONS, PRONOUNS, normalize } = require('./sentence_parser');

// ============================================================================
// CONVERSATION STATE
// ============================================================================

/**
 * Conversation state object
 * @typedef {Object} ConversationState
 * @property {string} id - Unique conversation ID
 * @property {Object} user - User information (name, preferences)
 * @property {Array} history - Conversation history
 * @property {Object} entities - Tracked entities (people, places, things)
 * @property {string} currentTopic - Current conversation topic
 * @property {string} language - Primary language preference ('susu' | 'english' | 'mixed')
 * @property {string} formality - Formality level ('casual' | 'formal')
 * @property {number} startTime - Conversation start timestamp
 * @property {Object} flowState - Current dialogue flow state
 */

// Active conversations storage
const conversations = new Map();

// ============================================================================
// CONVERSATION TEMPLATES - Common Susu Dialogue Patterns
// ============================================================================

const CONVERSATION_TEMPLATES = {
  // Template: Introducing yourself
  introducing_yourself: {
    id: 'introducing_yourself',
    name: 'Introducing Yourself',
    description: 'Typical self-introduction conversation',
    steps: [
      {
        turn: 'user',
        trigger: ['what is your name', 'your name', 'who are you', 'ikhilidi', 'khili'],
        susu: 'I khili di?',
        english: 'What is your name?'
      },
      {
        turn: 'bot',
        response_susu: 'N khili {name}. I fan go?',
        response_english: 'My name is {name}. And you?'
      },
      {
        turn: 'user',
        trigger: ['my name is', 'i am', 'n khili', 'ntan'],
        susu: 'N khili {name}.',
        english: 'My name is {name}.'
      },
      {
        turn: 'bot',
        response_susu: 'I tana, {name}! Won na temou.',
        response_english: 'Nice to meet you, {name}! See you later.'
      }
    ],
    variables: ['name']
  },

  // Template: Asking for directions
  asking_directions: {
    id: 'asking_directions',
    name: 'Asking for Directions',
    description: 'Getting directions to a location',
    steps: [
      {
        turn: 'user',
        trigger: ['where is', 'how do i get to', 'kira minde', 'na minde'],
        susu: '{place} gui kira minde?',
        english: 'Where is the road to {place}?'
      },
      {
        turn: 'bot',
        response_susu: 'Siga tout droit, {distance}. A {direction} apres.',
        response_english: 'Go straight, {distance}. Then {direction}.'
      },
      {
        turn: 'user',
        trigger: ['far', 'how far', 'loin', 'a loin'],
        susu: 'A loin gbo?',
        english: 'Is it very far?'
      },
      {
        turn: 'bot',
        response_susu: "M'ma loin. {time} tan.",
        response_english: 'Not far. Just {time}.'
      },
      {
        turn: 'user',
        trigger: ['thank', 'thanks', 'balake', 'wonou wali'],
        susu: 'I balake gbo!',
        english: 'Thank you very much!'
      },
      {
        turn: 'bot',
        response_susu: 'Probleme m\'ma. Bon voyage!',
        response_english: "No problem. Safe travels!"
      }
    ],
    variables: ['place', 'distance', 'direction', 'time']
  },

  // Template: Ordering food
  ordering_food: {
    id: 'ordering_food',
    name: 'Ordering Food',
    description: 'Conversation at a restaurant or food vendor',
    steps: [
      {
        turn: 'user',
        trigger: ['menu', 'what do you have', 'i wama', 'donse'],
        susu: 'Wo be mounse?',
        english: 'What do you have?'
      },
      {
        turn: 'bot',
        response_susu: 'Won be {food1}, {food2}, {food3}. I wama mounse?',
        response_english: 'We have {food1}, {food2}, {food3}. What would you like?'
      },
      {
        turn: 'user',
        trigger: ['i want', 'give me', 'n wama', 'fi n ma'],
        susu: '{food} fi n ma.',
        english: 'Give me {food}.'
      },
      {
        turn: 'bot',
        response_susu: 'Awa. Ye anama {drink}?',
        response_english: 'Okay. Water or {drink}?'
      },
      {
        turn: 'user',
        trigger: ['water', 'ye', 'drink'],
        susu: 'Ye tan.',
        english: 'Just water.'
      },
      {
        turn: 'bot',
        response_susu: 'Awa. {price} tan.',
        response_english: 'Okay. Just {price}.'
      }
    ],
    variables: ['food1', 'food2', 'food3', 'food', 'drink', 'price']
  },

  // Template: Shopping dialogue
  shopping: {
    id: 'shopping',
    name: 'Shopping at Market',
    description: 'Market shopping and price negotiation',
    steps: [
      {
        turn: 'user',
        trigger: ['how much', 'price', 'songo yiri', 'sare'],
        susu: '{item} gui songo yiri?',
        english: 'How much is this {item}?'
      },
      {
        turn: 'bot',
        response_susu: '{price} tan. Frais gbo!',
        response_english: 'Just {price}. Very fresh!'
      },
      {
        turn: 'user',
        trigger: ['expensive', 'cheri', 'too much', 'xoroxo'],
        susu: 'Cheri gbo! {lower_price}?',
        english: 'Too expensive! {lower_price}?'
      },
      {
        turn: 'bot',
        response_susu: '{final_price}, derniere prix.',
        response_english: '{final_price}, final price.'
      },
      {
        turn: 'user',
        trigger: ['okay', 'i will buy', 'awa', 'n sa rasa'],
        susu: "Awa, n'sa {quantity} rasa.",
        english: "Okay, I'll buy {quantity}."
      },
      {
        turn: 'bot',
        response_susu: 'I balake! Bon journee!',
        response_english: 'Thank you! Good day!'
      }
    ],
    variables: ['item', 'price', 'lower_price', 'final_price', 'quantity']
  },

  // Template: Meeting someone new
  meeting_someone: {
    id: 'meeting_someone',
    name: 'Meeting Someone New',
    description: 'First meeting with greetings and introductions',
    steps: [
      {
        turn: 'user',
        trigger: ['hello', 'hi', 'good morning', 'i kena', 'tanamoufegne'],
        susu: 'I kena! Tana mu a ra?',
        english: 'Hello! How are you?'
      },
      {
        turn: 'bot',
        response_susu: 'Tanante, Ala xa baraka! I fan?',
        response_english: 'Fine, God bless! And you?'
      },
      {
        turn: 'user',
        trigger: ['fine', 'good', 'tana', 'lafia'],
        susu: 'Ntan lafia. I denbaya lafia?',
        english: "I'm well. Is your family well?"
      },
      {
        turn: 'bot',
        response_susu: 'Etan birin lafia, Ala xa baraka!',
        response_english: "They're all well, God bless!"
      },
      {
        turn: 'user',
        trigger: ['name', 'who', 'khili'],
        susu: 'I khili di?',
        english: 'What is your name?'
      },
      {
        turn: 'bot',
        response_susu: "N khili {name}. N kelixi {place}.",
        response_english: "My name is {name}. I'm from {place}."
      }
    ],
    variables: ['name', 'place']
  },

  // Template: Greeting sequence
  greeting_exchange: {
    id: 'greeting_exchange',
    name: 'Standard Greeting Exchange',
    description: 'Typical greeting sequence with wellness inquiries',
    steps: [
      {
        turn: 'user',
        trigger: ['hello', 'good morning', 'i kena', 'tanamoufegne', 'wo kena'],
        susu: 'I kena! Tana mu a ra?',
        english: 'Good morning! How are you?'
      },
      {
        turn: 'bot',
        response_susu: 'Tanante, Ala xa baraka! I fan?',
        response_english: 'Fine, God bless! And you?'
      },
      {
        turn: 'user',
        trigger: ['fine', 'good', 'lafia', 'tana'],
        susu: 'Ntan lafia.',
        english: "I'm well."
      },
      {
        turn: 'bot',
        response_susu: 'Ala xa baraka! I denbaya lafia?',
        response_english: 'God bless! Is your family well?'
      }
    ],
    variables: []
  }
};

// ============================================================================
// COMMON DIALOGUE PATTERNS
// ============================================================================

const DIALOGUE_PATTERNS = {
  // Question-Answer pairs
  question_answer: {
    patterns: [
      {
        question_triggers: ['ina minde', 'where are you'],
        question_susu: 'I na minde?',
        question_english: 'Where are you?',
        answer_susu: "N'na {location}. N'na fafe.",
        answer_english: "I'm at {location}. I'm coming.",
        variables: ['location']
      },
      {
        question_triggers: ['wakhati yiri', 'what time'],
        question_susu: 'Wakhati yiri?',
        question_english: 'What time is it?',
        answer_susu: 'Wakhati {time}.',
        answer_english: "It's {time}.",
        variables: ['time']
      },
      {
        question_triggers: ['i lafia', 'are you well', 'how are you'],
        question_susu: 'I lafia?',
        question_english: 'Are you well?',
        answer_susu: 'Awa, n lafia. Ala xa baraka!',
        answer_english: 'Yes, I am well. God bless!'
      },
      {
        question_triggers: ['songo yiri', 'how much'],
        question_susu: 'A songo yiri?',
        question_english: 'How much is it?',
        answer_susu: '{price} tan.',
        answer_english: 'Just {price}.',
        variables: ['price']
      },
      {
        question_triggers: ['khafe', 'why'],
        question_susu: 'Khafe mu ra?',
        question_english: 'Why?',
        answer_susu: '{reason}.',
        answer_english: '{reason}.',
        variables: ['reason']
      },
      {
        question_triggers: ['yiri tan', 'how many'],
        question_susu: 'Yiri tan?',
        question_english: 'How many?',
        answer_susu: '{number} tan.',
        answer_english: 'Just {number}.',
        variables: ['number']
      }
    ]
  },

  // Greeting-Response sequences
  greeting_response: {
    patterns: [
      {
        greeting_susu: 'I kena!',
        greeting_english: 'Good morning!',
        response_susu: 'I kena! Tana?',
        response_english: 'Good morning! How are you?'
      },
      {
        greeting_susu: 'I suba!',
        greeting_english: 'Good evening!',
        response_susu: 'I suba! Kisi yire?',
        response_english: 'Good evening! How was the day?'
      },
      {
        greeting_susu: 'Tanamoufegne?',
        greeting_english: 'How are you?',
        response_susu: 'Tanante. Ala xa baraka!',
        response_english: 'Fine. God bless!'
      },
      {
        greeting_susu: 'Wo kena!',
        greeting_english: 'Good morning! (plural/formal)',
        response_susu: 'Wo kena! Wo birin lafia?',
        response_english: 'Good morning! Are you all well?'
      },
      {
        greeting_susu: 'Ala xa baraka!',
        greeting_english: 'God bless!',
        response_susu: 'Amin!',
        response_english: 'Amen!'
      }
    ]
  },

  // Request-Confirmation flows
  request_confirmation: {
    patterns: [
      {
        request_triggers: ['fi n ma', 'give me'],
        request_susu: '{item} fi n ma.',
        request_english: 'Give me {item}.',
        confirm_susu: 'Awa, be a!',
        confirm_english: 'Okay, here it is!',
        variables: ['item']
      },
      {
        request_triggers: ['fa be', 'come here'],
        request_susu: 'Fa be!',
        request_english: 'Come here!',
        confirm_susu: "N'na fafe!",
        confirm_english: "I'm coming!"
      },
      {
        request_triggers: ['mmeme', 'wait'],
        request_susu: 'Mmeme!',
        request_english: 'Wait!',
        confirm_susu: "Awa, n'na mmeme.",
        confirm_english: "Okay, I'll wait."
      },
      {
        request_triggers: ['n mali', 'help me'],
        request_susu: 'N mali de!',
        request_english: 'Help me!',
        confirm_susu: "Awa, n'na i mali.",
        confirm_english: "Okay, I'll help you."
      }
    ]
  },

  // Polite exchanges
  polite_exchanges: {
    patterns: [
      {
        trigger: ['thank', 'thanks', 'balake', 'wonou wali'],
        input_susu: 'I balake!',
        input_english: 'Thank you!',
        response_susu: "Probleme m'ma.",
        response_english: 'No problem.'
      },
      {
        trigger: ['sorry', 'pardon', 'diye'],
        input_susu: 'Pardon!',
        input_english: 'Sorry!',
        response_susu: "A m'ma feen. Probleme m'ma.",
        response_english: "It's nothing. No problem."
      },
      {
        trigger: ['excuse', 'excuse me'],
        input_susu: 'Digne n ma!',
        input_english: 'Excuse me!',
        response_susu: 'Awa?',
        response_english: 'Yes?'
      },
      {
        trigger: ['please', 'nbari khandi'],
        input_susu: 'N bari khandi...',
        input_english: 'Please...',
        response_susu: 'Awa, fala!',
        response_english: 'Okay, speak!'
      },
      {
        trigger: ['goodbye', 'bye', 'wo na temou'],
        input_susu: 'Won na temou!',
        input_english: 'See you!',
        response_susu: 'Ala xa won kisi! A demain!',
        response_english: 'May God protect us! See you tomorrow!'
      }
    ]
  }
};

// ============================================================================
// COMMON SUSU PHRASES FROM PHRASEBOOKS
// ============================================================================

const COMMON_PHRASES = {
  greetings: {
    'good morning': { susu: 'I kena!', response: 'I kena! Tana?' },
    'good afternoon': { susu: 'Wo fegne!', response: 'Wo fegne! Tana?' },
    'good evening': { susu: 'I suba!', response: 'I suba! Kisi yire?' },
    'good night': { susu: 'Allah kha wo khi!', response: 'Amin! Kouwè bon!' },
    'how are you': { susu: 'Tanamoufegne?', response: 'Tanante. I fan?' },
    'how is your family': { susu: 'I denbaya lafia?', response: 'Etan birin lafia, Ala xa baraka!' }
  },
  farewells: {
    'goodbye': { susu: 'Won na temou!', response: 'Won na temou!' },
    'see you tomorrow': { susu: 'Won tina!', response: 'Awa, won tina!' },
    'see you later': { susu: "Won narala'ma", response: 'Ala xa won kisi!' },
    'take care': { susu: 'I yema sokhoui afanyira!', response: 'I fan!' },
    'safe travels': { susu: 'Ala xa i kisi!', response: 'Amin!' }
  },
  essentials: {
    'yes': { susu: 'Awa', alternative: 'Iyo' },
    'no': { susu: 'Ade', alternative: "M'ma" },
    'please': { susu: 'N bari khandi' },
    'thank you': { susu: 'Wonou wali', alternative: 'I balake!' },
    'excuse me': { susu: 'Digne n ma!' },
    'sorry': { susu: 'Pardon!', alternative: 'N bara nimisa' },
    "i don't understand": { susu: "M'ma fakhamou" },
    "i don't know": { susu: "M'ma kolon" },
    'repeat please': { susu: 'Gbelin a ma!' },
    'speak slowly': { susu: 'Fala dondoroti!' }
  },
  questions: {
    'what is your name': { susu: 'I khili di?', response: 'N khili...' },
    'where are you from': { susu: 'I kelixi minde?', response: 'N kelixi...' },
    'where are you': { susu: 'I na minde?', response: "N'na..." },
    'where is': { susu: '...na minde?', note: 'Place + na minde?' },
    'how much': { susu: 'A songo yiri?', response: '...tan' },
    'what time': { susu: 'Wakhati yiri?', response: 'Wakhati...' },
    'why': { susu: 'Khafe mu ra?', alternative: 'Mounse ra?' }
  },
  responses: {
    "i'm fine": { susu: 'N lafia.', alternative: 'Tanante.' },
    "i'm coming": { susu: "N'na fafe." },
    "i'm going": { susu: "N'na sigafe." },
    'i understand': { susu: 'N bara a fakhamou.' },
    'okay': { susu: 'Awa.', alternative: 'Tin.' },
    'no problem': { susu: "Probleme m'ma.", alternative: 'Kontofili yo.' },
    'i love you': { susu: 'I rafan ma.' },
    'god bless': { susu: 'Ala xa baraka!', response: 'Amin!' }
  },
  emergencies: {
    'help': { susu: 'N mali de!', urgent: true },
    'stop': { susu: 'Ti!', urgent: true },
    'come quickly': { susu: 'Fa be vite!', urgent: true },
    "i'm sick": { susu: 'N furaxi.', related: 'hospital' },
    'hospital': { susu: 'Hopital minde?', question: true },
    'police': { susu: 'Police minde?', question: true }
  }
};

// ============================================================================
// PRONOUN RESOLUTION
// ============================================================================

/**
 * Pronoun reference tracker
 */
const PRONOUN_REFERENCES = {
  // Susu pronouns and what they can reference
  'a': { type: '3s', gender: 'neutral', english: 'he/she/it' },
  'atan': { type: '3s', gender: 'neutral', english: 'he/she' },
  'e': { type: '3p', gender: 'neutral', english: 'they' },
  'etan': { type: '3p', gender: 'neutral', english: 'they' },
  'gui': { type: 'demonstrative', english: 'this/that' },
  'na': { type: 'locative', english: 'there/that' }
};

/**
 * Resolve pronoun to its referent in context
 * @param {string} pronoun - The pronoun to resolve
 * @param {Object} context - Conversation context with entities
 * @returns {Object|null} The resolved entity or null
 */
function resolvePronoun(pronoun, context) {
  const normalizedPronoun = normalize(pronoun);
  const pronounInfo = PRONOUN_REFERENCES[normalizedPronoun] || PRONOUNS[normalizedPronoun];

  if (!pronounInfo || !context.entities) return null;

  const entities = context.entities;

  // For 3rd person singular, look for the most recently mentioned person/thing
  if (pronounInfo.type === '3s' || pronounInfo.person === '3s') {
    const candidates = [
      ...Object.values(entities.people || {}),
      ...Object.values(entities.things || {})
    ].sort((a, b) => (b.lastMentioned || 0) - (a.lastMentioned || 0));

    if (candidates.length > 0) {
      return candidates[0];
    }
  }

  // For 3rd person plural
  if (pronounInfo.type === '3p' || pronounInfo.person === '3p') {
    const groups = entities.groups || {};
    const recentGroup = Object.values(groups)
      .sort((a, b) => (b.lastMentioned || 0) - (a.lastMentioned || 0))[0];

    if (recentGroup) return recentGroup;

    // Fall back to "family" if mentioned
    if (entities.people && Object.keys(entities.people).length > 1) {
      return { name: 'denbaya', english: 'family', members: Object.values(entities.people) };
    }
  }

  return null;
}

// ============================================================================
// RESPONSE GENERATION
// ============================================================================

/**
 * "I don't understand" responses in Susu
 */
const FALLBACK_RESPONSES = {
  dont_understand: [
    { susu: "M'ma fakhamou. Gbelin a ma!", english: "I don't understand. Please repeat!" },
    { susu: "Pardon, fala dondoroti.", english: "Sorry, speak slowly." },
    { susu: "M'ma kolon gui.", english: "I don't know that." },
    { susu: "I noma a fala kerenfodi?", english: "Can you say it another way?" }
  ],
  ask_clarification: [
    { susu: "I wama mounse fala?", english: "What do you want to say?" },
    { susu: "N bari fala.", english: "Please explain." },
    { susu: "Gui yabafe di?", english: "What does that mean?" }
  ],
  correction_suggestions: [
    { susu: "Eske i wama fala: '{suggestion}'?", english: "Did you mean: '{suggestion}'?" },
    { susu: "Tenten gui: '{suggestion}'", english: "Perhaps this: '{suggestion}'" }
  ]
};

/**
 * Generate appropriate response based on input type and context
 * @param {string} inputType - Type of input detected
 * @param {Object} context - Conversation context
 * @param {Object} options - Additional options
 * @returns {Object} Response object
 */
function generateResponse(inputType, context, options = {}) {
  const { formality = 'casual', language = 'mixed' } = options;

  // Check dialogue patterns first
  for (const category of Object.values(DIALOGUE_PATTERNS)) {
    for (const pattern of category.patterns) {
      const triggers = pattern.question_triggers || pattern.greeting_triggers ||
                       pattern.request_triggers || pattern.trigger || [];

      if (triggers.some(t => inputType.toLowerCase().includes(t.toLowerCase()))) {
        return {
          susu: pattern.response_susu || pattern.answer_susu || pattern.confirm_susu,
          english: pattern.response_english || pattern.answer_english || pattern.confirm_english,
          source: 'dialogue_pattern',
          confidence: 0.9
        };
      }
    }
  }

  // Check common phrases
  for (const category of Object.values(COMMON_PHRASES)) {
    for (const [key, value] of Object.entries(category)) {
      if (inputType.toLowerCase().includes(key)) {
        return {
          susu: value.response || value.susu,
          english: key,
          source: 'common_phrase',
          confidence: 0.85
        };
      }
    }
  }

  // Default fallback
  return {
    susu: "Awa, n bara a meme.",
    english: "Okay, I heard.",
    source: 'default',
    confidence: 0.5
  };
}

/**
 * Generate "I don't understand" response gracefully
 * @param {Object} context - Conversation context
 * @returns {Object} Response object
 */
function generateFallbackResponse(context = {}) {
  const responses = FALLBACK_RESPONSES.dont_understand;
  const idx = Math.floor(Math.random() * responses.length);
  return {
    ...responses[idx],
    source: 'fallback',
    confidence: 1.0
  };
}

/**
 * Suggest corrections for malformed input
 * @param {string} input - The malformed input
 * @param {Object} context - Conversation context
 * @returns {Array} Array of suggestions
 */
function suggestCorrections(input, context = {}) {
  const suggestions = [];
  const normalizedInput = normalizeEither(input).toLowerCase();

  // Check against common phrases for similar matches
  for (const category of Object.values(COMMON_PHRASES)) {
    for (const [english, data] of Object.entries(category)) {
      const susu = data.susu.toLowerCase();

      // Simple edit distance check (very basic)
      if (similarityScore(normalizedInput, susu) > 0.5 ||
          similarityScore(normalizedInput, english) > 0.5) {
        suggestions.push({
          original: input,
          suggested_susu: data.susu,
          suggested_english: english,
          confidence: similarityScore(normalizedInput, susu)
        });
      }
    }
  }

  // Sort by confidence
  suggestions.sort((a, b) => b.confidence - a.confidence);

  return suggestions.slice(0, 3);
}

/**
 * Calculate simple similarity score between two strings
 */
function similarityScore(str1, str2) {
  const words1 = str1.split(/\s+/);
  const words2 = str2.split(/\s+/);

  let matches = 0;
  for (const word of words1) {
    if (words2.includes(word)) matches++;
  }

  return matches / Math.max(words1.length, words2.length);
}

// ============================================================================
// MAIN CONVERSATION FUNCTIONS
// ============================================================================

/**
 * Start a new conversation
 * @param {Object} options - Conversation options
 * @returns {Object} Conversation state
 */
function startConversation(options = {}) {
  const id = options.id || `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  const state = {
    id,
    user: {
      name: options.userName || null,
      language: options.language || 'mixed',
      preferences: options.preferences || {}
    },
    history: [],
    entities: {
      people: {},
      places: {},
      things: {},
      groups: {}
    },
    currentTopic: null,
    language: options.language || 'mixed',
    formality: options.formality || 'casual',
    startTime: Date.now(),
    flowState: {
      currentFlow: null,
      currentStep: 0,
      variables: {}
    },
    turnCount: 0
  };

  conversations.set(id, state);

  return {
    id,
    message: "Conversation started",
    greeting: {
      susu: "I kena! N kelixi GUINIUS. N noma i mali Susu xaran fe.",
      english: "Hello! I am GUINIUS. I can help you learn Susu."
    }
  };
}

/**
 * Process user input and generate response
 * @param {string} text - User input text
 * @param {string} conversationId - Conversation ID (optional)
 * @returns {Object} Response with translation and context
 */
async function processInput(text, conversationId = null) {
  // Get or create conversation
  let context;
  if (conversationId && conversations.has(conversationId)) {
    context = conversations.get(conversationId);
  } else {
    const newConv = startConversation();
    context = conversations.get(newConv.id);
    conversationId = newConv.id;
  }

  const normalizedInput = text.trim();
  const inputLower = normalizedInput.toLowerCase();

  // Detect language of input
  const detectedLang = detectInputLanguage(normalizedInput);

  // Update turn count
  context.turnCount++;

  // Extract entities from input
  extractEntities(normalizedInput, context);

  // Check for fixed expressions first
  for (const [expr, info] of Object.entries(FIXED_EXPRESSIONS)) {
    if (normalizedInput.toLowerCase().includes(normalize(expr))) {
      const response = generateResponse(expr, context);

      // Add to history
      context.history.push({
        turn: context.turnCount,
        input: normalizedInput,
        inputLang: detectedLang,
        response: response,
        timestamp: Date.now()
      });

      return {
        conversationId,
        input: normalizedInput,
        translation: info.translation,
        response: response,
        context: getContext(conversationId),
        source: 'fixed_expression'
      };
    }
  }

  // Check dialogue patterns
  const patternMatch = matchDialoguePattern(normalizedInput, context);
  if (patternMatch) {
    context.history.push({
      turn: context.turnCount,
      input: normalizedInput,
      inputLang: detectedLang,
      response: patternMatch.response,
      patternMatched: patternMatch.pattern,
      timestamp: Date.now()
    });

    return {
      conversationId,
      input: normalizedInput,
      translation: patternMatch.translation,
      response: patternMatch.response,
      context: getContext(conversationId),
      source: 'dialogue_pattern',
      nextExpected: patternMatch.nextExpected
    };
  }

  // Try translation with susuAI
  let translation = null;
  try {
    translation = await susuAI.translate(normalizedInput, { detailed: true });
  } catch (e) {
    // Translation failed, continue with pattern matching
  }

  // Generate contextual response
  const response = generateResponse(normalizedInput, context, {
    formality: context.formality,
    language: context.language
  });

  // Check if we understood
  const understood = translation?.confidence > 0.5 || response.confidence > 0.6;

  if (!understood) {
    // Provide fallback with suggestions
    const fallback = generateFallbackResponse(context);
    const suggestions = suggestCorrections(normalizedInput, context);

    context.history.push({
      turn: context.turnCount,
      input: normalizedInput,
      inputLang: detectedLang,
      understood: false,
      suggestions: suggestions,
      timestamp: Date.now()
    });

    return {
      conversationId,
      input: normalizedInput,
      understood: false,
      response: fallback,
      suggestions: suggestions,
      context: getContext(conversationId),
      source: 'fallback'
    };
  }

  // Add to history
  context.history.push({
    turn: context.turnCount,
    input: normalizedInput,
    inputLang: detectedLang,
    translation: translation,
    response: response,
    timestamp: Date.now()
  });

  return {
    conversationId,
    input: normalizedInput,
    translation: translation?.translation || null,
    response: response,
    confidence: translation?.confidence || response.confidence,
    context: getContext(conversationId),
    source: translation?.source || response.source
  };
}

/**
 * Match input against dialogue patterns
 */
function matchDialoguePattern(input, context) {
  const inputLower = input.toLowerCase();

  // Check greeting patterns
  for (const pattern of DIALOGUE_PATTERNS.greeting_response.patterns) {
    if (inputLower.includes(normalize(pattern.greeting_susu)) ||
        inputLower.includes(pattern.greeting_english.toLowerCase())) {
      return {
        pattern: 'greeting_response',
        translation: pattern.greeting_english,
        response: {
          susu: pattern.response_susu,
          english: pattern.response_english,
          confidence: 0.95
        },
        nextExpected: 'wellness_inquiry'
      };
    }
  }

  // Check polite exchanges
  for (const pattern of DIALOGUE_PATTERNS.polite_exchanges.patterns) {
    const triggers = pattern.trigger || [];
    if (triggers.some(t => inputLower.includes(t.toLowerCase()))) {
      return {
        pattern: 'polite_exchange',
        translation: pattern.input_english,
        response: {
          susu: pattern.response_susu,
          english: pattern.response_english,
          confidence: 0.9
        }
      };
    }
  }

  // Check question-answer patterns
  for (const pattern of DIALOGUE_PATTERNS.question_answer.patterns) {
    if (pattern.question_triggers.some(t => inputLower.includes(t.toLowerCase()))) {
      return {
        pattern: 'question_answer',
        translation: pattern.question_english,
        response: {
          susu: pattern.answer_susu,
          english: pattern.answer_english,
          confidence: 0.85,
          variables: pattern.variables || []
        }
      };
    }
  }

  // Check request-confirmation patterns
  for (const pattern of DIALOGUE_PATTERNS.request_confirmation.patterns) {
    if (pattern.request_triggers.some(t => inputLower.includes(t.toLowerCase()))) {
      return {
        pattern: 'request_confirmation',
        translation: pattern.request_english,
        response: {
          susu: pattern.confirm_susu,
          english: pattern.confirm_english,
          confidence: 0.9
        }
      };
    }
  }

  return null;
}

/**
 * Detect language of input
 */
function detectInputLanguage(text) {
  // Check for Susu-specific characters and patterns
  if (/[ɔɛɲŋ]/.test(text)) return 'susu';
  if (/\b(ntan|itan|atan|naxa|bara|minde|yiri)\b/i.test(text)) return 'susu';
  if (/\b(lafia|tana|baraka|denbaya|fafe)\b/i.test(text)) return 'susu';

  // Check for common English patterns
  if (/\b(the|is|are|what|where|how|you|me|my)\b/i.test(text)) return 'english';

  return 'unknown';
}

/**
 * Extract entities (names, places, things) from input
 */
function extractEntities(text, context) {
  const now = Date.now();

  // Simple name detection after "N khili" or "my name is"
  const nameMatch = text.match(/(?:n khili|my name is)\s+(\w+)/i);
  if (nameMatch) {
    const name = nameMatch[1];
    if (!context.entities.people[name]) {
      context.entities.people[name] = { name, type: 'person', lastMentioned: now };
    } else {
      context.entities.people[name].lastMentioned = now;
    }

    // If this is the user's name, save it
    if (!context.user.name) {
      context.user.name = name;
    }
  }

  // Place detection
  const placePatterns = [
    /(?:siga|sigafe|kelixi|na)\s+(?:ne\s+)?(\w+)/i,
    /(\w+)\s+(?:gui\s+)?(?:kira\s+)?minde/i
  ];

  for (const pattern of placePatterns) {
    const match = text.match(pattern);
    if (match) {
      const place = match[1];
      if (!['ne', 'gui', 'kira', 'na', 'tan'].includes(place.toLowerCase())) {
        context.entities.places[place] = { name: place, type: 'place', lastMentioned: now };
      }
    }
  }

  // Family member detection
  const familyTerms = {
    'baba': 'father', 'ba': 'father',
    'nga': 'mother', 'mama': 'mother',
    'xunya': 'sibling', 'tara': 'older sibling', 'khoundja': 'younger sibling',
    'denbaya': 'family'
  };

  for (const [susu, english] of Object.entries(familyTerms)) {
    if (text.toLowerCase().includes(susu)) {
      const key = `family_${english}`;
      context.entities.people[key] = {
        name: susu,
        english: english,
        type: 'family',
        lastMentioned: now
      };
    }
  }
}

/**
 * Get current conversation context
 * @param {string} conversationId - Conversation ID
 * @returns {Object} Context object
 */
function getContext(conversationId) {
  const context = conversations.get(conversationId);
  if (!context) return null;

  return {
    id: context.id,
    user: context.user,
    currentTopic: context.currentTopic,
    language: context.language,
    formality: context.formality,
    turnCount: context.turnCount,
    entities: {
      people: Object.keys(context.entities.people),
      places: Object.keys(context.entities.places)
    },
    recentHistory: context.history.slice(-5).map(h => ({
      turn: h.turn,
      input: h.input,
      response: h.response?.susu || h.response
    })),
    flowState: context.flowState
  };
}

/**
 * Suggest what to say next based on context
 * @param {string|Object} context - Conversation ID or context object
 * @returns {Object} Suggested responses
 */
function suggestResponse(context) {
  let state;
  if (typeof context === 'string') {
    state = conversations.get(context);
  } else if (context.id) {
    state = conversations.get(context.id);
  } else {
    state = context;
  }

  if (!state) {
    // Default suggestions for new conversation
    return {
      suggestions: [
        { susu: 'I kena! Tana mu a ra?', english: 'Good morning! How are you?' },
        { susu: 'Tanamoufegne?', english: 'How are you?' },
        { susu: 'I khili di?', english: 'What is your name?' }
      ],
      category: 'greeting'
    };
  }

  const lastExchange = state.history[state.history.length - 1];

  // Based on last interaction, suggest next steps
  if (!lastExchange) {
    return {
      suggestions: [
        { susu: 'I kena!', english: 'Good morning!' },
        { susu: 'Tanamoufegne?', english: 'How are you?' }
      ],
      category: 'greeting'
    };
  }

  // If last was a greeting, suggest follow-up
  if (lastExchange.input?.toLowerCase().includes('kena') ||
      lastExchange.input?.toLowerCase().includes('tana')) {
    return {
      suggestions: [
        { susu: 'I denbaya lafia?', english: 'Is your family well?' },
        { susu: 'I baba lafia?', english: 'Is your father well?' },
        { susu: 'Wali di?', english: 'How is work?' }
      ],
      category: 'wellness_inquiry'
    };
  }

  // If last was a question, suggest answers
  if (lastExchange.input?.includes('?') || lastExchange.input?.includes('yiri')) {
    return {
      suggestions: [
        { susu: 'Awa.', english: 'Yes.' },
        { susu: 'Ade.', english: 'No.' },
        { susu: "M'ma kolon.", english: "I don't know." }
      ],
      category: 'answer'
    };
  }

  // Default suggestions
  return {
    suggestions: [
      { susu: 'Awa, n bara a meme.', english: 'Okay, I heard.' },
      { susu: 'N bara a fakhamou.', english: 'I understand.' },
      { susu: 'I balake!', english: 'Thank you!' }
    ],
    category: 'acknowledgment'
  };
}

/**
 * End conversation and cleanup
 * @param {string} conversationId - Conversation ID
 * @returns {Object} Summary of conversation
 */
function endConversation(conversationId) {
  const context = conversations.get(conversationId);
  if (!context) return null;

  const summary = {
    id: conversationId,
    duration: Date.now() - context.startTime,
    turnCount: context.turnCount,
    user: context.user,
    entities: {
      people: Object.keys(context.entities.people),
      places: Object.keys(context.entities.places)
    }
  };

  conversations.delete(conversationId);

  return {
    summary,
    farewell: {
      susu: 'Ala xa won kisi! Won na temou!',
      english: 'May God protect us! See you!'
    }
  };
}

/**
 * Get a conversation template by ID
 * @param {string} templateId - Template ID
 * @returns {Object|null} Template object
 */
function getTemplate(templateId) {
  return CONVERSATION_TEMPLATES[templateId] || null;
}

/**
 * List all available templates
 * @returns {Array} List of template summaries
 */
function listTemplates() {
  return Object.entries(CONVERSATION_TEMPLATES).map(([id, template]) => ({
    id,
    name: template.name,
    description: template.description,
    steps: template.steps.length
  }));
}

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = {
  // Main conversation functions
  startConversation,
  processInput,
  getContext,
  suggestResponse,
  endConversation,

  // Templates and patterns
  getTemplate,
  listTemplates,
  CONVERSATION_TEMPLATES,
  DIALOGUE_PATTERNS,
  COMMON_PHRASES,

  // Utility functions
  resolvePronoun,
  generateFallbackResponse,
  suggestCorrections,

  // For testing/debugging
  generateResponse,
  matchDialoguePattern,
  detectInputLanguage,
  extractEntities
};

// ============================================================================
// CLI TEST
// ============================================================================

if (require.main === module) {
  (async () => {
    console.log('=== GUINIUS Conversation Module ===\n');

    // Test 1: Start conversation
    console.log('--- Test 1: Start Conversation ---');
    const conv = startConversation({ userName: 'Dash' });
    console.log('Conversation ID:', conv.id);
    console.log('Greeting:', conv.greeting.susu);
    console.log('         ', conv.greeting.english);
    console.log();

    // Test 2: Process greetings
    console.log('--- Test 2: Greeting Exchange ---');
    const inputs = [
      'I kena!',
      'Tanante, I fan?',
      'N lafia. I denbaya lafia?',
      'I balake!',
      'Won na temou!'
    ];

    for (const input of inputs) {
      console.log(`User: "${input}"`);
      const result = await processInput(input, conv.id);
      if (result.response) {
        console.log(`Bot:  "${result.response.susu || result.response}"`);
        if (result.response.english) {
          console.log(`      (${result.response.english})`);
        }
      }
      console.log();
    }

    // Test 3: Context tracking
    console.log('--- Test 3: Context ---');
    const ctx = getContext(conv.id);
    console.log('Turn count:', ctx.turnCount);
    console.log('User:', ctx.user.name);
    console.log('Recent history:', ctx.recentHistory.length, 'exchanges');
    console.log();

    // Test 4: Suggestions
    console.log('--- Test 4: Suggest Next Response ---');
    const suggestions = suggestResponse(conv.id);
    console.log('Category:', suggestions.category);
    console.log('Suggestions:');
    suggestions.suggestions.forEach((s, i) => {
      console.log(`  ${i + 1}. ${s.susu} (${s.english})`);
    });
    console.log();

    // Test 5: Templates
    console.log('--- Test 5: Available Templates ---');
    const templates = listTemplates();
    templates.forEach(t => {
      console.log(`  - ${t.name}: ${t.description} (${t.steps} steps)`);
    });
    console.log();

    // Test 6: End conversation
    console.log('--- Test 6: End Conversation ---');
    const endResult = endConversation(conv.id);
    console.log('Duration:', endResult.summary.duration, 'ms');
    console.log('Turns:', endResult.summary.turnCount);
    console.log('Farewell:', endResult.farewell.susu);
    console.log();

    console.log('=== All Tests Complete ===');
  })();
}
