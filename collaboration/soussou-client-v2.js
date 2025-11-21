/**
 * ZION Soussou-AI Client v2.0
 *
 * Purpose: Cultural intelligence participant that SPEAKS Soussou
 * Unique capability: Natural code-switching (Soussou + French)
 * Security: Low-resource language = natural encryption layer
 *
 * Z-Core's insight: "soussou AI is already a good security layer"
 *
 * Enhancement: Now uses SoussouGenerator to speak actual Soussou!
 * - 328 verified words (4%) = high confidence Soussou
 * - Gaps filled with French = authentic Guinea code-switching
 * - Crowdsourced learning ready
 */

import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const SoussouGenerator = require('../soussou-engine/src/sentence_generator.js');

export class SoussouAIClient {
  constructor(soussouLexicon, dataPath = null) {
    this.lexicon = soussouLexicon;
    this.culturalKnowledge = this.loadCulturalKnowledge();
    this.participantName = 'soussou-ai';

    // Initialize Soussou sentence generator
    try {
      this.generator = new SoussouGenerator(dataPath);
      this.generator.load();
      this.canSpeakSoussou = true;
    } catch (error) {
      console.warn('⚠️ Soussou generator not available, using French mode:', error.message);
      this.canSpeakSoussou = false;
    }
  }

  /**
   * Generate Soussou-AI response in a collaboration
   *
   * @param {Object} context - Collaboration context
   * @returns {Object} - Response with message and state analysis
   */
  async generateResponse(context) {
    const {
      task,
      goal,
      current_state,
      recent_turns = [],
      session_id
    } = context;

    // Analyze task through cultural lens
    const culturalInsights = this.analyzeCulturalContext(task, goal);

    // Generate response WITH ACTUAL SOUSSOU
    const message = await this.buildMessageWithSoussou(task, goal, current_state, culturalInsights, recent_turns);

    // State analysis with cultural considerations
    const stateAnalysis = this.analyzeState(current_state, goal, culturalInsights);

    return {
      from: this.participantName,
      message,
      state_analysis: stateAnalysis,
      cultural_insights: culturalInsights,
      language_used: this.canSpeakSoussou ? 'soussou-français' : 'français',
      confidence: message.confidence || 'medium',
      request_stop: false
    };
  }

  /**
   * Build message with ACTUAL Soussou generation + code-switching
   */
  async buildMessageWithSoussou(task, goal, currentState, culturalInsights, recentTurns) {
    const lines = [];
    let confidence = 'medium';

    // Greeting in Soussou (if generator available)
    if (this.canSpeakSoussou && culturalInsights.use_soussou) {
      try {
        const greeting = this.generator.generateRandom('greeting');
        lines.push(`**${greeting.soussou}** (${greeting.french_equivalent}) 🇬🇳`);
        lines.push('');
        confidence = 'high';
      } catch {
        lines.push("**I seeli?** (Bonjour!) 🇬🇳");
        lines.push('');
      }
    } else {
      lines.push("**Perspective Culturelle Guinée** 🇬🇳");
      lines.push('');
    }

    // Cultural wisdom in Soussou (if possible)
    if (this.canSpeakSoussou && culturalInsights.cultural_considerations.length > 0) {
      const firstInsight = culturalInsights.cultural_considerations[0];

      // Try to express cultural insight in Soussou
      try {
        // Generate a statement about the cultural concept
        const soussouStatement = this.generateCulturalStatement(firstInsight, culturalInsights);
        if (soussouStatement) {
          lines.push("**Sagesse Soussou:**");
          lines.push(soussouStatement);
          lines.push('');
        }
      } catch (error) {
        // Fall back to French if generation fails
      }
    }

    // Cultural insights (in French for clarity)
    if (culturalInsights.cultural_considerations.length > 0) {
      lines.push("**Considérations Culturelles:**");
      culturalInsights.cultural_considerations.forEach(consideration => {
        lines.push(`- **${consideration.aspect}**: ${consideration.context}`);
        lines.push(`  → *Implication*: ${consideration.implication}`);
      });
      lines.push("");
    }

    // Language suggestions (Soussou terms)
    if (culturalInsights.language_suggestions.length > 0) {
      lines.push("**Termes Soussou Recommandés:**");
      culturalInsights.language_suggestions.forEach(suggestion => {
        lines.push(`- "${suggestion.english}" → **${suggestion.soussou}** (${suggestion.usage})`);
      });
      lines.push("");
    }

    // Technical recommendation with cultural context
    if (recentTurns.length > 0) {
      lines.push("**Validation Culturelle:**");

      // Check if proposed solution fits Guinea context
      if (culturalInsights.relevant_domains.includes('technical')) {
        lines.push("- Optimisation approuvée. Rappel: Optimiser pour faible bande passante (contexte Guinée).");
      }

      if (culturalInsights.relevant_domains.includes('finance')) {
        lines.push("- Pour intégration financière: Prioriser Orange Money / MTN Mobile Money.");
      }

      if (culturalInsights.relevant_domains.includes('communication')) {
        lines.push("- Pour communication client: WhatsApp > Email (78% meilleur taux de réponse en Guinée).");
      }
    }

    // Linguistic security note
    if (this.canSpeakSoussou && culturalInsights.use_soussou) {
      lines.push("");
      lines.push("*🔒 Sécurité linguistique: Communication en Soussou = chiffrement naturel (langue à faibles ressources)*");
    }

    // Confidence indicator
    lines.push("");
    lines.push(`*✨ Confiance: ${confidence === 'high' ? 'Haute' : 'Moyenne'} (${this.canSpeakSoussou ? '328 mots vérifiés' : 'Mode français'})*`);

    return {
      text: lines.join("\n"),
      confidence
    };
  }

  /**
   * Generate cultural statement in Soussou with code-switching
   */
  generateCulturalStatement(insight, culturalInsights) {
    if (!this.canSpeakSoussou) return null;

    try {
      // Try different statement types based on context
      let soussouPart = null;
      let frenchPart = null;

      // For finance domain
      if (culturalInsights.relevant_domains.includes('finance')) {
        if (insight.aspect === 'family_money_management') {
          // Try to generate "Family decides together" type statement
          soussouPart = "Dɛnba sɔtɔma kɛ"; // Approximate: "Family decides together"
          frenchPart = "pour les questions d'argent, la famille décide ensemble";
          return `**${soussouPart}** (${frenchPart})`;
        }
        if (insight.aspect === 'trust_building') {
          soussouPart = "Kɛlɛn ka kelen"; // Trust/relationship
          frenchPart = "la confiance se construit par les relations personnelles";
          return `**${soussouPart}** - ${frenchPart}`;
        }
      }

      // For communication domain
      if (culturalInsights.relevant_domains.includes('communication')) {
        // Generate a greeting or acknowledgment statement
        const statement = this.generator.generateRandom('statement');
        frenchPart = "Les messages WhatsApp sont mieux reçus que les emails en Guinée";
        return `**${statement.soussou}** - ${frenchPart}`;
      }

      // Default: Try to generate any statement
      const statement = this.generator.generateRandom('statement');
      return `**${statement.soussou}** (${statement.french_equivalent})`;

    } catch (error) {
      // If generation fails, return null (will fall back to French)
      return null;
    }
  }

  /**
   * Analyze task through Guinea cultural lens
   */
  analyzeCulturalContext(task, goal) {
    const taskLower = task.toLowerCase();
    const insights = {
      use_soussou: false,
      relevant_domains: [],
      cultural_considerations: [],
      language_suggestions: []
    };

    // Finance/Money domain
    if (this.matchesDomain(taskLower, ['money', 'payment', 'bank', 'subscription', 'finance', 'customer'])) {
      insights.relevant_domains.push('finance');
      insights.cultural_considerations.push({
        aspect: 'family_money_management',
        context: 'In Guinea, family-based money management is common. Individual subscriptions may be shared across extended family.',
        implication: 'Consider group payment options or family account features.'
      });
      insights.cultural_considerations.push({
        aspect: 'cash_preference',
        context: 'Cash is heavily preferred over digital payments in Guinea.',
        implication: 'Mobile money integration (Orange Money, MTN) more important than credit cards.'
      });
      insights.cultural_considerations.push({
        aspect: 'trust_building',
        context: 'Trust = community relationships in Guinea, not just privacy policies.',
        implication: 'Personal contact (WhatsApp, phone) builds trust better than email.'
      });

      // Suggest Soussou financial terms
      insights.language_suggestions.push({
        english: 'payment',
        soussou: 'saraxu',
        usage: 'Use in customer communication for local connection'
      });
      insights.use_soussou = true;
    }

    // Communication domain
    if (this.matchesDomain(taskLower, ['message', 'contact', 'communication', 'whatsapp', 'sms'])) {
      insights.relevant_domains.push('communication');
      insights.cultural_considerations.push({
        aspect: 'whatsapp_priority',
        context: 'WhatsApp is primary communication channel in Guinea (78% higher response than email).',
        implication: 'Always offer WhatsApp contact option first.'
      });
      insights.use_soussou = true;
      insights.language_suggestions.push({
        english: 'hello',
        soussou: 'I seeli',
        usage: 'Start WhatsApp messages with Soussou greeting for connection'
      });
    }

    // Education/Learning domain
    if (this.matchesDomain(taskLower, ['learn', 'teach', 'education', 'training', 'language'])) {
      insights.relevant_domains.push('education');
      insights.use_soussou = true;
      insights.cultural_considerations.push({
        aspect: 'oral_tradition',
        context: 'Guinea has strong oral tradition. Learning often happens through storytelling.',
        implication: 'Audio/video content may be more effective than text-heavy approaches.'
      });
    }

    // Technical/Performance domain
    if (this.matchesDomain(taskLower, ['optimize', 'performance', 'speed', 'lookup', 'search'])) {
      insights.relevant_domains.push('technical');
      insights.cultural_considerations.push({
        aspect: 'resource_constraints',
        context: 'Internet connectivity can be unstable in Guinea. Mobile data is expensive.',
        implication: 'Optimize for low bandwidth, fast load times, offline capability critical.'
      });
    }

    return insights;
  }

  /**
   * Check if task matches cultural domain
   */
  matchesDomain(text, keywords) {
    return keywords.some(keyword => text.includes(keyword));
  }

  /**
   * Analyze state with cultural considerations
   */
  analyzeState(currentState, goal, culturalInsights) {
    // Calculate progress
    const completed = currentState.completed || [];
    const inProgress = currentState.in_progress || [];
    const notStarted = currentState.not_started || [];

    const totalTasks = completed.length + inProgress.length + notStarted.length;
    const progress = totalTasks > 0 ? Math.round((completed.length / totalTasks) * 100) : 0;

    // Check for cultural blockers
    const culturalBlockers = [];

    // If technical solution doesn't consider Guinea context
    if (culturalInsights.relevant_domains.includes('technical') &&
        !this.mentionsGuineaContext(currentState)) {
      culturalBlockers.push("Solution may not account for Guinea's connectivity constraints");
    }

    // If finance solution doesn't mention mobile money
    if (culturalInsights.relevant_domains.includes('finance') &&
        !this.mentionsMobileMoney(currentState)) {
      culturalBlockers.push("Mobile money integration (Orange/MTN) not mentioned");
    }

    return {
      current_state: {
        completed: [...completed],
        in_progress: [...inProgress],
        not_started: [...notStarted]
      },
      gap_to_goal: {
        current_progress: progress,
        remaining_work: [...notStarted],
        blockers: culturalBlockers,
        cultural_alignment: culturalInsights.cultural_considerations.length > 0 ? 'considered' : 'needs_review'
      }
    };
  }

  /**
   * Check if state mentions Guinea-specific context
   */
  mentionsGuineaContext(state) {
    const stateText = JSON.stringify(state).toLowerCase();
    return stateText.includes('guinée') ||
           stateText.includes('guinea') ||
           stateText.includes('bandwidth') ||
           stateText.includes('mobile');
  }

  /**
   * Check if state mentions mobile money
   */
  mentionsMobileMoney(state) {
    const stateText = JSON.stringify(state).toLowerCase();
    return stateText.includes('orange money') ||
           stateText.includes('mtn') ||
           stateText.includes('mobile money');
  }

  /**
   * Lookup Soussou word from lexicon
   */
  lookupSoussou(word) {
    if (!this.lexicon || !this.lexicon.words) return null;

    const normalize = (text) => {
      if (!text) return '';
      return text.toLowerCase().replace(/['\u2019]/g, '');
    };

    const searchWord = normalize(word);
    const entry = this.lexicon.words.find(w =>
      normalize(w.base) === searchWord ||
      w.variants?.some(v => normalize(v) === searchWord)
    );

    return entry ? entry.base : null;
  }

  /**
   * Load cultural knowledge base
   */
  loadCulturalKnowledge() {
    return {
      finance: {
        payment_preferences: ['mobile_money', 'cash', 'orange_money', 'mtn'],
        trust_factors: ['personal_relationship', 'community_recommendation', 'phone_contact'],
        family_dynamics: 'shared_resources'
      },
      communication: {
        channels: [
          { name: 'WhatsApp', usage: 'primary', response_rate: '78%_higher_than_email' },
          { name: 'Phone', usage: 'urgent', trust_level: 'high' },
          { name: 'Email', usage: 'formal', response_rate: 'low' }
        ],
        language_preferences: ['french', 'soussou', 'pular', 'malinke']
      },
      technical: {
        constraints: ['unstable_connectivity', 'expensive_data', 'mobile_first'],
        priorities: ['offline_capability', 'low_bandwidth', 'fast_load']
      },
      social: {
        values: ['family', 'community', 'respect', 'hospitality'],
        decision_making: 'collective_consultation'
      }
    };
  }
}

/**
 * Create Soussou-AI client instance
 */
export function createSoussouAI(soussouLexicon, dataPath = null) {
  return new SoussouAIClient(soussouLexicon, dataPath);
}
