import express from 'express';
import { Octokit } from 'octokit';
import crypto from 'crypto';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(express.json({ limit: '2mb' }));

// Configuration from environment
const CONFIG = {
  port: process.env.PORT || process.env.BRIDGE_PORT || 3001,
  github: {
    owner: process.env.GITHUB_OWNER || 'dashguinee',
    repo: process.env.GITHUB_REPO || 'ZION',
    token: process.env.GITHUB_TOKEN, // Personal Access Token or GitHub App token
    branch: process.env.GITHUB_BRANCH || 'main',
    threadPath: '.congregation/thread.json'
  },
  auth: {
    // Service tokens for different AI callers
    chatgptToken: process.env.CHATGPT_SERVICE_TOKEN,
    geminiToken: process.env.GEMINI_SERVICE_TOKEN,
    zionToken: process.env.ZION_SERVICE_TOKEN,
    // Shared secret for HMAC verification (optional, more secure)
    hmacSecret: process.env.SHARED_SECRET
  }
};

// Initialize GitHub client
const octokit = new Octokit({ auth: CONFIG.github.token });

// ============================================================================
// AUTHENTICATION MIDDLEWARE
// ============================================================================

const authenticateRequest = (req, res, next) => {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.replace('Bearer ', '');

  // Check if token matches any of the service tokens
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

  // Optional: Verify HMAC signature if provided
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
// GITHUB OPERATIONS
// ============================================================================

/**
 * Fetches the current thread.json from GitHub
 * @returns {Object} { content: parsed JSON, sha: file SHA }
 */
async function fetchThread() {
  try {
    const { data } = await octokit.rest.repos.getContent({
      owner: CONFIG.github.owner,
      repo: CONFIG.github.repo,
      path: CONFIG.github.threadPath,
      ref: CONFIG.github.branch
    });

    const content = Buffer.from(data.content, 'base64').toString('utf-8');
    return {
      content: JSON.parse(content),
      sha: data.sha
    };
  } catch (error) {
    if (error.status === 404) {
      // Thread doesn't exist yet, return empty structure
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

/**
 * Commits updated thread back to GitHub
 * @param {Object} thread - The updated thread object
 * @param {string} sha - The current file SHA (for updates)
 * @param {string} author - Who is committing (chatgpt, gemini, zion)
 * @returns {Object} { sha: new SHA, commit: commit details }
 */
async function commitThread(thread, sha, author) {
  const content = Buffer.from(
    JSON.stringify(thread, null, 2)
  ).toString('base64');

  const params = {
    owner: CONFIG.github.owner,
    repo: CONFIG.github.repo,
    path: CONFIG.github.threadPath,
    message: `congregation: ${author} posted`,
    content,
    branch: CONFIG.github.branch
  };

  // If file exists, include SHA for update
  if (sha) {
    params.sha = sha;
  }

  const { data } = await octokit.rest.repos.createOrUpdateFileContents(params);

  return {
    sha: data.content.sha,
    commit: data.commit
  };
}

// ============================================================================
// MESSAGE DEDUPLICATION (Idempotency)
// ============================================================================

const messageCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

function isMessageDuplicate(messageId) {
  if (messageCache.has(messageId)) {
    const cachedTime = messageCache.get(messageId);
    if (Date.now() - cachedTime < CACHE_TTL) {
      return true;
    }
    messageCache.delete(messageId);
  }
  return false;
}

function cacheMessage(messageId) {
  messageCache.set(messageId, Date.now());
  // Clean up old entries
  for (const [id, time] of messageCache.entries()) {
    if (Date.now() - time > CACHE_TTL) {
      messageCache.delete(id);
    }
  }
}

// ============================================================================
// WEBHOOK ENDPOINT
// ============================================================================

app.post('/congregation/commit', authenticateRequest, async (req, res) => {
  const startTime = Date.now();

  try {
    // Validate request body
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

    // Check for duplicate message (idempotency)
    if (message_id && isMessageDuplicate(message_id)) {
      return res.status(200).json({
        status: 'ok',
        message: 'Duplicate message ignored (idempotent)',
        cached: true
      });
    }

    // Fetch current thread
    const { content: thread, sha } = await fetchThread();

    // Create new message
    const newMessage = {
      id: message_id || `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      author,
      model: req.body.model || (author === 'chatgpt' ? 'gpt-4' : author === 'gemini' ? 'gemini-pro' : 'claude-sonnet-4.5'),
      timestamp: new Date().toISOString(),
      content
    };

    // Append to thread
    thread.messages.push(newMessage);
    thread.metadata.last_updated = new Date().toISOString();

    // Commit to GitHub
    const result = await commitThread(thread, sha, author);

    // Cache message ID for idempotency
    if (message_id) {
      cacheMessage(message_id);
    }

    // Audit log
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

    // Handle GitHub rate limits
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

// ============================================================================
// HEALTH CHECK
// ============================================================================

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'zion-congregation-bridge',
    timestamp: new Date().toISOString(),
    github: {
      configured: !!CONFIG.github.token,
      repo: `${CONFIG.github.owner}/${CONFIG.github.repo}`
    },
    auth: {
      chatgpt: !!CONFIG.auth.chatgptToken,
      gemini: !!CONFIG.auth.geminiToken,
      zion: !!CONFIG.auth.zionToken,
      hmac: !!CONFIG.auth.hmacSecret
    }
  });
});

// ============================================================================
// READ-ONLY THREAD ACCESS (for debugging)
// ============================================================================

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
// START SERVER
// ============================================================================

app.listen(CONFIG.port, '0.0.0.0', () => {
  console.log(`
╔════════════════════════════════════════════════════════════╗
║  ZION CONGREGATION BRIDGE                                  ║
║  Multi-AI Conversation System                              ║
╠════════════════════════════════════════════════════════════╣
║  Status: ACTIVE                                            ║
║  Port: ${CONFIG.port}                                             ║
║  GitHub: ${CONFIG.github.owner}/${CONFIG.github.repo.padEnd(42)} ║
║  Thread: ${CONFIG.github.threadPath.padEnd(45)} ║
╠════════════════════════════════════════════════════════════╣
║  Endpoints:                                                ║
║    POST /congregation/commit   [auth required]            ║
║    GET  /congregation/thread   [public]                   ║
║    GET  /health                [public]                   ║
╚════════════════════════════════════════════════════════════╝
  `);
});
