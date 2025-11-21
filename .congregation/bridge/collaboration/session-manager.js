/**
 * Session Manager
 * Handles in-memory storage and lifecycle of collaboration sessions
 */

import { generateId } from './utils.js';

export class SessionManager {
  constructor() {
    this.sessions = new Map();
    this.cleanupInterval = setInterval(() => this.cleanup(), 60000); // Cleanup every minute
  }

  createSession(config) {
    const id = generateId('conv');
    const now = Date.now();

    const session = {
      id,
      task: config.task,
      goal: config.goal,
      participants: config.participants,
      status: 'active', // active, completed, stopped, timeout

      // State tracking
      current_state: config.initial_state,
      progress: 0,

      // Conversation
      turns: [],

      // Timing
      started_at: new Date().toISOString(),
      started_at_timestamp: now,
      last_activity: now,
      completed_at: null,
      stop_reason: null,

      // Limits
      max_turns: config.max_turns || 20,
      timeout_minutes: config.timeout_minutes || 30,

      // Metadata
      metadata: config.metadata || {}
    };

    this.sessions.set(id, session);
    return session;
  }

  getSession(id) {
    return this.sessions.get(id);
  }

  getAllSessions() {
    return Array.from(this.sessions.values());
  }

  deleteSession(id) {
    return this.sessions.delete(id);
  }

  cleanup() {
    const now = Date.now();
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours

    for (const [id, session] of this.sessions) {
      const age = now - session.started_at_timestamp;

      // Remove old completed sessions
      if ((session.status === 'completed' || session.status === 'stopped') && age > maxAge) {
        console.log(`[SessionManager] Cleaning up old session: ${id}`);
        this.sessions.delete(id);
      }

      // Mark timed-out sessions
      if (session.status === 'active') {
        const timeout = session.timeout_minutes * 60 * 1000;
        if (age > timeout) {
          console.log(`[SessionManager] Session timeout: ${id}`);
          session.status = 'timeout';
          session.stop_reason = 'TIMEOUT';
          session.completed_at = new Date().toISOString();
        }
      }
    }
  }

  getStats() {
    const sessions = this.getAllSessions();
    return {
      total: sessions.length,
      active: sessions.filter(s => s.status === 'active').length,
      completed: sessions.filter(s => s.status === 'completed').length,
      stopped: sessions.filter(s => s.status === 'stopped').length,
      timeout: sessions.filter(s => s.status === 'timeout').length
    };
  }

  destroy() {
    clearInterval(this.cleanupInterval);
    this.sessions.clear();
  }
}
