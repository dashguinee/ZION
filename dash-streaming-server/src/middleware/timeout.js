/**
 * Request Timeout Middleware
 * Prevents requests from hanging indefinitely
 *
 * Created: December 7, 2025
 * Author: ZION SYNAPSE for DASH
 */

import logger from '../utils/logger.js';

/**
 * Create timeout middleware with specified duration
 *
 * @param {number|string} duration - Timeout in milliseconds or string (e.g., '30s', '5m')
 * @returns {Function} Express middleware
 */
export function timeout(duration) {
  const timeoutMs = parseDuration(duration);

  return (req, res, next) => {
    // Skip if response already sent
    if (res.headersSent) {
      return next();
    }

    // Set timeout
    const timeoutId = setTimeout(() => {
      if (!res.headersSent) {
        logger.warn(`Request timeout: ${req.method} ${req.url} (${timeoutMs}ms)`);

        res.status(408).json({
          error: 'Request timeout',
          message: `Request took longer than ${timeoutMs}ms`,
          timeout: timeoutMs
        });
      }
    }, timeoutMs);

    // Clear timeout when response finishes
    res.on('finish', () => {
      clearTimeout(timeoutId);
    });

    // Clear timeout on error
    res.on('close', () => {
      clearTimeout(timeoutId);
    });

    next();
  };
}

/**
 * Parse duration string to milliseconds
 *
 * @param {number|string} duration - Duration (number = ms, string = '30s', '5m', etc)
 * @returns {number} Duration in milliseconds
 */
function parseDuration(duration) {
  if (typeof duration === 'number') {
    return duration;
  }

  if (typeof duration === 'string') {
    const match = duration.match(/^(\d+)(ms|s|m|h)?$/);

    if (!match) {
      throw new Error(`Invalid duration format: ${duration}`);
    }

    const value = parseInt(match[1], 10);
    const unit = match[2] || 'ms';

    switch (unit) {
      case 'ms':
        return value;
      case 's':
        return value * 1000;
      case 'm':
        return value * 60 * 1000;
      case 'h':
        return value * 60 * 60 * 1000;
      default:
        throw new Error(`Unknown duration unit: ${unit}`);
    }
  }

  throw new Error(`Invalid duration type: ${typeof duration}`);
}

/**
 * Middleware to halt execution if request timed out
 * Use this between async operations to check timeout status
 */
export function haltOnTimeout(req, res, next) {
  if (res.headersSent) {
    return; // Don't call next() - response already sent
  }
  next();
}

export default {
  timeout,
  haltOnTimeout,
  parseDuration
};
