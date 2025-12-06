/**
 * Session Persistence Service
 * Manages user sessions with file-based persistence
 * Sessions survive server restarts
 *
 * Created: December 7, 2025
 * Author: ZION SYNAPSE for DASH
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import logger from '../utils/logger.js';
import { withFileLock } from '../utils/file-lock.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SESSION_FILE = path.join(__dirname, '../../data/sessions.json');

// Session expiry: 24 hours
const SESSION_EXPIRY = 24 * 60 * 60 * 1000;

class SessionService {
  constructor() {
    this.sessions = {};
    this.loadSessions();

    // Auto-save every minute
    this.saveInterval = setInterval(() => {
      this.saveSessions();
    }, 60000);

    // Clean expired sessions every hour
    this.cleanInterval = setInterval(() => {
      this.cleanExpired();
    }, 3600000);

    logger.info('Session service initialized');
  }

  /**
   * Load sessions from disk
   */
  loadSessions() {
    try {
      if (fs.existsSync(SESSION_FILE)) {
        const data = fs.readFileSync(SESSION_FILE, 'utf8');
        this.sessions = JSON.parse(data);

        // Clean expired on load
        this.cleanExpired();

        const count = Object.keys(this.sessions).length;
        logger.info(`Loaded ${count} active sessions from disk`);
      } else {
        this.sessions = {};
        logger.info('No existing sessions file, starting fresh');
      }
    } catch (error) {
      logger.error('Failed to load sessions:', error);
      this.sessions = {};
    }
  }

  /**
   * Save sessions to disk (with file locking)
   */
  async saveSessions() {
    try {
      await withFileLock(SESSION_FILE, async () => {
        const data = JSON.stringify(this.sessions, null, 2);
        fs.writeFileSync(SESSION_FILE, data, 'utf8');
      });
      logger.debug(`Saved ${Object.keys(this.sessions).length} sessions to disk`);
    } catch (error) {
      logger.error('Failed to save sessions:', error);
    }
  }

  /**
   * Create a new session
   *
   * @param {string} userId - User ID (username)
   * @param {object} metadata - Optional session metadata
   * @returns {string} Session ID
   */
  create(userId, metadata = {}) {
    const sessionId = crypto.randomUUID();
    const now = Date.now();

    this.sessions[sessionId] = {
      userId,
      createdAt: now,
      expiresAt: now + SESSION_EXPIRY,
      lastAccessedAt: now,
      metadata
    };

    // Save immediately for new sessions
    this.saveSessions();

    logger.info(`Session created for user ${userId}: ${sessionId}`);

    return sessionId;
  }

  /**
   * Validate and retrieve session
   *
   * @param {string} sessionId - Session ID to validate
   * @returns {object|null} Session object or null if invalid/expired
   */
  validate(sessionId) {
    const session = this.sessions[sessionId];

    if (!session) {
      logger.debug(`Session not found: ${sessionId}`);
      return null;
    }

    const now = Date.now();

    if (now > session.expiresAt) {
      logger.info(`Session expired: ${sessionId} (user: ${session.userId})`);
      delete this.sessions[sessionId];
      return null;
    }

    // Update last accessed time
    session.lastAccessedAt = now;

    return session;
  }

  /**
   * Refresh session expiry
   *
   * @param {string} sessionId - Session ID to refresh
   * @returns {boolean} True if refreshed, false if session not found
   */
  refresh(sessionId) {
    const session = this.sessions[sessionId];

    if (!session) {
      return false;
    }

    session.expiresAt = Date.now() + SESSION_EXPIRY;
    session.lastAccessedAt = Date.now();

    logger.debug(`Session refreshed: ${sessionId}`);

    return true;
  }

  /**
   * Destroy a session
   *
   * @param {string} sessionId - Session ID to destroy
   * @returns {boolean} True if destroyed, false if not found
   */
  destroy(sessionId) {
    if (!this.sessions[sessionId]) {
      return false;
    }

    const userId = this.sessions[sessionId].userId;
    delete this.sessions[sessionId];

    this.saveSessions();

    logger.info(`Session destroyed: ${sessionId} (user: ${userId})`);

    return true;
  }

  /**
   * Get all sessions for a user
   *
   * @param {string} userId - User ID
   * @returns {array} Array of session objects
   */
  getByUser(userId) {
    return Object.entries(this.sessions)
      .filter(([_, session]) => session.userId === userId)
      .map(([sessionId, session]) => ({
        sessionId,
        ...session
      }));
  }

  /**
   * Destroy all sessions for a user
   *
   * @param {string} userId - User ID
   * @returns {number} Number of sessions destroyed
   */
  destroyByUser(userId) {
    let count = 0;

    for (const [sessionId, session] of Object.entries(this.sessions)) {
      if (session.userId === userId) {
        delete this.sessions[sessionId];
        count++;
      }
    }

    if (count > 0) {
      this.saveSessions();
      logger.info(`Destroyed ${count} sessions for user: ${userId}`);
    }

    return count;
  }

  /**
   * Clean expired sessions
   *
   * @returns {number} Number of sessions cleaned
   */
  cleanExpired() {
    const now = Date.now();
    let count = 0;

    for (const [sessionId, session] of Object.entries(this.sessions)) {
      if (now > session.expiresAt) {
        delete this.sessions[sessionId];
        count++;
      }
    }

    if (count > 0) {
      this.saveSessions();
      logger.info(`Cleaned ${count} expired sessions`);
    }

    return count;
  }

  /**
   * Get session statistics
   *
   * @returns {object} Session stats
   */
  getStats() {
    const now = Date.now();
    const sessions = Object.values(this.sessions);

    return {
      total: sessions.length,
      active: sessions.filter(s => now < s.expiresAt).length,
      expired: sessions.filter(s => now >= s.expiresAt).length,
      uniqueUsers: new Set(sessions.map(s => s.userId)).size
    };
  }

  /**
   * Shutdown - save and cleanup
   */
  shutdown() {
    clearInterval(this.saveInterval);
    clearInterval(this.cleanInterval);
    this.saveSessions();
    logger.info('Session service shutdown');
  }
}

// Singleton export
const sessionService = new SessionService();

// Graceful shutdown handlers
process.on('SIGTERM', () => sessionService.shutdown());
process.on('SIGINT', () => sessionService.shutdown());

export default sessionService;
