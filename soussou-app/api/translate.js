// Vercel Serverless Function: /api/translate
import path from 'path';
import { createRequire } from 'module';
import { GoogleGenerativeAI } from '@google/generative-ai';

const require = createRequire(import.meta.url);

// Load Guinius engine
let guiniusV2;
try {
  const GUINIUS_PATH = path.join(process.cwd(), '../soussou-engine/src');
  guiniusV2 = require(path.join(GUINIUS_PATH, 'guinius_v2.js'));
} catch (e) {
  console.error('Guinius load error:', e.message);
}

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || 'AIzaSyCV-1WfnuFLmxw5ib_fuVcO2KLGjUXLpuk';
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const gemini = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { text, from = 'auto', to } = req.body;

    if (!text) {
      return res.status(400).json({ error: 'Text is required' });
    }

    // Use Guinius v2 translation pipeline
    const result = await guiniusV2.translate(text, { from, to });

    // If low confidence, enhance with Gemini
    if (result.confidence < 0.7 && gemini) {
      try {
        const enhanced = await enhanceWithGemini(text, result);
        result.geminiEnhanced = enhanced;
      } catch (e) {
        console.error('Gemini enhancement error:', e.message);
      }
    }

    return res.status(200).json(result);
  } catch (error) {
    console.error('Translation error:', error);
    return res.status(500).json({ error: error.message });
  }
}

async function enhanceWithGemini(text, guiniusResult) {
  const prompt = `You are helping translate to Susu (Soussou), a West African language spoken in Guinea.

Input text: "${text}"
Guinius translation: "${guiniusResult.translation || 'unknown'}"
Confidence: ${(guiniusResult.confidence * 100).toFixed(0)}%

Key Susu patterns:
- SOV word order (Subject-Object-Verb)
- Verbs end with -ma (infinitive), -fe (progressive), -xi (completed)

Respond in JSON format:
{
  "suggested": "improved susu translation or null",
  "explanation": "brief explanation",
  "confidence": 0.0-1.0
}`;

  const result = await gemini.generateContent(prompt);
  const response = result.response.text();
  const jsonMatch = response.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    return JSON.parse(jsonMatch[0]);
  }
  return null;
}

export const config = {
  api: {
    bodyParser: true,
  },
};
