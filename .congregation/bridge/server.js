/**
 * ZION Unified Backend - Integrated Version
 *
 * Features:
 * 1. Congregation Bridge (Multi-AI messaging via GitHub)
 * 2. Soussou Language API (8,978 words, living language system)
 * 3. Multi-AI Collaboration (Real-time coordination with state analysis)
 *
 * Integration preserves ALL existing functionality while adding collaboration layer
 */

import express from 'express';
import { Octokit } from 'octokit';
import crypto from 'crypto';
import dotenv from 'dotenv';
import cors from 'cors';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Import collaboration routes
import collaborateRoutes from './collaboration/collaborate-routes.js';
import { GeminiClient } from './collaboration/gemini-client.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// ============== CONFIGURATION ==============

const CONFIG = {
  github: {
    token: process.env.GITHUB_TOKEN,
    owner: process.env.GITHUB_OWNER || 'dashguinee',
    repo: process.env.GITHUB_REPO || 'ZION',
    branch: process.env.GITHUB_BRANCH || 'main'
  },
  auth: {
    chatgptToken: process.env.CHATGPT_SERVICE_TOKEN,
    geminiToken: process.env.GEMINI_SERVICE_TOKEN,
    zionToken: process.env.ZION_SERVICE_TOKEN
  }
};

const octokit = new Octokit({ auth: CONFIG.github.token });

// ============== MIDDLEWARE ==============

app.use(cors());
app.use(express.json({ limit: '2mb' }));

// Authentication middleware
function authenticateRequest(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid authorization header' });
  }

  const token = authHeader.substring(7);
  const validTokens = Object.values(CONFIG.auth).filter(Boolean);

  if (!validTokens.includes(token)) {
    return res.status(403).json({ error: 'Invalid token' });
  }

  next();
}

// ============== LOAD SOUSSOU DATA ==============

let soussouData = { lexicon: { words: [] } };

try {
  const lexiconPath = join(__dirname, 'soussou-engine', 'data', 'lexicon.json');
  const lexiconData = JSON.parse(readFileSync(lexiconPath, 'utf8'));

  // Handle both array and object formats
  soussouData.lexicon = Array.isArray(lexiconData)
    ? { words: lexiconData }
    : lexiconData;

  console.log(`✅ Loaded Soussou lexicon: ${soussouData.lexicon.words?.length || 0} words`);
} catch (error) {
  console.error('⚠️  Failed to load Soussou lexicon:', error.message);
}

// Load other Soussou data files
try {
  const variantMappingsPath = join(__dirname, 'soussou-engine', 'data', 'variant_mappings.json');
  soussouData.variantMappings = JSON.parse(readFileSync(variantMappingsPath, 'utf8'));
} catch (error) {
  console.warn('⚠️  Variant mappings not loaded');
}

try {
  const generationTemplatesPath = join(__dirname, 'soussou-engine', 'data', 'generation_templates.json');
  soussouData.templates = JSON.parse(readFileSync(generationTemplatesPath, 'utf8'));
} catch (error) {
  console.warn('⚠️  Generation templates not loaded');
}

// ============== HELPER FUNCTIONS ==============

// Soussou normalization (with null check fix)
function normalize(text) {
  if (!text || typeof text !== 'string') return '';
  return text
    .toLowerCase()
    .replace(/['\u2019]/g, '')
    .replace(/[àâä]/g, 'a')
    .replace(/[éèêë]/g, 'e')
    .replace(/[îï]/g, 'i')
    .replace(/[ôö]/g, 'o')
    .replace(/[ùûü]/g, 'u')
    .replace(/(.)\1+/g, '$1')
    .replace(/h$/, '')
    .trim();
}

function stringSimilarity(a, b) {
  if (a === b) return 1;
  if (!a || !b) return 0;
  const longer = a.length > b.length ? a : b;
  const shorter = a.length > b.length ? b : a;
  if (longer.length === 0) return 1;
  let matches = 0;
  for (let i = 0; i < shorter.length; i++) {
    if (longer.includes(shorter[i])) matches++;
  }
  return matches / longer.length;
}

function findSimilarWords(word, limit = 5) {
  const normalized = normalize(word);
  const words = soussouData.lexicon.words || [];
  const scored = words.map(w => ({
    word: w.base,  // FIXED: use w.base instead of w.soussou
    score: stringSimilarity(normalized, normalize(w.base))  // FIXED
  }));
  return scored
    .filter(s => s.score > 0.3)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(s => s.word);
}

function generateId(prefix = 'msg') {
  return `${prefix}_${Date.now().toString(36)}${crypto.randomBytes(4).toString('hex')}`;
}

// ============== CONGREGATION ROUTES ==============

// POST /congregation/commit - Commit message to GitHub
app.post('/congregation/commit', authenticateRequest, async (req, res) => {
  try {
    const { author, content, message_id } = req.body;

    if (!author || !content) {
      return res.status(400).json({ error: 'author and content are required' });
    }

    const filePath = '.congregation/thread.md';
    const timestamp = new Date().toISOString();
    const id = message_id || generateId('msg');

    let currentContent = '';
    try {
      const { data } = await octokit.rest.repos.getContent({
        owner: CONFIG.github.owner,
        repo: CONFIG.github.repo,
        path: filePath,
        ref: CONFIG.github.branch
      });
      currentContent = Buffer.from(data.content, 'base64').toString('utf8');
    } catch (error) {
      if (error.status !== 404) throw error;
    }

    const newMessage = `\n\n---\n**${author}** (${timestamp})\nID: ${id}\n\n${content}\n`;
    const updatedContent = currentContent + newMessage;

    const commitMessage = `Add message from ${author}`;
    await octokit.rest.repos.createOrUpdateFileContents({
      owner: CONFIG.github.owner,
      repo: CONFIG.github.repo,
      path: filePath,
      message: commitMessage,
      content: Buffer.from(updatedContent).toString('base64'),
      branch: CONFIG.github.branch,
      sha: currentContent ? (await octokit.rest.repos.getContent({
        owner: CONFIG.github.owner,
        repo: CONFIG.github.repo,
        path: filePath,
        ref: CONFIG.github.branch
      })).data.sha : undefined
    });

    res.json({
      status: 'ok',
      message_id: id,
      commit_message: commitMessage
    });
  } catch (error) {
    console.error('Error committing to congregation:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /congregation/thread - Get conversation thread
app.get('/congregation/thread', async (req, res) => {
  try {
    const filePath = '.congregation/thread.md';
    const { data } = await octokit.rest.repos.getContent({
      owner: CONFIG.github.owner,
      repo: CONFIG.github.repo,
      path: filePath,
      ref: CONFIG.github.branch
    });

    const content = Buffer.from(data.content, 'base64').toString('utf8');
    const messages = content.split('---').filter(m => m.trim()).map(m => {
      const lines = m.trim().split('\n');
      const headerMatch = lines[0].match(/\*\*(.+?)\*\* \((.+?)\)/);
      const idMatch = lines[1]?.match(/ID: (.+)/);
      return {
        author: headerMatch?.[1] || 'unknown',
        timestamp: headerMatch?.[2] || '',
        id: idMatch?.[1] || '',
        content: lines.slice(2).join('\n').trim()
      };
    });

    res.json({ messages });
  } catch (error) {
    console.error('Error fetching thread:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============== SOUSSOU API ROUTES ==============

// GET /api/soussou/lookup - Look up a word
app.get('/api/soussou/lookup', (req, res) => {
  try {
    const { word } = req.query;
    if (!word) {
      return res.status(400).json({ error: 'word parameter required' });
    }

    const searchWord = normalize(word);
    const entry = soussouData.lexicon.words?.find(w =>
      normalize(w.base) === searchWord ||  // FIXED: use w.base
      w.variants?.some(v => normalize(v) === searchWord)
    );

    if (entry) {
      res.json({
        found: true,
        word: entry.base,  // FIXED: use w.base
        normalized: searchWord,
        english: entry.english,
        french: entry.french,
        category: entry.category,
        variants: entry.variants || [],
        frequency: entry.frequency || 0,
        examples: entry.examples || []
      });
    } else {
      const suggestions = findSimilarWords(searchWord, 5);
      res.status(404).json({
        found: false,
        word: word,
        suggestions: suggestions,
        message: 'Word not found. Would you like to contribute it?'
      });
    }
  } catch (error) {
    console.error('Error in lookup:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/soussou/stats - Get lexicon statistics
app.get('/api/soussou/stats', (req, res) => {
  try {
    const words = soussouData.lexicon.words || [];
    const categories = {};
    words.forEach(w => {
      const cat = w.category || 'unknown';
      categories[cat] = (categories[cat] || 0) + 1;
    });

    res.json({
      total_words: words.length,
      total_variants: Object.keys(soussouData.variantMappings?.variant_to_base || {}).length,
      total_templates: Object.keys(soussouData.templates?.templates || {}).length,
      categories: categories
    });
  } catch (error) {
    console.error('Error getting stats:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/soussou/translate - Translate text
app.post('/api/soussou/translate', (req, res) => {
  try {
    const { text, from, to } = req.body;

    if (!text || !from || !to) {
      return res.status(400).json({ error: 'text, from, and to parameters required' });
    }

    // Simple translation placeholder
    res.json({
      original: text,
      translation: `[Translation: ${text}]`,
      confidence: 0.5,
      note: 'Full translation engine coming soon'
    });
  } catch (error) {
    console.error('Error translating:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/soussou/contribute - Add new word to lexicon
app.post('/api/soussou/contribute', (req, res) => {
  try {
    const { word, variants, english, french, category, example_sentence, notes } = req.body;

    if (!word || !english) {
      return res.status(400).json({ error: 'word and english parameters required' });
    }

    const contribution = {
      id: `contrib_${Date.now().toString(36)}${Math.random().toString(36).substr(2, 5)}`,
      timestamp: new Date().toISOString(),
      status: 'pending_review',
      word: word,
      variants: variants || [],
      english: english,
      french: french || '',
      category: category || 'unknown',
      example_sentence: example_sentence || '',
      notes: notes || ''
    };

    // Add to lexicon in memory (will persist until server restart)
    if (!soussouData.contributions) {
      soussouData.contributions = [];
    }
    soussouData.contributions.push(contribution);

    // Also add to lexicon words for immediate availability
    soussouData.lexicon.words.push({
      soussou: word,
      english: english,
      french: french || '',
      category: category || 'unknown',
      variants: variants || [],
      frequency: 1,
      examples: example_sentence ? [example_sentence] : []
    });

    console.log(`📝 New contribution: "${word}" = "${english}"`);

    res.status(201).json({
      id: contribution.id,
      status: contribution.status,
      message: 'Thank you! Your contribution has been added.',
      word: word
    });
  } catch (error) {
    console.error('Error adding contribution:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/corpus/add-sentence - Add new sentence to corpus
app.post('/api/corpus/add-sentence', (req, res) => {
  try {
    const { soussou, french, english, verified } = req.body;

    if (!soussou) {
      return res.status(400).json({ error: 'soussou parameter required' });
    }

    const sentence = {
      id: `sent_${Date.now().toString(36)}${Math.random().toString(36).substr(2, 5)}`,
      timestamp: new Date().toISOString(),
      soussou: soussou,
      french: french || '',
      english: english || '',
      verified: verified || false
    };

    // Add to corpus in memory
    if (!soussouData.corpus) {
      soussouData.corpus = [];
    }
    soussouData.corpus.push(sentence);

    console.log(`📝 New sentence: "${soussou}"`);

    res.status(201).json({
      success: true,
      sentence_id: sentence.id,
      message: 'Sentence added to corpus!'
    });
  } catch (error) {
    console.error('Error adding sentence:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/corpus/search - Search corpus
app.get('/api/corpus/search', (req, res) => {
  try {
    const { query } = req.query;

    if (!query) {
      return res.status(400).json({ error: 'query parameter required' });
    }

    const corpus = soussouData.corpus || [];
    const results = corpus.filter(s =>
      s.soussou?.toLowerCase().includes(query.toLowerCase()) ||
      s.french?.toLowerCase().includes(query.toLowerCase()) ||
      s.english?.toLowerCase().includes(query.toLowerCase())
    );

    res.json({
      results: results,
      count: results.length
    });
  } catch (error) {
    console.error('Error searching corpus:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/pattern/detect - Detect grammar patterns
app.post('/api/pattern/detect', (req, res) => {
  try {
    const { sentence } = req.body;

    if (!sentence) {
      return res.status(400).json({ error: 'sentence parameter required' });
    }

    // Simple pattern detection
    const words = sentence.split(/\s+/);
    const patterns = words.map(word => {
      const entry = soussouData.lexicon.words?.find(w =>
        w.soussou?.toLowerCase() === word.toLowerCase()
      );
      return {
        word: word,
        category: entry?.category || 'unknown',
        found: !!entry
      };
    });

    res.json({
      sentence: sentence,
      patterns: patterns,
      confidence: patterns.filter(p => p.found).length / patterns.length
    });
  } catch (error) {
    console.error('Error detecting pattern:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============== COLLABORATION API ROUTES ==============

app.use('/api/collaborate', collaborateRoutes);

// Optional: Initialize Gemini client if API key is available
let geminiClient = null;
try {
  if (process.env.GEMINI_API_KEY) {
    geminiClient = new GeminiClient(process.env.GEMINI_API_KEY);
    console.log('✅ Gemini client initialized');
  } else {
    console.log('⚠️  GEMINI_API_KEY not set - Gemini features disabled');
  }
} catch (error) {
  console.error('⚠️  Gemini client initialization failed:', error.message);
}

// ============== HEALTH CHECK ==============

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'zion-unified-backend',
    timestamp: new Date().toISOString(),
    features: {
      congregation: true,
      soussou: soussouData.lexicon.words?.length > 0,
      collaboration: true,
      gemini: geminiClient !== null
    },
    soussou_words: soussouData.lexicon.words?.length || 0
  });
});

// ============== START SERVER ==============

app.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   🇬🇳  ZION UNIFIED BACKEND v2.0                          ║
║   Congregation + Soussou + Multi-AI Collaboration         ║
║                                                           ║
║   Server running on port ${PORT}                              ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝

📋 Congregation Bridge:
   POST   /congregation/commit   [auth required]
   GET    /congregation/thread

🇬🇳 Soussou API (${soussouData.lexicon.words?.length || 0} words):
   GET    /api/soussou/lookup
   GET    /api/soussou/stats
   POST   /api/soussou/translate

🤝 Multi-AI Collaboration:
   POST   /api/collaborate/start
   POST   /api/collaborate/message
   GET    /api/collaborate/session/:id
   GET    /api/collaborate/sessions
   POST   /api/collaborate/stop

🏥 Health:
   GET    /health

${geminiClient ? '✅ Gemini integration: ACTIVE' : '⚠️  Gemini integration: DISABLED (no API key)'}

Ready for multi-AI coordination 🚀
  `);
});

export default app;
