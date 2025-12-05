/**
 * Tier Authentication Middleware
 * Protects curated endpoints based on user tier
 *
 * Created: December 5, 2025
 * Author: ZION SYNAPSE for DASH
 */

import iptvUsersService from '../services/iptv-users.service.js';
import logger from '../utils/logger.js';

const TIER_RANK = {
  'BASIC': 1,
  'STANDARD': 2,
  'PREMIUM': 3
};

/**
 * Middleware factory to require minimum tier
 *
 * Usage:
 *   app.get('/api/curated/premium', requireTier('PREMIUM'), handler)
 */
export function requireTier(minTier) {
  return (req, res, next) => {
    // Get username from header or query
    const username = req.headers['x-username'] || req.query.username;

    if (!username) {
      return res.status(401).json({
        error: 'Authentication required',
        message: 'Please provide username in X-Username header or query param'
      });
    }

    // Get user's tier
    const userTier = iptvUsersService.getUserTier(username);

    if (!userTier) {
      // User not found or inactive - default to BASIC
      // But only allow if BASIC is sufficient
      if (TIER_RANK['BASIC'] >= TIER_RANK[minTier]) {
        req.user = { username, tier: 'BASIC' };
        return next();
      }

      return res.status(403).json({
        error: 'Access denied',
        message: 'User not found or inactive',
        requiredTier: minTier
      });
    }

    // Check tier rank
    if (TIER_RANK[userTier] < TIER_RANK[minTier]) {
      return res.status(403).json({
        error: 'Upgrade required',
        currentTier: userTier,
        requiredTier: minTier,
        message: `This content requires ${minTier} tier. You have ${userTier}.`
      });
    }

    // Attach user to request
    req.user = { username, tier: userTier };
    next();
  };
}

/**
 * Optional tier check - attaches user info but doesn't block
 * Useful for endpoints that work for all but want to know the tier
 */
export function optionalTier(req, res, next) {
  const username = req.headers['x-username'] || req.query.username;

  if (username) {
    const userTier = iptvUsersService.getUserTier(username);
    req.user = {
      username,
      tier: userTier || 'BASIC',
      authenticated: !!userTier
    };
  } else {
    req.user = {
      tier: 'BASIC',
      authenticated: false
    };
  }

  next();
}

/**
 * Log access for analytics (optional)
 */
export function logAccess(req, res, next) {
  if (req.user) {
    logger.info(`Access: ${req.user.username} (${req.user.tier}) -> ${req.path}`);
  }
  next();
}

export default { requireTier, optionalTier, logAccess };
