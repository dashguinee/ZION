/**
 * Soussou Sentence Generator
 *
 * A system for generating grammatically correct Soussou sentences
 * from templates and vocabulary, with support for French-Soussou code-switching.
 */

const fs = require('fs');
const path = require('path');

class SoussouGenerator {
  constructor(dataPath = null) {
    this.dataPath = dataPath || path.join(__dirname, '..', 'data');
    this.templates = null;
    this.slotMappings = null;
    this.lexicon = null;
    this.loaded = false;
  }

  /**
   * Load all required data files
   */
  async load() {
    if (this.loaded) return;

    try {
      // Load templates
      const templatesPath = path.join(this.dataPath, 'generation_templates.json');
      this.templates = JSON.parse(fs.readFileSync(templatesPath, 'utf8'));

      // Load slot mappings
      const mappingsPath = path.join(this.dataPath, 'slot_mappings.json');
      this.slotMappings = JSON.parse(fs.readFileSync(mappingsPath, 'utf8'));

      // Load lexicon
      const lexiconPath = path.join(this.dataPath, 'lexicon.json');
      this.lexicon = JSON.parse(fs.readFileSync(lexiconPath, 'utf8'));

      this.loaded = true;
    } catch (error) {
      throw new Error(`Failed to load data files: ${error.message}`);
    }
  }

  /**
   * Ensure data is loaded before operations
   */
  ensureLoaded() {
    if (!this.loaded) {
      this.load();
    }
  }

  /**
   * Generate a sentence from a template with specific slot values
   *
   * @param {string} templateName - Name of the template to use
   * @param {Object} slots - Object mapping slot names to values
   * @returns {Object} Generated sentence with metadata
   */
  generate(templateName, slots = {}) {
    this.ensureLoaded();

    const template = this.templates.templates[templateName];
    if (!template) {
      throw new Error(`Template '${templateName}' not found`);
    }

    let sentence = template.pattern;
    const usedSlots = {};

    // Replace each slot in the pattern
    const slotPattern = /\{([A-Z_]+)\}/g;
    sentence = sentence.replace(slotPattern, (match, slotName) => {
      let value;

      if (slots[slotName] !== undefined) {
        // Use provided value
        value = slots[slotName];
      } else if (template.slots && template.slots[slotName]) {
        // Pick random from template defaults
        const options = template.slots[slotName];
        value = Array.isArray(options)
          ? options[Math.floor(Math.random() * options.length)]
          : options;
      } else {
        // Try to get from slot mappings
        value = this._getRandomSlotValue(slotName);
      }

      usedSlots[slotName] = value;
      return value || '';
    });

    // Clean up the sentence
    sentence = this._cleanSentence(sentence);

    return {
      soussou: sentence,
      template: templateName,
      context: template.context,
      french_equivalent: template.french_equivalent,
      slots_used: usedSlots
    };
  }

  /**
   * Generate a random sentence of a specific type
   *
   * @param {string} sentenceType - Type of sentence (greeting, question, statement, command, etc.)
   * @returns {Object} Generated sentence with metadata
   */
  generateRandom(sentenceType) {
    this.ensureLoaded();

    const typeMapping = this.templates.sentence_type_mapping;
    if (!typeMapping[sentenceType]) {
      throw new Error(`Unknown sentence type '${sentenceType}'. Available: ${Object.keys(typeMapping).join(', ')}`);
    }

    // Get all templates for this type
    const templateNames = typeMapping[sentenceType];
    const randomTemplate = templateNames[Math.floor(Math.random() * templateNames.length)];

    // Generate with random slot values
    return this.generate(randomTemplate);
  }

  /**
   * Generate an appropriate response to a Soussou input
   *
   * @param {string} inputSoussou - Input sentence in Soussou
   * @param {string} context - Optional context hint
   * @returns {Object} Generated response with metadata
   */
  generateResponse(inputSoussou, context = null) {
    this.ensureLoaded();

    const input = inputSoussou.toLowerCase();
    const responseTemplates = this.templates.response_templates;

    // Find matching response trigger
    let matchedTemplates = null;
    for (const [key, mapping] of Object.entries(responseTemplates)) {
      for (const trigger of mapping.triggers) {
        if (input.includes(trigger.toLowerCase())) {
          matchedTemplates = mapping.templates;
          break;
        }
      }
      if (matchedTemplates) break;
    }

    // If no match found, try to detect sentence type
    if (!matchedTemplates) {
      if (input.includes('?') || input.includes('minde') || input.includes('yiri')) {
        // It's a question, provide a response
        matchedTemplates = ['agreement', 'situation_response'];
      } else if (input.includes('!') || this._isImperative(input)) {
        // It's a command, acknowledge
        matchedTemplates = ['agreement', 'movement_with_time'];
      } else {
        // Default responses
        matchedTemplates = ['agreement', 'greeting_response'];
      }
    }

    // Pick random template from matches
    const templateName = matchedTemplates[Math.floor(Math.random() * matchedTemplates.length)];
    const response = this.generate(templateName);

    return {
      ...response,
      in_response_to: inputSoussou,
      detected_context: context || this._detectContext(input)
    };
  }

  /**
   * Validate a generated or provided Soussou sentence
   *
   * @param {string} sentence - Sentence to validate
   * @returns {Object} Validation result with issues and score
   */
  validate(sentence) {
    this.ensureLoaded();

    const issues = [];
    let score = 100;

    // Check for basic structure
    if (!sentence || sentence.trim().length === 0) {
      return { valid: false, score: 0, issues: ['Empty sentence'] };
    }

    const words = sentence.split(/\s+/);

    // Rule 1: Check negation position
    const mmaIndex = words.findIndex(w => w.toLowerCase() === "m'ma");
    if (mmaIndex > -1 && mmaIndex > 0) {
      // m'ma should come after subject
      const prevWord = words[mmaIndex - 1].toLowerCase();
      const validSubjects = ['ntan', 'ina', 'ana', 'etan', 'whontan', 'moukhou', 'wo', "m'ma"];
      if (!validSubjects.some(s => prevWord.includes(s)) && !prevWord.includes('woto')) {
        issues.push("Negation 'm'ma' should follow a subject pronoun");
        score -= 10;
      }
    }

    // Rule 2: Check question word position
    const questionWords = ['minde', 'yiri', 'ngo', 'go'];
    for (const qw of questionWords) {
      const qwIndex = words.findIndex(w => w.toLowerCase().includes(qw));
      if (qwIndex > -1 && sentence.includes('?')) {
        // Question word should be near the end
        if (qwIndex < words.length - 3) {
          issues.push(`Question word '${qw}' typically appears at the end`);
          score -= 5;
        }
      }
    }

    // Rule 3: Check possessive-noun order
    const possessives = ["m'ma", 'akha', 'ikha', 'whonma', 'ekha'];
    for (const poss of possessives) {
      const possIndex = words.findIndex(w => w.toLowerCase() === poss);
      if (possIndex > -1 && possIndex === words.length - 1) {
        issues.push(`Possessive '${poss}' should be followed by a noun`);
        score -= 15;
      }
    }

    // Rule 4: Check intensifier position
    const gboIndex = words.findIndex(w => w.toLowerCase() === 'gbo');
    if (gboIndex === 0) {
      issues.push("Intensifier 'gbo' should follow what it modifies");
      score -= 10;
    }

    // Rule 5: Check for known vocabulary
    const unknownWords = [];
    for (const word of words) {
      const cleaned = word.toLowerCase().replace(/[?.!,]/g, '');
      if (cleaned.length > 2 && !this._isKnownWord(cleaned)) {
        unknownWords.push(cleaned);
      }
    }
    if (unknownWords.length > words.length * 0.5) {
      issues.push(`Many unknown words: ${unknownWords.slice(0, 3).join(', ')}...`);
      score -= 20;
    }

    // Rule 6: Check sentence structure
    if (words.length < 2 && !sentence.includes('!')) {
      issues.push('Sentence may be too short');
      score -= 5;
    }

    return {
      valid: score >= 60,
      score: Math.max(0, score),
      issues,
      word_count: words.length,
      has_question: sentence.includes('?'),
      has_negation: sentence.toLowerCase().includes("m'ma") || sentence.toLowerCase().includes(' mu ')
    };
  }

  /**
   * Get all available templates
   *
   * @returns {Object} Templates organized by type
   */
  getTemplates() {
    this.ensureLoaded();

    return {
      templates: Object.keys(this.templates.templates),
      by_type: this.templates.sentence_type_mapping,
      total: Object.keys(this.templates.templates).length
    };
  }

  /**
   * Get template details
   *
   * @param {string} templateName - Name of template
   * @returns {Object} Template details
   */
  getTemplateDetails(templateName) {
    this.ensureLoaded();

    const template = this.templates.templates[templateName];
    if (!template) {
      throw new Error(`Template '${templateName}' not found`);
    }

    return {
      name: templateName,
      pattern: template.pattern,
      slots: template.slots || {},
      examples: template.examples,
      context: template.context,
      french_equivalent: template.french_equivalent
    };
  }

  /**
   * Generate multiple sentences of different types
   *
   * @param {number} count - Number of sentences to generate
   * @param {string[]} types - Types to include (optional, defaults to all)
   * @returns {Object[]} Array of generated sentences
   */
  generateBatch(count = 5, types = null) {
    this.ensureLoaded();

    const availableTypes = types || Object.keys(this.templates.sentence_type_mapping);
    const sentences = [];

    for (let i = 0; i < count; i++) {
      const type = availableTypes[Math.floor(Math.random() * availableTypes.length)];
      try {
        sentences.push(this.generateRandom(type));
      } catch (error) {
        // Skip on error
      }
    }

    return sentences;
  }

  /**
   * Generate a conversation exchange
   *
   * @param {string} topic - Conversation topic (greeting, shopping, directions, etc.)
   * @returns {Object} Conversation with question/statement and response
   */
  generateConversation(topic = 'greeting') {
    this.ensureLoaded();

    const topicMappings = {
      greeting: {
        opener: ['greeting_morning', 'greeting_evening'],
        response: ['greeting_response', 'wellness_response']
      },
      shopping: {
        opener: ['price_question', 'quality_question'],
        response: ['price_response', 'agreement']
      },
      directions: {
        opener: ['directions_question', 'directions_nearby'],
        response: ['directions_giving', 'agreement']
      },
      family: {
        opener: ['family_wellness', 'children_question'],
        response: ['wellness_response', 'children_response']
      },
      time: {
        opener: ['time_question', 'when_question', 'schedule_question'],
        response: ['agreement', 'time_statement']
      },
      movement: {
        opener: ['location_question', 'ability_question'],
        response: ['movement_with_time', 'negation_ability']
      }
    };

    const mapping = topicMappings[topic] || topicMappings.greeting;

    const openerTemplate = mapping.opener[Math.floor(Math.random() * mapping.opener.length)];
    const responseTemplate = mapping.response[Math.floor(Math.random() * mapping.response.length)];

    const opener = this.generate(openerTemplate);
    const response = this.generate(responseTemplate);

    return {
      topic,
      exchange: [
        { speaker: 'A', ...opener },
        { speaker: 'B', ...response }
      ]
    };
  }

  /**
   * Add French word to a Soussou sentence (code-switching)
   *
   * @param {string} sentence - Soussou sentence
   * @param {string} frenchWord - French word to integrate
   * @param {string} position - Position (modifier, noun, conjunction)
   * @returns {string} Sentence with French word integrated
   */
  addFrenchWord(sentence, frenchWord, position = 'modifier') {
    switch (position) {
      case 'modifier':
        // Add at end as modifier
        return `${sentence.replace(/[.!?]$/, '')} ${frenchWord}${sentence.match(/[.!?]$/) || '.'}`;

      case 'conjunction':
        // Add at start with space
        return `${frenchWord} ${sentence}`;

      case 'noun':
        // Replace common noun pattern
        return sentence;

      default:
        return `${sentence} ${frenchWord}`;
    }
  }

  /**
   * Get slot values for a specific slot type
   *
   * @param {string} slotName - Name of the slot
   * @returns {Object} Available values for the slot
   */
  getSlotValues(slotName) {
    this.ensureLoaded();

    const slot = this.slotMappings.slots[slotName];
    if (!slot) {
      throw new Error(`Slot '${slotName}' not found`);
    }

    return {
      name: slotName,
      description: slot.description,
      values: slot.values,
      lexicon_category: slot.lexicon_category || null
    };
  }

  /**
   * List all available slot types
   *
   * @returns {string[]} List of slot names
   */
  listSlots() {
    this.ensureLoaded();
    return Object.keys(this.slotMappings.slots);
  }

  /**
   * Get French fillers for code-switching
   *
   * @param {string} category - Category of filler (modifiers, conjunctions, etc.)
   * @returns {string[]} List of French words
   */
  getFrenchFillers(category = null) {
    this.ensureLoaded();

    const fillers = this.slotMappings.french_fillers;
    if (category && fillers[category]) {
      return fillers[category];
    }
    return fillers;
  }

  // Private helper methods

  _getRandomSlotValue(slotName) {
    const slot = this.slotMappings.slots[slotName];
    if (!slot) return '';

    let values = slot.values;
    if (typeof values === 'object' && !Array.isArray(values)) {
      // Get first array from object
      const firstKey = Object.keys(values)[0];
      values = values[firstKey];
    }

    if (Array.isArray(values)) {
      return values[Math.floor(Math.random() * values.length)];
    }

    return values || '';
  }

  _cleanSentence(sentence) {
    return sentence
      .replace(/\s+/g, ' ')           // Multiple spaces to single
      .replace(/\s+([.!?])/g, '$1')   // Remove space before punctuation
      .replace(/\s+,/g, ',')          // Remove space before comma
      .replace(/^\s+|\s+$/g, '')      // Trim
      .replace(/\s*\.\s*\./g, '.')    // Double periods
      .replace(/\{\w+\}/g, '')        // Remove unfilled slots
      .trim();
  }

  _isImperative(text) {
    const imperativeStarters = ['fa', 'siga', 'dokho', 'mmeme', 'alou', 'kelli', "t'ti", "n'khili", "n'mato"];
    const firstWord = text.split(/\s+/)[0].toLowerCase();
    return imperativeStarters.some(imp => firstWord.includes(imp));
  }

  _detectContext(input) {
    if (input.includes('kena') || input.includes('suba')) return 'greeting';
    if (input.includes('minde')) return 'location';
    if (input.includes('songo')) return 'price';
    if (input.includes('lafia')) return 'wellness';
    if (input.includes('fafe')) return 'movement';
    if (input.includes('wakhati')) return 'time';
    return 'general';
  }

  _isKnownWord(word) {
    // Check in lexicon
    if (this.lexicon.some(entry =>
      entry.base.toLowerCase() === word ||
      entry.variants?.some(v => v.toLowerCase() === word)
    )) {
      return true;
    }

    // Check common French words
    const frenchWords = [
      'un', 'peu', 'bien', 'vite', 'mais', 'apres', 'parce', 'que', 'demain',
      'maintenant', 'taxi', 'bus', 'hopital', 'ecole', 'pharmacie', 'restaurant',
      'minutes', 'heures', 'mille', 'cent', 'dix', 'vingt', 'trente', 'cinquante',
      'aujourd', 'hui', 'tres', 'bon', 'tout', 'droit', 'gauche', 'droite',
      'promis', 'pardon', 'merci', 'cool', 'd', 'accord', 'c', 'est'
    ];

    return frenchWords.includes(word);
  }
}

// Export the class
module.exports = SoussouGenerator;

// CLI usage example
if (require.main === module) {
  const generator = new SoussouGenerator();

  try {
    // Load data
    generator.load();
    console.log('Soussou Sentence Generator loaded successfully!\n');

    // Generate examples
    console.log('=== Generated Sentences ===\n');

    // Greeting
    const greeting = generator.generateRandom('greeting');
    console.log(`Greeting: ${greeting.soussou}`);
    console.log(`French: ${greeting.french_equivalent}\n`);

    // Question
    const question = generator.generateRandom('question');
    console.log(`Question: ${question.soussou}`);
    console.log(`French: ${question.french_equivalent}\n`);

    // Command
    const command = generator.generateRandom('command');
    console.log(`Command: ${command.soussou}`);
    console.log(`French: ${command.french_equivalent}\n`);

    // Statement
    const statement = generator.generateRandom('statement');
    console.log(`Statement: ${statement.soussou}`);
    console.log(`French: ${statement.french_equivalent}\n`);

    // Generate a conversation
    console.log('=== Conversation ===\n');
    const conversation = generator.generateConversation('greeting');
    for (const turn of conversation.exchange) {
      console.log(`${turn.speaker}: ${turn.soussou}`);
    }
    console.log('');

    // Validate a sentence
    console.log('=== Validation ===\n');
    const testSentence = 'Ntan m\'ma kolon gui yire.';
    const validation = generator.validate(testSentence);
    console.log(`Sentence: ${testSentence}`);
    console.log(`Valid: ${validation.valid}, Score: ${validation.score}`);
    if (validation.issues.length > 0) {
      console.log(`Issues: ${validation.issues.join('; ')}`);
    }

  } catch (error) {
    console.error(`Error: ${error.message}`);
  }
}
