/**
 * SOUSSOU AI - Backend Server
 *
 * Wraps Guinius v2 translation engine with:
 * - REST API for translation
 * - Gemini integration for conversational AI
 * - Whisper-compatible audio transcription endpoint
 */

import express from 'express';
import cors from 'cors';
import { GoogleGenerativeAI } from '@google/generative-ai';
import OpenAI from 'openai';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load Guinius engine from soussou-engine
const GUINIUS_PATH = path.join(__dirname, '../../soussou-engine/src');

let guiniusV2, susuAI, conversation, sentenceGenerator;

try {
  guiniusV2 = require(path.join(GUINIUS_PATH, 'guinius_v2.js'));
  susuAI = require(path.join(GUINIUS_PATH, 'susu_ai.js'));
  conversation = require(path.join(GUINIUS_PATH, 'conversation.js'));
  sentenceGenerator = require(path.join(GUINIUS_PATH, 'sentence_generator.js'));
  console.log('✓ Guinius engine loaded');
} catch (e) {
  console.error('Failed to load Guinius:', e.message);
}

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Environment
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || 'AIzaSyCV-1WfnuFLmxw5ib_fuVcO2KLGjUXLpuk';
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const PORT = process.env.PORT || 3002;

// Initialize AI clients
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const gemini = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

let openai;
if (OPENAI_API_KEY) {
  openai = new OpenAI({ apiKey: OPENAI_API_KEY });
  console.log('✓ Whisper (OpenAI) configured');
}

// Session storage for conversations
const sessions = new Map();

// ============================================================================
// ENDPOINTS
// ============================================================================

/**
 * Health check
 */
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    engine: 'Guinius v2',
    capabilities: {
      translation: !!guiniusV2,
      conversation: !!conversation,
      gemini: !!gemini,
      whisper: !!openai
    },
    stats: guiniusV2?.getStats?.() || null
  });
});

/**
 * Translate text
 * POST /api/translate
 * Body: { text, from?, to?, sessionId? }
 */
app.post('/api/translate', async (req, res) => {
  try {
    const { text, from = 'auto', to, sessionId } = req.body;

    if (!text) {
      return res.status(400).json({ error: 'Text is required' });
    }

    // Use Guinius v2 translation pipeline
    const result = await guiniusV2.translate(text, { from, to });

    // If low confidence, enhance with Gemini
    if (result.confidence < 0.7 && gemini) {
      const enhanced = await enhanceWithGemini(text, result);
      result.geminiEnhanced = enhanced;
    }

    res.json(result);
  } catch (error) {
    console.error('Translation error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Chat conversation
 * POST /api/chat
 * Body: { message, sessionId?, mode? }
 */
app.post('/api/chat', async (req, res) => {
  try {
    const { message, sessionId = 'default', mode = 'learn' } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Get or create session
    if (!sessions.has(sessionId)) {
      sessions.set(sessionId, {
        history: [],
        context: {},
        created: new Date()
      });
    }
    const session = sessions.get(sessionId);

    // Detect language
    const lang = guiniusV2.detectLanguage(message);

    // Get translation from Guinius
    const translation = await guiniusV2.translate(message, { from: lang });

    // Generate AI response using Gemini
    const aiResponse = await generateConversation(message, translation, session, mode);

    // Update session history
    session.history.push({
      user: message,
      lang,
      translation: translation.translation,
      ai: aiResponse.response,
      timestamp: new Date()
    });

    // Keep only last 20 messages
    if (session.history.length > 20) {
      session.history = session.history.slice(-20);
    }

    res.json({
      input: message,
      inputLang: lang,
      translation: translation.translation,
      translationSource: translation.source,
      confidence: translation.confidence,
      response: aiResponse.response,
      responseSusu: aiResponse.susu,
      suggestions: aiResponse.suggestions,
      pronunciation: aiResponse.pronunciation
    });
  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Speech-to-text with Whisper
 * POST /api/transcribe
 * Body: { audio: base64 }
 */
app.post('/api/transcribe', async (req, res) => {
  try {
    const { audio } = req.body;

    if (!openai) {
      return res.status(503).json({
        error: 'Whisper not configured',
        hint: 'Set OPENAI_API_KEY environment variable'
      });
    }

    // Convert base64 to buffer
    const buffer = Buffer.from(audio, 'base64');

    // Create a file-like object for Whisper
    const file = new File([buffer], 'audio.webm', { type: 'audio/webm' });

    const transcription = await openai.audio.transcriptions.create({
      file,
      model: 'whisper-1',
      language: 'en' // Can also try 'fr' for French
    });

    res.json({
      text: transcription.text,
      language: 'detected'
    });
  } catch (error) {
    console.error('Transcription error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get conversation suggestions
 * POST /api/suggest
 * Body: { context, count? }
 */
app.post('/api/suggest', async (req, res) => {
  try {
    const { context, count = 5 } = req.body;

    // Get suggestions from conversation module
    const suggestions = conversation?.getSuggestions?.(context) || [];

    // If not enough, generate with Gemini
    if (suggestions.length < count && gemini) {
      const generated = await generateSuggestions(context, count - suggestions.length);
      suggestions.push(...generated);
    }

    res.json({ suggestions });
  } catch (error) {
    console.error('Suggestion error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get engine statistics
 */
app.get('/api/stats', (req, res) => {
  const stats = guiniusV2?.getStats?.() || {};
  res.json(stats);
});

// ============================================================================
// AI HELPERS
// ============================================================================

async function enhanceWithGemini(text, guiniusResult) {
  try {
    const prompt = `You are helping translate to Susu (Soussou), a West African language spoken in Guinea.

Input text: "${text}"
Guinius translation: "${guiniusResult.translation || 'unknown'}"
Confidence: ${(guiniusResult.confidence * 100).toFixed(0)}%

If the translation looks incomplete or uncertain, suggest a better translation.
If there are gaps (words in brackets or French/English words), try to find Susu equivalents.

Key Susu patterns:
- SOV word order (Subject-Object-Verb)
- Verbs end with -ma (infinitive), -fe (progressive), -xi (completed)
- Common words: n (I), i (you), a (he/she), woma (is/are), bara (has/have)

Respond in JSON format:
{
  "suggested": "improved susu translation",
  "explanation": "brief explanation",
  "confidence": 0.0-1.0
}`;

    const result = await gemini.generateContent(prompt);
    const response = result.response.text();

    // Parse JSON from response
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    return { suggested: null, explanation: response };
  } catch (e) {
    console.error('Gemini enhancement error:', e.message);
    return null;
  }
}

async function generateConversation(message, translation, session, mode) {
  try {
    // Build context from session history
    const historyContext = session.history.slice(-5).map(h =>
      `User: ${h.user}\nAI: ${h.ai}`
    ).join('\n');

    const prompt = `You are a Susu language learning assistant. The user is learning Susu (Soussou), spoken in Guinea.

User message: "${message}"
Translation to Susu: "${translation.translation}"
Confidence: ${(translation.confidence * 100).toFixed(0)}%
Source: ${translation.source}

Recent conversation:
${historyContext || 'New conversation'}

Mode: ${mode} (learn = teach vocabulary, chat = natural conversation)

Respond naturally while helping them learn Susu. Include:
1. A helpful response in English
2. The Susu translation of your response
3. 2-3 suggested phrases they could say next (in Susu with English)
4. Pronunciation tip if relevant

Respond in JSON:
{
  "response": "your helpful response in English",
  "susu": "your response translated to Susu",
  "suggestions": [
    {"susu": "phrase", "english": "meaning"},
    {"susu": "phrase", "english": "meaning"}
  ],
  "pronunciation": "tip for any tricky sounds"
}`;

    const result = await gemini.generateContent(prompt);
    const response = result.response.text();

    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }

    return {
      response: response,
      susu: translation.translation,
      suggestions: [],
      pronunciation: null
    };
  } catch (e) {
    console.error('Gemini conversation error:', e.message);
    return {
      response: `I understood: "${message}". In Susu: "${translation.translation}"`,
      susu: translation.translation,
      suggestions: [],
      pronunciation: null
    };
  }
}

async function generateSuggestions(context, count) {
  try {
    const prompt = `Generate ${count} common Susu phrases for the context: "${context}"

Each phrase should be practical for someone learning Susu in Guinea.

Respond in JSON array:
[
  {"susu": "phrase in susu", "english": "English meaning"},
  ...
]`;

    const result = await gemini.generateContent(prompt);
    const response = result.response.text();

    const jsonMatch = response.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    return [];
  } catch (e) {
    console.error('Suggestion generation error:', e.message);
    return [];
  }
}

// ============================================================================
// STATIC FILES (Production)
// ============================================================================

// Serve frontend in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../frontend/dist')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
  });
}

// ============================================================================
// START SERVER
// ============================================================================

app.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════════════════╗
║                    SOUSSOU AI SERVER                       ║
║                                                           ║
║  "The First AI That Speaks Susu"                          ║
╠═══════════════════════════════════════════════════════════╣
║  Port: ${PORT}                                              ║
║  Engine: Guinius v2                                       ║
║  Gemini: ${gemini ? 'Connected' : 'Not configured'}                                    ║
║  Whisper: ${openai ? 'Connected' : 'Not configured (set OPENAI_API_KEY)'}               ║
╠═══════════════════════════════════════════════════════════╣
║  Endpoints:                                               ║
║    GET  /api/health     - Health check                    ║
║    POST /api/translate  - Translate text                  ║
║    POST /api/chat       - Conversation                    ║
║    POST /api/transcribe - Speech-to-text                  ║
║    POST /api/suggest    - Get phrase suggestions          ║
║    GET  /api/stats      - Engine statistics               ║
╚═══════════════════════════════════════════════════════════╝
  `);
});

export default app;
