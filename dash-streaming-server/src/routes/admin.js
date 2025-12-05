/**
 * Admin API Routes
 * Manages IPTV users, packages, and access control
 *
 * Created: December 5, 2025
 * Author: ZION SYNAPSE for DASH
 */

import express from 'express';
import iptvUsersService from '../services/iptv-users.service.js';
import logger from '../utils/logger.js';

const router = express.Router();

// Simple admin auth (for now - enhance later)
const ADMIN_KEY = process.env.ADMIN_KEY || 'dash-admin-2025';

function requireAdmin(req, res, next) {
  const key = req.headers['x-admin-key'] || req.query.adminKey;

  if (key !== ADMIN_KEY) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  next();
}

// Apply admin auth to all routes
router.use(requireAdmin);

// ===== DASHBOARD =====

/**
 * GET /api/admin/stats
 * Get dashboard statistics
 */
router.get('/stats', (req, res) => {
  try {
    const stats = iptvUsersService.getStats();
    res.json({ success: true, stats });
  } catch (error) {
    logger.error('Admin stats error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ===== USERS =====

/**
 * GET /api/admin/users
 * Get all users
 */
router.get('/users', (req, res) => {
  try {
    const users = iptvUsersService.getAllUsers();
    res.json({ success: true, count: users.length, users });
  } catch (error) {
    logger.error('Admin get users error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/admin/users/:username
 * Get single user
 */
router.get('/users/:username', (req, res) => {
  try {
    const user = iptvUsersService.getUser(req.params.username);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const access = iptvUsersService.getUserAccess(req.params.username);

    res.json({
      success: true,
      username: req.params.username,
      user,
      access
    });
  } catch (error) {
    logger.error('Admin get user error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/admin/users
 * Create new user
 * Body: { username, name, whatsapp, package }
 */
router.post('/users', (req, res) => {
  try {
    const { username, name, whatsapp, package: pkg } = req.body;

    if (!username || !name || !pkg) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['username', 'name', 'package']
      });
    }

    const result = iptvUsersService.createUser(username, {
      name,
      whatsapp: whatsapp || '',
      package: pkg
    });

    if (!result.success) {
      return res.status(400).json(result);
    }

    logger.info(`Admin: Created user ${username} with package ${pkg}`);

    res.json(result);
  } catch (error) {
    logger.error('Admin create user error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * PUT /api/admin/users/:username
 * Update user
 * Body: { name?, whatsapp?, package?, status? }
 */
router.put('/users/:username', (req, res) => {
  try {
    const result = iptvUsersService.updateUser(req.params.username, req.body);

    if (!result.success) {
      return res.status(400).json(result);
    }

    logger.info(`Admin: Updated user ${req.params.username}`);

    res.json(result);
  } catch (error) {
    logger.error('Admin update user error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/admin/users/:username/suspend
 * Suspend user
 */
router.post('/users/:username/suspend', (req, res) => {
  try {
    const result = iptvUsersService.suspendUser(req.params.username);

    if (!result.success) {
      return res.status(400).json(result);
    }

    logger.info(`Admin: Suspended user ${req.params.username}`);

    res.json(result);
  } catch (error) {
    logger.error('Admin suspend user error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/admin/users/:username/activate
 * Activate user
 */
router.post('/users/:username/activate', (req, res) => {
  try {
    const result = iptvUsersService.activateUser(req.params.username);

    if (!result.success) {
      return res.status(400).json(result);
    }

    logger.info(`Admin: Activated user ${req.params.username}`);

    res.json(result);
  } catch (error) {
    logger.error('Admin activate user error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * DELETE /api/admin/users/:username
 * Delete user
 */
router.delete('/users/:username', (req, res) => {
  try {
    const result = iptvUsersService.deleteUser(req.params.username);

    if (!result.success) {
      return res.status(400).json(result);
    }

    logger.info(`Admin: Deleted user ${req.params.username}`);

    res.json(result);
  } catch (error) {
    logger.error('Admin delete user error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ===== PACKAGES =====

/**
 * GET /api/admin/packages
 * Get all packages
 */
router.get('/packages', (req, res) => {
  try {
    const packages = iptvUsersService.getAllPackages();
    res.json({ success: true, packages });
  } catch (error) {
    logger.error('Admin get packages error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ===== EXPORT =====

/**
 * GET /api/admin/export
 * Export users for Notion sync
 */
router.get('/export', (req, res) => {
  try {
    const users = iptvUsersService.exportUsers();
    res.json({
      success: true,
      exportedAt: new Date().toISOString(),
      count: users.length,
      users
    });
  } catch (error) {
    logger.error('Admin export error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ===== USER ACCESS CHECK (for customer app) =====

/**
 * GET /api/admin/access/:username
 * Check user access (called by customer app after StarShare login)
 * This endpoint doesn't require admin key - it's for the customer app
 */
router.get('/access/:username', (req, res) => {
  // Remove admin auth for this specific route
  // We want the customer app to be able to check access
});

export default router;
