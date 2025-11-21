/**
 * Utility functions for collaboration system
 */

import crypto from 'crypto';

/**
 * Generate unique ID with prefix
 */
export function generateId(prefix = 'conv') {
  const timestamp = Date.now().toString(36);
  const randomPart = crypto.randomBytes(6).toString('hex');
  return `${prefix}_${timestamp}${randomPart}`;
}

/**
 * Validate participant name
 */
export function isValidParticipant(name) {
  return /^[a-z0-9-]+$/.test(name);
}

/**
 * Format duration
 */
export function formatDuration(ms) {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (hours > 0) {
    return `${hours}h ${minutes % 60}m`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  } else {
    return `${seconds}s`;
  }
}

/**
 * Deep clone object
 */
export function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}
