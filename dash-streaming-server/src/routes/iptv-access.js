/**
 * IPTV Access Routes
 * Public endpoints for customer app to check access
 *
 * Created: December 5, 2025
 * Author: ZION SYNAPSE for DASH
 */

import express from 'express';
import iptvUsersService from '../services/iptv-users.service.js';
import logger from '../utils/logger.js';

const router = express.Router();

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

export default router;
