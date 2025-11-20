/**
 * Soussou Engine - Response Selector Module
 *
 * Selects contextually appropriate Soussou responses based on input classification
 * and conversation context.
 */

const fs = require('fs');
const path = require('path');

class ResponseSelector {
  constructor() {
    this.rules = null;
    this.trainingData = null;
    this.syntaxPatterns = null;
    this.conversationFlows = null;
    this.context = this.initializeContext();
    this.loadData();
  }

  /**
   * Load all required data files
   */
  loadData() {
    const dataPath = path.join(__dirname, '..', 'data');

    try {
      this.rules = JSON.parse(
        fs.readFileSync(path.join(dataPath, 'response_rules.json'), 'utf8')
      );
      this.trainingData = JSON.parse(
        fs.readFileSync(path.join(dataPath, 'training_examples.json'), 'utf8')
      );
      this.syntaxPatterns = JSON.parse(
        fs.readFileSync(path.join(dataPath, 'syntax_patterns.json'), 'utf8')
      );

      // Load conversation flows if available
      const flowsPath = path.join(dataPath, 'conversation_flows.json');
      if (fs.existsSync(flowsPath)) {
        this.conversationFlows = JSON.parse(fs.readFileSync(flowsPath, 'utf8'));
      }
    } catch (error) {
      console.error('Error loading data:', error.message);
    }
  }

  /**
   * Initialize conversation context
   */
  initializeContext() {
    return {
      formality: 'casual',        // casual | formal
      relationship: 'friend',     // friend | stranger | business
      topic: null,                // current topic
      previousExchanges: [],      // history of exchanges
      timeOfDay: this.getTimeOfDay(),
      lastInputType: null,
      lastResponseType: null,
      turnCount: 0
    };
  }

  /**
   * Get current time of day
   */
  getTimeOfDay() {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return 'morning';
    if (hour >= 12 && hour < 17) return 'afternoon';
    if (hour >= 17 && hour < 21) return 'evening';
    return 'night';
  }

  /**
   * Classify input by type
   * @param {string} soussouText - Input text in Soussou
   * @returns {Object} Classification result
   */
  classifyInput(soussouText) {
    const text = soussouText.toLowerCase();
    const classification = {
      type: 'statement',
      confidence: 0,
      markers: [],
      subtype: null
    };

    const inputTypes = this.rules.input_classification;

    // Priority order for checking (compound markers first)
    const priorityOrder = [
      'price_question',      // Check "songo yiri" before "yiri" alone
      'time_question',       // Check "wakhati yiri" before "yiri" alone
      'greeting',
      'location_question',
      'yes_no_question',
      'command',
      'what_question',
      'ability_question',
      'quantity_question',   // Check last since "yiri" is generic
      'statement'
    ];

    // Check each input type in priority order
    for (const typeName of priorityOrder) {
      const typeConfig = inputTypes[typeName];
      if (!typeConfig) continue;

      const markers = typeConfig.markers || [];
      const foundMarkers = markers.filter(marker =>
        text.includes(marker.toLowerCase())
      );

      if (foundMarkers.length > 0) {
        // Calculate confidence with bonus for longer (more specific) markers
        const avgMarkerLength = foundMarkers.reduce((sum, m) => sum + m.length, 0) / foundMarkers.length;
        const specificityBonus = avgMarkerLength / 10; // Bonus for longer markers
        const confidence = (foundMarkers.length / markers.length) + specificityBonus;

        if (confidence > classification.confidence) {
          classification.type = typeName;
          classification.confidence = Math.min(1, confidence);
          classification.markers = foundMarkers;
        }
      }
    }

    // Determine subtype based on context markers
    classification.subtype = this.detectSubtype(text, classification.type);

    // Detect formality
    classification.formality = this.detectFormality(text);

    // Detect urgency
    classification.urgent = this.detectUrgency(text);

    // Detect tone
    classification.tone = this.detectTone(text);

    return classification;
  }

  /**
   * Detect subtype of input
   */
  detectSubtype(text, inputType) {
    if (inputType === 'greeting') {
      if (text.includes('kena')) return 'morning';
      if (text.includes('suba')) return 'evening';
      if (text.includes('lafia')) return 'wellness';
    }

    if (inputType === 'location_question') {
      if (text.includes('baba') || text.includes('boke') || text.includes('soeur')) {
        return 'family';
      }
      if (text.includes('kira') || text.includes('hopital') || text.includes('pharmacie')) {
        return 'directions';
      }
    }

    if (inputType === 'price_question') {
      if (text.includes('taxi') || text.includes('bus')) return 'transportation';
      if (text.includes('telephone') || text.includes('wifi')) return 'electronics';
      return 'shopping';
    }

    if (inputType === 'statement') {
      if (text.includes('furu') || text.includes('soleil') || text.includes('vent')) {
        return 'weather';
      }
      if (text.includes('malade') || text.includes('hopital')) return 'health';
      if (text.includes('woto') || text.includes('taxi')) return 'transportation';
      if (text.includes('balake') || text.includes('merci')) return 'gratitude';
    }

    return null;
  }

  /**
   * Detect formality level
   */
  detectFormality(text) {
    const formalIndicators = this.rules.context_markers.formal_indicators;
    const informalIndicators = this.rules.context_markers.informal_indicators;

    const formalCount = formalIndicators.filter(i =>
      text.toLowerCase().includes(i.toLowerCase())
    ).length;

    const informalCount = informalIndicators.filter(i =>
      text.toLowerCase().includes(i.toLowerCase())
    ).length;

    if (formalCount > informalCount) return 'formal';
    if (informalCount > formalCount) return 'casual';
    return this.context.formality; // Keep current context
  }

  /**
   * Detect urgency
   */
  detectUrgency(text) {
    const urgentMarkers = this.rules.context_markers.urgent_indicators;
    return urgentMarkers.some(marker =>
      text.toLowerCase().includes(marker.toLowerCase())
    );
  }

  /**
   * Detect tone (positive/negative)
   */
  detectTone(text) {
    const positiveMarkers = this.rules.context_markers.positive_tone;
    const negativeMarkers = this.rules.context_markers.negative_tone;

    const positiveCount = positiveMarkers.filter(m =>
      text.toLowerCase().includes(m.toLowerCase())
    ).length;

    const negativeCount = negativeMarkers.filter(m =>
      text.toLowerCase().includes(m.toLowerCase())
    ).length;

    if (positiveCount > negativeCount) return 'positive';
    if (negativeCount > positiveCount) return 'negative';
    return 'neutral';
  }

  /**
   * Select response type based on input type and context
   * @param {string} inputType - Classified input type
   * @param {Object} context - Current conversation context
   * @returns {string} Response type
   */
  selectResponseType(inputType, context = this.context) {
    // Get the current classification for better matching
    const currentExchange = context.previousExchanges[context.previousExchanges.length - 1];
    const currentClassification = currentExchange ? currentExchange.classification : null;

    // Find matching rules with scoring
    const scoredRules = this.rules.response_rules.map(rule => {
      let score = 0;

      // Must match input type
      if (rule.if_input_type !== inputType) return { rule, score: -1 };

      score += 1; // Base score for type match

      // Check time of day if specified
      if (rule.if_time_of_day) {
        if (rule.if_time_of_day === context.timeOfDay) {
          score += 2;
        } else {
          return { rule, score: -1 }; // Must match if specified
        }
      }

      // Check context if specified
      if (rule.if_context) {
        let contextMatched = false;

        // Check current topic
        if (context.topic === rule.if_context) {
          score += 2;
          contextMatched = true;
        }
        // Check classification subtype
        else if (currentClassification && currentClassification.subtype === rule.if_context) {
          score += 2;
          contextMatched = true;
        }
        // Check for urgent context
        else if (rule.if_context === 'urgent' && currentClassification && currentClassification.urgent) {
          score += 3; // High priority for urgent
          contextMatched = true;
        }
        // Check if context is in the markers
        else if (currentClassification && currentClassification.markers) {
          const contextInMarkers = currentClassification.markers.some(m =>
            m.toLowerCase().includes(rule.if_context.toLowerCase()) ||
            rule.if_context.toLowerCase().includes(m.toLowerCase())
          );
          if (contextInMarkers) {
            score += 1;
            contextMatched = true;
          }
        }

        // Penalize rules with context constraints that don't match
        if (!contextMatched) {
          score -= 0.5;
        }
      }

      return { rule, score };
    });

    // Filter and sort by score
    const validRules = scoredRules
      .filter(r => r.score > 0)
      .sort((a, b) => b.score - a.score);

    if (validRules.length > 0) {
      return validRules[0].rule.respond_with;
    }

    // Check for urgent commands specially
    if (inputType === 'command' && currentClassification && currentClassification.urgent) {
      return 'urgent_acknowledgment';
    }

    // Default response types
    const defaultResponses = {
      greeting: 'greeting_response',
      location_question: 'location_response',
      price_question: 'price_response',
      time_question: 'time_response',
      yes_no_question: 'affirmation',
      command: 'acknowledgment',
      statement: 'weather_reaction',
      what_question: 'information_response',
      ability_question: 'ability_affirmation',
      quantity_question: 'quantity_response'
    };

    return defaultResponses[inputType] || 'generic_response';
  }

  /**
   * Get response candidates for a given response type
   * @param {string} responseType - Type of response needed
   * @returns {Array} Array of candidate responses
   */
  getCandidates(responseType) {
    const candidates = [];

    // Find rules that produce this response type
    const relevantRules = this.rules.response_rules.filter(
      rule => rule.respond_with === responseType
    );

    // Extract examples from rules
    relevantRules.forEach(rule => {
      if (rule.examples) {
        rule.examples.forEach(example => {
          candidates.push({
            response: example.response,
            input: example.input,
            ruleId: rule.id,
            confidence: 0.8
          });
        });
      }
    });

    // Also search training data for matching contexts
    if (this.trainingData) {
      const contextMapping = this.getContextMapping(responseType);

      this.trainingData.forEach(example => {
        if (contextMapping.includes(example.context)) {
          candidates.push({
            response: example.response.soussou,
            input: example.soussou,
            context: example.context,
            english: example.response.english,
            confidence: 0.9
          });
        }
      });
    }

    return candidates;
  }

  /**
   * Map response types to training data contexts
   */
  getContextMapping(responseType) {
    const mappings = {
      'morning_greeting_response': ['greeting_morning'],
      'evening_greeting_response': ['greeting_evening'],
      'greeting_response': ['greeting_morning', 'greeting_evening', 'greeting_family'],
      'family_wellness_response': ['greeting_family', 'family_greeting', 'family_health'],
      'location_response': ['location_question', 'family_location', 'directions_question'],
      'directions_response': ['directions_giving', 'directions_services', 'directions_food'],
      'price_response': ['shopping_price', 'shopping_vegetables', 'shopping_fruit', 'shopping_meat', 'shopping_clothes', 'shopping_electronics'],
      'time_response': ['time_question', 'time_schedule', 'work_schedule'],
      'day_response': ['time_day'],
      'when_response': ['family_schedule', 'transportation_schedule'],
      'affirmation': ['shopping_quality', 'family_health', 'concern_check'],
      'negation': ['ability_question', 'utilities_question'],
      'urgent_acknowledgment': ['command_urgent', 'command_departure'],
      'shopping_acknowledgment': ['command_shopping'],
      'communication_acknowledgment': ['command_communication', 'attention_command'],
      'acknowledgment': ['command_urgent', 'command_shopping', 'command_communication', 'hospitality'],
      'gratitude': ['hospitality'],
      'weather_reaction': ['weather_rain', 'weather_hot', 'weather_warning', 'weather_storm', 'weather_cold', 'weather_change'],
      'problem_response': ['transportation_problem', 'utilities_problem', 'communication_difficulty'],
      'concern_blessing': ['absence_reason', 'health_question'],
      'arrival_response': ['transportation_ready', 'transportation_update'],
      'information_response': ['food_question', 'helping_question', 'plans_question'],
      'about_person_response': ['movement_question', 'checking_others', 'invitation_question'],
      'quantity_response': ['family_question'],
      'farewell_blessing': ['farewell_blessing', 'time_evening'],
      'event_response': ['event_attendance', 'declining_invitation'],
      'generic_response': ['checking_in', 'agreement_reassurance', 'empathy_statement']
    };

    return mappings[responseType] || [];
  }

  /**
   * Select the best response from candidates
   * @param {string} input - Original input text
   * @param {Object} context - Conversation context
   * @returns {Object} Selected response
   */
  selectResponse(input, context = this.context) {
    // Classify input
    const classification = this.classifyInput(input);

    // Update context
    this.updateContext(input, classification);

    // Select response type
    const responseType = this.selectResponseType(classification.type, context);

    // Get candidates
    let candidates = this.getCandidates(responseType);

    if (candidates.length === 0) {
      // Fallback to generic response
      return {
        response: "Awa, ntan comprendfe.",
        english: "Yes, I understand.",
        confidence: 0.5,
        responseType: 'fallback',
        classification: classification,
        candidates: []
      };
    }

    // Score candidates based on context matching
    candidates = this.scoreCandidates(candidates, input, classification, context);

    // Sort by score
    candidates.sort((a, b) => b.score - a.score);

    // Select top candidate
    const selected = candidates[0];

    // Format response based on formality
    const formatted = this.formatResponse(selected.response, context.formality);

    return {
      response: formatted,
      english: selected.english || null,
      confidence: selected.score,
      responseType: responseType,
      classification: classification,
      candidates: candidates.slice(0, 3) // Top 3 for reference
    };
  }

  /**
   * Score candidates based on various factors
   */
  scoreCandidates(candidates, input, classification, context) {
    return candidates.map(candidate => {
      let score = candidate.confidence || 0.5;

      // Boost if input contains similar words
      const inputWords = input.toLowerCase().split(/\s+/);
      const responseWords = candidate.response.toLowerCase().split(/\s+/);
      const candidateInputWords = (candidate.input || '').toLowerCase().split(/\s+/);

      // Check word overlap with candidate's expected input
      const inputOverlap = inputWords.filter(w => candidateInputWords.includes(w)).length;
      score += (inputOverlap / inputWords.length) * 0.3;

      // Boost for matching subtype
      if (classification.subtype && candidate.context) {
        if (candidate.context.includes(classification.subtype)) {
          score += 0.2;
        }
      }

      // Boost for matching formality
      if (context.formality === 'formal' &&
          (candidate.response.includes('Ala xa') || candidate.response.includes('Tanante'))) {
        score += 0.1;
      }

      // Boost for conversation flow continuity
      if (context.previousExchanges.length > 0) {
        const lastExchange = context.previousExchanges[context.previousExchanges.length - 1];
        if (this.checkFlowContinuity(lastExchange, candidate)) {
          score += 0.15;
        }
      }

      // Penalize repetition
      if (context.previousExchanges.some(e => e.response === candidate.response)) {
        score -= 0.5;
      }

      return {
        ...candidate,
        score: Math.min(1, Math.max(0, score))
      };
    });
  }

  /**
   * Check if candidate maintains conversation flow
   */
  checkFlowContinuity(lastExchange, candidate) {
    if (!this.conversationFlows) return false;

    // Check if this follows expected flow patterns
    const flows = this.conversationFlows.flows || [];

    for (const flow of flows) {
      const steps = flow.steps || [];
      for (let i = 0; i < steps.length - 1; i++) {
        if (lastExchange.responseType === steps[i].type &&
            candidate.context && candidate.context.includes(steps[i + 1].type)) {
          return true;
        }
      }
    }

    return false;
  }

  /**
   * Format response with optional French mixing
   * @param {string} response - Raw response
   * @param {string} formalityLevel - casual | formal
   * @returns {string} Formatted response
   */
  formatResponse(response, formalityLevel = 'casual') {
    let formatted = response;

    if (formalityLevel === 'formal') {
      // Convert casual French insertions to Soussou equivalents
      const formalReplacements = {
        'Ok': 'Awa',
        'Cool': 'Bon',
        'ok': 'awa',
        'cool': 'bon'
      };

      Object.entries(formalReplacements).forEach(([french, soussou]) => {
        formatted = formatted.replace(new RegExp(`\\b${french}\\b`, 'g'), soussou);
      });
    }

    // Ensure proper sentence ending
    if (!formatted.endsWith('.') && !formatted.endsWith('!') && !formatted.endsWith('?')) {
      formatted += '.';
    }

    return formatted;
  }

  /**
   * Update conversation context
   */
  updateContext(input, classification) {
    // Update formality
    if (classification.formality) {
      this.context.formality = classification.formality;
    }

    // Update topic based on subtype
    if (classification.subtype) {
      this.context.topic = classification.subtype;
    }

    // Store exchange
    this.context.previousExchanges.push({
      input: input,
      classification: classification,
      timestamp: new Date().toISOString()
    });

    // Keep only last 5 exchanges
    if (this.context.previousExchanges.length > 5) {
      this.context.previousExchanges.shift();
    }

    // Update counters
    this.context.lastInputType = classification.type;
    this.context.turnCount++;
  }

  /**
   * Set relationship context
   */
  setRelationship(relationship) {
    if (['friend', 'stranger', 'business'].includes(relationship)) {
      this.context.relationship = relationship;

      // Adjust default formality based on relationship
      if (relationship === 'business' || relationship === 'stranger') {
        this.context.formality = 'formal';
      } else {
        this.context.formality = 'casual';
      }
    }
  }

  /**
   * Reset conversation context
   */
  resetContext() {
    this.context = this.initializeContext();
  }

  /**
   * Get conversation summary
   */
  getContextSummary() {
    return {
      ...this.context,
      exchangeCount: this.context.previousExchanges.length
    };
  }

  /**
   * Handle multi-turn conversation
   * @param {string} input - Current input
   * @returns {Object} Response with flow information
   */
  handleConversation(input) {
    const response = this.selectResponse(input, this.context);

    // Update context with response
    const lastExchange = this.context.previousExchanges[this.context.previousExchanges.length - 1];
    if (lastExchange) {
      lastExchange.response = response.response;
      lastExchange.responseType = response.responseType;
    }

    // Check if conversation flow suggests a follow-up
    const expectedFollowUp = this.getExpectedFollowUp(response.responseType);

    return {
      ...response,
      expectedFollowUp: expectedFollowUp,
      turnCount: this.context.turnCount
    };
  }

  /**
   * Get expected follow-up based on response type
   */
  getExpectedFollowUp(responseType) {
    const followUps = {
      'morning_greeting_response': ['family_inquiry', 'wellness_check'],
      'location_response': ['arrival_update', 'time_estimate'],
      'price_response': ['negotiation', 'quantity_selection'],
      'problem_response': ['solution', 'assistance_offer'],
      'urgent_acknowledgment': ['explanation_request']
    };

    return followUps[responseType] || null;
  }
}

// Export for use
module.exports = ResponseSelector;

// CLI usage if run directly
if (require.main === module) {
  const selector = new ResponseSelector();

  // Test examples
  const testInputs = [
    "I kena! Tana mu a ra?",
    "Ina minde?",
    "Mangue gui songo yiri?",
    "Fa be vite! Urgent gbo!",
    "Furu gbo nun bi!"
  ];

  console.log("Soussou Response Selector - Test Results\n");
  console.log("=".repeat(50));

  testInputs.forEach(input => {
    console.log(`\nInput: ${input}`);
    const result = selector.handleConversation(input);
    console.log(`Response: ${result.response}`);
    console.log(`Type: ${result.classification.type} -> ${result.responseType}`);
    console.log(`Confidence: ${(result.confidence * 100).toFixed(1)}%`);
    if (result.english) {
      console.log(`English: ${result.english}`);
    }
    console.log("-".repeat(50));
  });

  // Additional test for multi-turn conversation
  console.log("\n\nMulti-turn Conversation Test\n");
  console.log("=".repeat(50));

  selector.resetContext();
  const conversation = [
    "I kena!",
    "I denbaya lafia?",
    "Ina minde?",
    "Ala xa whon' kisi!"
  ];

  conversation.forEach((input, i) => {
    console.log(`\nTurn ${i + 1}: ${input}`);
    const result = selector.handleConversation(input);
    console.log(`Response: ${result.response}`);
    console.log(`Flow: ${result.classification.type} -> ${result.responseType}`);
    console.log("-".repeat(50));
  });
}
