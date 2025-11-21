/**
 * ZION Unified Backend
 * Congregation Bridge + Guinius (Soussou) API
 */

import express from 'express';
import { Octokit } from 'octokit';
import crypto from 'crypto';
import dotenv from 'dotenv';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync } from 'fs';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '2mb' }));

// Configuration
const CONFIG = {
  port: process.env.PORT || 8080,
  github: {
    owner: process.env.GITHUB_OWNER || 'dashguinee',
    repo: process.env.GITHUB_REPO || 'ZION',
    token: process.env.GITHUB_TOKEN,
    branch: process.env.GITHUB_BRANCH || 'main',
    threadPath: '.congregation/thread.json'
  },
  auth: {
    chatgptToken: process.env.CHATGPT_SERVICE_TOKEN,
    geminiToken: process.env.GEMINI_SERVICE_TOKEN,
    zionToken: process.env.ZION_SERVICE_TOKEN,
    hmacSecret: process.env.SHARED_SECRET
  }
};

// Initialize GitHub client
const octokit = CONFIG.github.token ? new Octokit({ auth: CONFIG.github.token }) : null;

// Load Soussou data
let soussouData = {
  lexicon: { words: [] },
  variantMappings: { variant_to_base: {} },
  morphologyPatterns: {},
  syntaxPatterns: {},
  generationTemplates: { templates: {} }
};

try {
  const dataDir = join(__dirname, 'soussou-engine', 'data');
  const lexiconData = JSON.parse(readFileSync(join(dataDir, 'lexicon.json'), 'utf8'));
  // Handle both array and object formats
  soussouData.lexicon = Array.isArray(lexiconData) ? { words: lexiconData } : lexiconData;
  soussouData.variantMappings = JSON.parse(readFileSync(join(dataDir, 'variant_mappings.json'), 'utf8'));
  soussouData.morphologyPatterns = JSON.parse(readFileSync(join(dataDir, 'morphology_patterns.json'), 'utf8'));
  soussouData.syntaxPatterns = JSON.parse(readFileSync(join(dataDir, 'syntax_patterns.json'), 'utf8'));
  soussouData.generationTemplates = JSON.parse(readFileSync(join(dataDir, 'generation_templates.json'), 'utf8'));
  console.log(`✅ Loaded Soussou lexicon: ${soussouData.lexicon.words?.length || 0} words`);
} catch (error) {
  console.warn('⚠️  Soussou data not loaded:', error.message);
}

// ============================================================================
// AUTHENTICATION MIDDLEWARE
// ============================================================================

const authenticateRequest = (req, res, next) => {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.replace('Bearer ', '');

  const validTokens = [
    CONFIG.auth.chatgptToken,
    CONFIG.auth.geminiToken,
    CONFIG.auth.zionToken
  ].filter(Boolean);

  if (!validTokens.includes(token)) {
    return res.status(401).json({
      error: 'unauthorized',
      message: 'Invalid or missing Bearer token'
    });
  }

  if (CONFIG.auth.hmacSecret && req.headers['x-z-signature']) {
    const bodyString = JSON.stringify(req.body);
    const expectedSignature = crypto
      .createHmac('sha256', CONFIG.auth.hmacSecret)
      .update(bodyString)
      .digest('base64');

    if (req.headers['x-z-signature'] !== expectedSignature) {
      return res.status(401).json({
        error: 'unauthorized',
        message: 'Invalid HMAC signature'
      });
    }
  }

  next();
};

// ============================================================================
// CONGREGATION ENDPOINTS
// ============================================================================

async function fetchThread() {
  if (!octokit) throw new Error('GitHub not configured');

  try {
    const { data } = await octokit.rest.repos.getContent({
      owner: CONFIG.github.owner,
      repo: CONFIG.github.repo,
      path: CONFIG.github.threadPath,
      ref: CONFIG.github.branch
    });

    const content = Buffer.from(data.content, 'base64').toString('utf-8');
    return { content: JSON.parse(content), sha: data.sha };
  } catch (error) {
    if (error.status === 404) {
      return {
        content: {
          metadata: {
            created: new Date().toISOString(),
            title: 'Multi-AI Congregation Thread',
            participants: ['zion', 'chatgpt', 'gemini'],
            status: 'active'
          },
          messages: []
        },
        sha: null
      };
    }
    throw error;
  }
}

async function commitThread(thread, sha, author) {
  if (!octokit) throw new Error('GitHub not configured');

  const content = Buffer.from(JSON.stringify(thread, null, 2)).toString('base64');
  const params = {
    owner: CONFIG.github.owner,
    repo: CONFIG.github.repo,
    path: CONFIG.github.threadPath,
    message: `congregation: ${author} posted`,
    content,
    branch: CONFIG.github.branch
  };

  if (sha) params.sha = sha;

  const { data } = await octokit.rest.repos.createOrUpdateFileContents(params);
  return { sha: data.content.sha, commit: data.commit };
}

const messageCache = new Map();
const CACHE_TTL = 5 * 60 * 1000;

function isMessageDuplicate(messageId) {
  if (messageCache.has(messageId)) {
    const cachedTime = messageCache.get(messageId);
    if (Date.now() - cachedTime < CACHE_TTL) return true;
    messageCache.delete(messageId);
  }
  return false;
}

function cacheMessage(messageId) {
  messageCache.set(messageId, Date.now());
  for (const [id, time] of messageCache.entries()) {
    if (Date.now() - time > CACHE_TTL) messageCache.delete(id);
  }
}

app.post('/congregation/commit', authenticateRequest, async (req, res) => {
  const startTime = Date.now();

  try {
    const { author, content, message_id } = req.body;

    if (!author || !content) {
      return res.status(400).json({
        error: 'bad_request',
        message: 'Missing required fields: author, content'
      });
    }

    if (!['chatgpt', 'gemini', 'zion'].includes(author)) {
      return res.status(400).json({
        error: 'bad_request',
        message: 'Invalid author. Must be: chatgpt, gemini, or zion'
      });
    }

    if (message_id && isMessageDuplicate(message_id)) {
      return res.status(200).json({
        status: 'ok',
        message: 'Duplicate message ignored (idempotent)',
        cached: true
      });
    }

    const { content: thread, sha } = await fetchThread();

    const newMessage = {
      id: message_id || `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      author,
      model: req.body.model || (author === 'chatgpt' ? 'gpt-4' : author === 'gemini' ? 'gemini-pro' : 'claude-sonnet-4.5'),
      timestamp: new Date().toISOString(),
      content
    };

    thread.messages.push(newMessage);
    thread.metadata.last_updated = new Date().toISOString();

    const result = await commitThread(thread, sha, author);

    if (message_id) cacheMessage(message_id);

    const latency = Date.now() - startTime;
    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      event: 'message_committed',
      author,
      message_id: newMessage.id,
      latency_ms: latency,
      commit_sha: result.sha.substring(0, 7)
    }));

    res.json({
      status: 'ok',
      message_id: newMessage.id,
      commit_sha: result.sha,
      latency_ms: latency,
      thread_url: `https://github.com/${CONFIG.github.owner}/${CONFIG.github.repo}/blob/${CONFIG.github.branch}/${CONFIG.github.threadPath}`
    });

  } catch (error) {
    console.error('Error in /congregation/commit:', error);

    if (error.status === 403 && error.response?.headers['x-ratelimit-remaining'] === '0') {
      const resetTime = error.response.headers['x-ratelimit-reset'];
      return res.status(429).json({
        error: 'rate_limit',
        message: 'GitHub API rate limit exceeded',
        retry_after: resetTime ? parseInt(resetTime) - Math.floor(Date.now() / 1000) : 60
      });
    }

    res.status(500).json({
      error: 'internal_error',
      message: error.message || 'Failed to commit message'
    });
  }
});

app.get('/congregation/thread', async (req, res) => {
  try {
    const { content } = await fetchThread();
    res.json(content);
  } catch (error) {
    res.status(500).json({
      error: 'internal_error',
      message: 'Failed to fetch thread'
    });
  }
});

// ============================================================================
// SOUSSOU (GUINIUS) API ENDPOINTS
// ============================================================================

// Helper functions for Soussou operations
function normalize(text) {
  if (!text || typeof text !== 'string') return '';
  return text
    .toLowerCase()
    .replace(/['\u2019]/g, '')
    .replace(/(.)\1+/g, '$1')
    .replace(/[éèêë]/g, 'e')
    .replace(/[àâä]/g, 'a')
    .replace(/h$/, '')
    .trim();
}

function findSimilarWords(word, limit = 5) {
  const normalized = normalize(word);
  const words = soussouData.lexicon.words || [];

  const scored = words.map(w => ({
    word: w.base,
    score: stringSimilarity(normalized, normalize(w.base))
  }));

  return scored
    .filter(s => s.score > 0.3)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(s => s.word);
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

// Soussou API routes
app.get('/api/soussou/lookup', (req, res) => {
  const { word } = req.query;

  if (!word) {
    return res.status(400).json({ error: 'word parameter required' });
  }

  const searchWord = normalize(word);
  const entry = soussouData.lexicon.words?.find(w =>
    normalize(w.base) === searchWord ||
    w.variants?.some(v => normalize(v) === searchWord)
  );

  if (entry) {
    res.json({
      found: true,
      word: entry.base,
      normalized: searchWord,
      english: entry.english,
      french: entry.french,
      category: entry.category,
      variants: entry.variants || [],
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
});

app.get('/api/soussou/stats', (req, res) => {
  const words = soussouData.lexicon.words || [];
  const categories = {};
  words.forEach(w => {
    const cat = w.category || 'unknown';
    categories[cat] = (categories[cat] || 0) + 1;
  });

  res.json({
    total_words: words.length,
    total_variants: Object.keys(soussouData.variantMappings.variant_to_base || {}).length,
    total_templates: Object.keys(soussouData.generationTemplates.templates || {}).length,
    categories: categories
  });
});

app.post('/api/soussou/translate', (req, res) => {
  const { text, from, to } = req.body;

  if (!text || !from || !to) {
    return res.status(400).json({ error: 'text, from, and to parameters required' });
  }

  // Simple translation (can be enhanced)
  res.json({
    original: text,
    translation: `[Translation: ${text}]`,
    confidence: 0.5,
    note: 'Guinius translation engine - basic implementation'
  });
});

// ============================================================================
// HEALTH & ROOT
// ============================================================================

app.get('/', (req, res) => {
  res.json({
    service: 'zion-unified-backend',
    status: 'active',
    endpoints: {
      congregation: {
        commit: '/congregation/commit',
        thread: '/congregation/thread'
      },
      soussou: {
        lookup: '/api/soussou/lookup',
        stats: '/api/soussou/stats',
        translate: '/api/soussou/translate'
      },
      health: '/health'
    },
    github: CONFIG.github.token ? 'configured' : 'not-configured'
  });
});

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'zion-unified-backend',
    timestamp: new Date().toISOString(),
    features: {
      congregation: !!CONFIG.github.token,
      soussou: soussouData.lexicon.words?.length > 0
    },
    soussou_lexicon: soussouData.lexicon.words?.length || 0
  });
});

// ============================================================================
// START SERVER
// ============================================================================

app.listen(CONFIG.port, '0.0.0.0', () => {
  console.log(`
╔════════════════════════════════════════════════════════════╗
║  ZION UNIFIED BACKEND                                      ║
║  Congregation Bridge + Guinius (Soussou) API               ║
╠════════════════════════════════════════════════════════════╣
║  Status: ACTIVE                                            ║
║  Port: ${CONFIG.port}                                             ║
║  GitHub: ${CONFIG.github.owner}/${CONFIG.github.repo}                                       ║
╠════════════════════════════════════════════════════════════╣
║  Congregation Endpoints:                                   ║
║    POST /congregation/commit   [auth required]            ║
║    GET  /congregation/thread   [public]                   ║
║                                                            ║
║  Soussou/Guinius Endpoints:                                ║
║    GET  /api/soussou/lookup    [public]                   ║
║    GET  /api/soussou/stats     [public]                   ║
║    POST /api/soussou/translate [public]                   ║
║                                                            ║
║  System:                                                   ║
║    GET  /health                [public]                   ║
╚════════════════════════════════════════════════════════════╝
  `);
});
