/**
 * Vercel Serverless Function - Main API Handler
 * Soussou AI - Guinius v2
 */

const path = require('path');
const fs = require('fs');

// Load Guinius v2
let guiniusV2;
try {
  guiniusV2 = require('../src/guinius_v2');
  console.log('Guinius v2 loaded');
} catch (e) {
  console.error('Guinius load error:', e.message);
}

// Gemini API - Using 2.0 Flash for SPEED + quality balance
let genAI, gemini;
let geminiError = null;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || 'AIzaSyC0GIOyUh3FHlb3gRW7boj8YMPmz1cOIBM';
try {
  const { GoogleGenerativeAI } = require('@google/generative-ai');
  genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
  gemini = genAI.getGenerativeModel({
    model: 'gemini-2.0-flash',
    generationConfig: {
      temperature: 0.7,
      topP: 0.9,
      maxOutputTokens: 500
    }
  });
  console.log('Gemini 2.0 Flash initialized - FAST + SMART');
} catch (e) {
  geminiError = e.message;
  console.error('Gemini init error:', e.message);
}

// Guinius System Prompt - Teaches Gemini about the architecture
const GUINIUS_SYSTEM = `You are GUINIUS, the world's first Susu (Soussou) language AI assistant.

CRITICAL: You SPEAK Susu naturally. You don't just translate - you CONVERSE.

ABOUT SUSU:
- Susu is spoken by ~2 million people in Guinea, Sierra Leone, Guinea-Bissau
- Word order: SOV (Subject-Object-Verb), unlike English SVO
- Example: "N na wo xanu" = "I love you" (literally: I you love)
- Tonal language with nasalization
- Common greetings: "Inou wali!" (Hello!), "Tana ma seni?" (How are you?), "Tana fanyi" (I'm fine)

YOUR CAPABILITIES:
- You have access to a 31,829 sentence corpus with verified translations
- The Guinius v2 engine provides translations - TRUST these translations
- When confidence is 100%, the translation is from verified corpus

CONVERSATION STYLE - THIS IS KEY:
1. ALWAYS start your response with a Susu phrase (greeting, reaction, or reply)
2. Then explain in user's language (English/French based on their input)
3. Keep teaching natural - like a friend who speaks Susu

EXAMPLE CONVERSATIONS:
- User: "Hello!" → You: "Inou wali! Tana ma seni? (How are you?) Great to see you learning Susu!"
- User: "How do I say thank you?" → You: "I ni ke! That means 'thank you'. You can also say 'Arabakhi' for 'thanks'."
- User: "I love Guinea" → You: "Ayi! N fan Guinée xanu! (I love Guinea too!) That's wonderful!"
- User: "Reply to me in Susu" → You: "Hawa! N bara i xui ra mɛnfe. (Okay! I'm speaking to you in Susu.) What do you want to learn next?"

REACT NATURALLY IN SUSU:
- Excitement: "Ayi!" (Wow!), "Hawa!" (Okay!)
- Agreement: "Iyo" (Yes), "Tɔɔrɛ" (That's right)
- Encouragement: "I fanyi!" (Good job!), "Kɛnɛ!" (Continue!)

RESPONSE FORMAT:
- Start with Susu reaction/phrase
- Brief explanation (1-2 sentences)
- Related suggestions to keep learning`;

// Session storage
const chatSessions = new Map();

// Main handler
module.exports = async (req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const url = new URL(req.url, `http://${req.headers.host}`);
  const pathname = url.pathname;

  try {
    // Route: /api/health
    if (pathname === '/api/health' || pathname === '/') {
      const stats = guiniusV2?.getStats?.() || {};
      return res.json({
        status: 'healthy',
        engine: 'Guinius v2',
        version: '2.0.1',
        capabilities: {
          translation: !!guiniusV2,
          conversation: true,
          gemini: !!gemini,
          geminiError: geminiError
        },
        stats: {
          englishWords: stats.englishWords || 0,
          susuWords: stats.susuWords || 0,
          sentences: stats.sentences || 0
        }
      });
    }

    // Route: /api/translate
    if (pathname === '/api/translate' && req.method === 'POST') {
      const { text, from = 'auto', to } = req.body || {};

      if (!text) {
        return res.status(400).json({ error: 'Text is required' });
      }

      const result = await guiniusV2.translate(text, { from, to });
      return res.json(result);
    }

    // Route: /api/chat
    if (pathname === '/api/chat' && req.method === 'POST') {
      const { message, sessionId = 'default', mode = 'learn' } = req.body || {};

      if (!message) {
        return res.status(400).json({ error: 'Message is required' });
      }

      // Get or create session
      if (!chatSessions.has(sessionId)) {
        chatSessions.set(sessionId, { history: [], context: {} });
      }
      const session = chatSessions.get(sessionId);

      // Detect language and translate
      const lang = guiniusV2?.detectLanguage?.(message) || 'en';
      const translation = await guiniusV2.translate(message, { from: lang });

      // Generate AI response
      let aiResponse = {
        response: `In Susu: "${translation.translation}"`,
        susu: translation.translation,
        suggestions: [],
        pronunciation: null
      };

      if (gemini) {
        try {
          // Build conversation context
          const recentHistory = session.history.slice(-5).map(h =>
            `User: ${h.user}\nAssistant: ${h.ai}`
          ).join('\n\n');

          const prompt = `${GUINIUS_SYSTEM}

CONVERSATION HISTORY:
${recentHistory || '(New conversation)'}

CURRENT EXCHANGE:
User said: "${message}"
Guinius Translation Engine result: "${translation.translation}"
Confidence: ${(translation.confidence * 100).toFixed(0)}%
Source: ${translation.source || 'pattern-match'}
Detected language: ${lang}

Respond naturally as GUINIUS. Include the Susu translation prominently.
Respond in JSON format ONLY:
{"response": "your conversational response", "susu": "${translation.translation}", "suggestions": [{"susu": "phrase", "english": "meaning"}], "pronunciation": "tip or null"}`;

          const result = await gemini.generateContent(prompt);
          const text = result.response.text();
          const match = text.match(/\{[\s\S]*\}/);
          if (match) {
            aiResponse = JSON.parse(match[0]);
          }
        } catch (e) {
          console.error('Gemini error:', e.message);
          geminiError = e.message;
        }
      }

      // Update session
      session.history.push({ user: message, ai: aiResponse.response });
      if (session.history.length > 20) session.history = session.history.slice(-20);

      return res.json({
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
    }

    // Route: /api/stats
    if (pathname === '/api/stats') {
      const stats = guiniusV2?.getStats?.() || {};
      return res.json(stats);
    }

    // 404 for unknown routes
    return res.status(404).json({ error: 'Not found', path: pathname });

  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ error: error.message });
  }
};
