/**
 * IPTV Access Routes
 * Public endpoints for customer app to check access
 * + Secure session management (Elite Tier)
 *
 * Created: December 5, 2025
 * Updated: December 6, 2025 - Added session tokens
 * Author: ZION SYNAPSE for DASH
 */

import express from 'express';
import crypto from 'crypto';
import iptvUsersService from '../services/iptv-users.service.js';
import logger from '../utils/logger.js';

const router = express.Router();

// Session store (in-memory for now, could use Redis for persistence)
const sessions = new Map();
const SESSION_EXPIRY = 7 * 24 * 60 * 60 * 1000; // 7 days

/**
 * Generate a secure session token
 */
function generateSessionToken() {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Clean expired sessions periodically
 */
setInterval(() => {
  const now = Date.now();
  for (const [token, session] of sessions.entries()) {
    if (session.expiresAt < now) {
      sessions.delete(token);
    }
  }
}, 60 * 60 * 1000); // Every hour

/**
 * GET /api/iptv-access/:username
 * Check user's access tier (called after StarShare login succeeds)
 *
 * Returns:
 * - tier (BASIC, STANDARD, PREMIUM)
 * - starshareEnabled (boolean)
 * - endpoints (which API endpoints they can use)
 */
router.get('/:username', (req, res) => {
  try {
    const { username } = req.params;

    const access = iptvUsersService.getUserAccess(username);

    if (!access.found) {
      // User not in our system - give them BASIC access by default
      // This allows StarShare-only users to still use the app
      return res.json({
        success: true,
        found: false,
        tier: 'BASIC',
        starshareEnabled: true, // They logged in via StarShare
        message: 'User not registered in DASH system, using default access',
        endpoints: iptvUsersService.getTierEndpoints('BASIC')
      });
    }

    if (!access.active) {
      return res.status(403).json({
        success: false,
        error: access.error || 'Account inactive'
      });
    }

    res.json({
      success: true,
      ...access
    });

  } catch (error) {
    logger.error('IPTV access check error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/iptv-access/packages/list
 * Get available packages (for display in app)
 */
router.get('/packages/list', (req, res) => {
  try {
    const packages = iptvUsersService.getAllPackages();

    // Return public info only (no internal details)
    const publicPackages = packages.map(pkg => ({
      id: pkg.id,
      name: pkg.name,
      price: pkg.price,
      currency: pkg.currency,
      description: pkg.description,
      features: pkg.features
    }));

    res.json({
      success: true,
      packages: publicPackages
    });

  } catch (error) {
    logger.error('IPTV packages list error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// SECURE SESSION MANAGEMENT (Elite Tier)
// ============================================

/**
 * POST /api/iptv-access/session/create
 * Create a secure session after validating credentials
 * Frontend sends credentials ONCE, receives a token to use for subsequent requests
 *
 * Body: { username, password }
 * Returns: { success, token, expiresAt, username, tier }
 */
router.post('/session/create', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        error: 'Username and password required'
      });
    }

    // Validate credentials with the provider (StarShare)
    // This is a lightweight check - just verify the account exists
    const providerUrl = process.env.XTREAM_PROVIDER_URL || 'https://starshare.cx';
    const checkUrl = `${providerUrl}/player_api.php?username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}`;

    try {
      const response = await fetch(checkUrl, { timeout: 10000 });
      const data = await response.json();

      if (!data.user_info || data.user_info.auth === 0) {
        return res.status(401).json({
          success: false,
          error: 'Invalid credentials'
        });
      }
    } catch (providerError) {
      logger.warn('Provider check failed, allowing session anyway:', providerError.message);
      // If provider is down, we'll still create session - user will see errors when trying to play
    }

    // Create session token
    const token = generateSessionToken();
    const expiresAt = Date.now() + SESSION_EXPIRY;

    // Store session (credentials are encrypted with token as key)
    const cipher = crypto.createCipheriv(
      'aes-256-gcm',
      crypto.scryptSync(token, 'dash-salt', 32),
      Buffer.alloc(16, 0) // Simple IV for session tokens
    );
    let encrypted = cipher.update(password, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag().toString('hex');

    sessions.set(token, {
      username,
      encryptedPassword: encrypted,
      authTag,
      expiresAt,
      createdAt: Date.now()
    });

    // Get user tier
    const access = iptvUsersService.getUserAccess(username);

    logger.info(`Session created for user: ${username}`);

    res.json({
      success: true,
      token,
      expiresAt,
      username,
      tier: access.tier || 'BASIC'
    });

  } catch (error) {
    logger.error('Session create error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/iptv-access/session/validate
 * Validate a session token and get credentials for streaming
 * Header: x-session-token
 *
 * Returns credentials only if token is valid
 */
router.get('/session/validate', (req, res) => {
  try {
    const token = req.headers['x-session-token'];

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'No session token provided'
      });
    }

    const session = sessions.get(token);

    if (!session) {
      return res.status(401).json({
        success: false,
        error: 'Invalid session token'
      });
    }

    if (session.expiresAt < Date.now()) {
      sessions.delete(token);
      return res.status(401).json({
        success: false,
        error: 'Session expired'
      });
    }

    // Decrypt password
    try {
      const decipher = crypto.createDecipheriv(
        'aes-256-gcm',
        crypto.scryptSync(token, 'dash-salt', 32),
        Buffer.alloc(16, 0)
      );
      decipher.setAuthTag(Buffer.from(session.authTag, 'hex'));
      let decrypted = decipher.update(session.encryptedPassword, 'hex', 'utf8');
      decrypted += decipher.final('utf8');

      res.json({
        success: true,
        username: session.username,
        password: decrypted, // Only sent over HTTPS
        expiresAt: session.expiresAt
      });
    } catch (decryptError) {
      logger.error('Decrypt error:', decryptError);
      sessions.delete(token);
      return res.status(401).json({
        success: false,
        error: 'Session corrupted'
      });
    }

  } catch (error) {
    logger.error('Session validate error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/iptv-access/session/revoke
 * Logout - invalidate session
 * Header: x-session-token
 */
router.post('/session/revoke', (req, res) => {
  try {
    const token = req.headers['x-session-token'];

    if (token && sessions.has(token)) {
      sessions.delete(token);
      logger.info('Session revoked');
    }

    res.json({ success: true });
  } catch (error) {
    logger.error('Session revoke error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
