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

// Gemini API
let genAI, gemini;
let geminiError = null;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || 'AIzaSyCV-1WfnuFLmxw5ib_fuVcO2KLGjUXLpuk';
try {
  const { GoogleGenerativeAI } = require('@google/generative-ai');
  genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
  gemini = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
  console.log('Gemini 1.5 Flash initialized successfully');
} catch (e) {
  geminiError = e.message;
  console.error('Gemini init error:', e.message);
}

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
          const prompt = `You are a Susu language assistant. User said: "${message}". Translation: "${translation.translation}" (${(translation.confidence * 100).toFixed(0)}% confidence). Give a brief helpful response and 2 phrase suggestions. Respond in JSON: {"response": "text", "susu": "susu translation", "suggestions": [{"susu": "phrase", "english": "meaning"}], "pronunciation": "tip or null"}`;

          const result = await gemini.generateContent(prompt);
          const text = result.response.text();
          const match = text.match(/\{[\s\S]*\}/);
          if (match) {
            aiResponse = JSON.parse(match[0]);
          }
        } catch (e) {
          console.error('Gemini error:', e.message);
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
