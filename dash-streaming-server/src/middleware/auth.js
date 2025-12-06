/**
 * Authentication Middleware
 * Validates user sessions and package access for streaming
 * Uses unified user service for consistent access control
 *
 * Created: December 7, 2025
 * Updated: December 7, 2025 - Integrated with unified user service
 * Author: ZION SYNAPSE for DASH
 */

import userService from '../services/user.service.js';
import iptvUsersService from '../services/iptv-users.service.js';
import logger from '../utils/logger.js';

/**
 * Require user authentication
 * Validates that user exists and is active
 */
export function requireAuth(req, res, next) {
  // Get username from header or query
  const username = req.headers['x-username'] || req.query.username;

  if (!username) {
    return res.status(401).json({
      error: 'Authentication required',
      message: 'Please provide username in X-Username header or query param'
    });
  }

  // Try unified user service first
  let user = userService.getUser(username);

  // Fallback to IPTV users service for backward compatibility
  if (!user) {
    user = iptvUsersService.getUser(username);
  }

  if (!user) {
    logger.warn(`Authentication failed: User not found - ${username}`);
    return res.status(401).json({
      error: 'Authentication failed',
      message: 'User not found'
    });
  }

  if (user.status !== 'active') {
    const message = user.status === 'suspended'
      ? 'Your account is suspended due to insufficient balance. Please top up your wallet.'
      : 'Your account has been suspended. Please contact support.';

    logger.warn(`Authentication failed: User ${user.status} - ${username}`);
    return res.status(403).json({
      error: 'Account suspended',
      message,
      status: user.status,
      walletBalance: user.wallet?.balance || 0
    });
  }

  // Attach user to request
  req.user = {
    username,
    name: user.name,
    package: user.package?.selectedCategories || user.package,
    tier: user.tier,
    status: user.status,
    walletBalance: user.wallet?.balance || 0
  };

  next();
}

/**
 * Require package access for specific content category
 * Must be used AFTER requireAuth
 */
export function requirePackageAccess(category) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(500).json({
        error: 'Server error',
        message: 'requireAuth must be called before requirePackageAccess'
      });
    }

    // Map content categories to package category IDs
    const categoryMap = {
      'vod': 'french',  // VOD is part of French package
      'movies': 'premium',
      'series': 'kdrama',
      'live': 'livetv',
      'livetv': 'livetv',
      'sports': 'sports',
      'french': 'french',
      'nollywood': 'nollywood',
      'kdrama': 'kdrama',
      'kids': 'kids',
      'music': 'music'
    };

    const requiredCategory = categoryMap[category.toLowerCase()];

    // Check access using unified user service
    const accessCheck = userService.validateStreamAccess(req.user.username, requiredCategory);

    if (!accessCheck.allowed) {
      logger.warn(`Package access denied: ${req.user.username} (tier: ${req.user.tier}) tried to access ${category}`);
      return res.status(403).json({
        error: accessCheck.error,
        message: accessCheck.message,
        currentTier: req.user.tier,
        currentPackage: req.user.package,
        requiredCategory: requiredCategory,
        upgradeUrl: '/packages',
        ...accessCheck
      });
    }

    next();
  };
}

/**
 * Optional auth - attaches user if authenticated, but doesn't block
 */
export function optionalAuth(req, res, next) {
  const username = req.headers['x-username'] || req.query.username;

  if (username) {
    const user = iptvUsersService.getUser(username);
    if (user && user.status === 'active') {
      req.user = {
        username,
        name: user.name,
        package: user.package,
        status: user.status,
        authenticated: true
      };
    }
  }

  if (!req.user) {
    req.user = { authenticated: false };
  }

  next();
}

export default { requireAuth, requirePackageAccess, optionalAuth };
