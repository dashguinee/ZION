/**
 * File Locking Utility
 * Prevents race conditions in concurrent JSON file operations
 *
 * Created: December 7, 2025
 * Author: ZION SYNAPSE for DASH
 */

import logger from './logger.js';

/**
 * Map of file paths to lock status
 * Key: absolute file path
 * Value: true if locked, false if available
 */
const locks = new Map();

/**
 * Map of file paths to waiting queue
 * Key: absolute file path
 * Value: array of waiting promise resolvers
 */
const waitQueue = new Map();

/**
 * Execute an operation with exclusive file lock
 *
 * @param {string} filePath - Absolute path to the file
 * @param {Function} operation - Async function to execute with lock
 * @returns {Promise<any>} Result of the operation
 */
export async function withFileLock(filePath, operation) {
  // Wait for lock to be available
  while (locks.get(filePath)) {
    await new Promise(resolve => {
      const queue = waitQueue.get(filePath) || [];
      queue.push(resolve);
      waitQueue.set(filePath, queue);
    });
  }

  // Acquire lock
  locks.set(filePath, true);
  const startTime = Date.now();

  try {
    logger.debug(`File lock acquired: ${filePath}`);
    const result = await operation();
    return result;
  } catch (error) {
    logger.error(`File lock operation error for ${filePath}:`, error);
    throw error;
  } finally {
    // Release lock
    locks.delete(filePath);
    const duration = Date.now() - startTime;
    logger.debug(`File lock released: ${filePath} (held for ${duration}ms)`);

    // Notify next waiter
    const queue = waitQueue.get(filePath);
    if (queue && queue.length > 0) {
      const nextResolver = queue.shift();
      nextResolver();
      if (queue.length === 0) {
        waitQueue.delete(filePath);
      }
    }
  }
}

/**
 * Check if a file is currently locked
 *
 * @param {string} filePath - Absolute path to the file
 * @returns {boolean} True if locked, false otherwise
 */
export function isLocked(filePath) {
  return locks.get(filePath) === true;
}

/**
 * Get number of operations waiting for a file lock
 *
 * @param {string} filePath - Absolute path to the file
 * @returns {number} Number of waiting operations
 */
export function getWaitingCount(filePath) {
  const queue = waitQueue.get(filePath);
  return queue ? queue.length : 0;
}

/**
 * Get statistics about all file locks
 *
 * @returns {object} Lock statistics
 */
export function getLockStats() {
  const stats = {
    activeLocks: locks.size,
    lockedFiles: Array.from(locks.keys()),
    waitingOperations: 0,
    queuesByFile: {}
  };

  for (const [filePath, queue] of waitQueue.entries()) {
    stats.waitingOperations += queue.length;
    stats.queuesByFile[filePath] = queue.length;
  }

  return stats;
}

export default {
  withFileLock,
  isLocked,
  getWaitingCount,
  getLockStats
};
