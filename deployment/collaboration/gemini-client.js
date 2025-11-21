/**
 * Gemini API Client
 * Handles communication with Google Gemini API
 *
 * REQUIRES: GEMINI_API_KEY environment variable
 * Get key from: https://ai.google.dev/
 */

import { GoogleGenerativeAI } from '@google/generative-ai';

export class GeminiClient {
  constructor(apiKey = process.env.GEMINI_API_KEY) {
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY environment variable is required');
    }

    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({
      model: 'gemini-2.0-flash-exp'
    });
  }

  /**
   * Generate Gemini's response in a collaboration
   */
  async generateResponse(context) {
    const prompt = this.buildPrompt(context);

    try {
      const result = await this.model.generateContent(prompt);
      const text = result.response.text();

      // Try to parse as JSON (expected format)
      try {
        return JSON.parse(text);
      } catch {
        // Fallback: Return as unstructured response
        return {
          message: text,
          state_analysis: null,
          parse_error: true
        };
      }
    } catch (error) {
      console.error('[GeminiClient] API Error:', error);
      throw new Error(`Gemini API error: ${error.message}`);
    }
  }

  /**
   * Build prompt for Gemini
   */
  buildPrompt(context) {
    const { task, goal, conversation_history, current_state, previous_message } = context;

    return `You are Gemini, collaborating with ZION (Claude) on the following task:

**Task:** ${task}
**Goal:** ${goal}

**Current State:**
- Completed: ${current_state.completed.join(', ') || 'None'}
- In Progress: ${current_state.in_progress.join(', ') || 'None'}
- Not Started: ${current_state.not_started.join(', ') || 'None'}
- Progress: ${current_state.progress || 0}%

**Conversation History:**
${conversation_history.map((turn, i) => `Turn ${i + 1} (${turn.from}): ${turn.message}`).join('\n')}

**ZION's Last Message:**
${previous_message || 'None yet'}

---

Your turn to contribute. Respond with JSON in this format:

\`\`\`json
{
  "message": "Your contribution to the task (what you're doing, what you built, what you discovered)",
  "state_analysis": {
    "past_state": {
      "completed": ["..."],
      "in_progress": ["..."],
      "not_started": ["..."]
    },
    "current_state": {
      "completed": ["..."],  // Add what YOU completed
      "in_progress": ["..."], // What YOU're working on
      "not_started": ["..."]  // What's left
    },
    "gap_to_goal": {
      "current_progress": 0-100,  // Your estimate of overall progress
      "remaining_work": ["..."],
      "blockers": []
    }
  },
  "artifacts": [
    {
      "type": "code|design|doc",
      "description": "...",
      "content": "..."
    }
  ],
  "pass_to": "zion-cli",  // Or "zion-online" or null for round-robin
  "request_stop": false    // Set to true if goal is complete
}
\`\`\`

Guidelines:
1. **Be specific** - Don't just say "I'll work on X", actually contribute something concrete
2. **Track state** - Update what's completed, what's next
3. **Coordinate** - Build on what ZION did, don't duplicate
4. **Request stop** - When goal is 100% achieved
5. **Add artifacts** - Code, designs, documentation you created

Your response:`;
  }

  /**
   * Health check
   */
  async healthCheck() {
    try {
      const result = await this.model.generateContent('Respond with: OK');
      return { status: 'ok', response: result.response.text() };
    } catch (error) {
      return { status: 'error', error: error.message };
    }
  }
}
