/**
 * Content Health API Routes - Elite Tier
 * User reporting, health checks, duplicate management
 *
 * Created: December 6, 2025
 * Author: ZION SYNAPSE for DASH
 */

import express from 'express';
import contentHealthService from '../services/content-health.service.js';
import logger from '../utils/logger.js';

const router = express.Router();

// Admin auth middleware (reuse from admin.js)
const ADMIN_KEY = process.env.ADMIN_KEY || 'dash-admin-2025';

function requireAdmin(req, res, next) {
  const key = req.headers['x-admin-key'] || req.query.adminKey;
  if (key !== ADMIN_KEY) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
}

// =====================
// PUBLIC ENDPOINTS (User-facing)
// =====================

/**
 * POST /api/health/report
 * Submit a user report for broken content
 * Body: { contentId, contentType, contentName, issueType, description }
 */
router.post('/report', (req, res) => {
  try {
    const { contentId, contentType, contentName, issueType, description, username } = req.body;

    if (!contentId || !contentType || !issueType) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['contentId', 'contentType', 'issueType']
      });
    }

    // Validate issueType
    const validIssueTypes = [
      'not_playing',
      'buffering',
      'wrong_content',
      'audio_issue',
      'subtitle_issue',
      'offline',
      'low_quality',
      'other'
    ];

    if (!validIssueTypes.includes(issueType)) {
      return res.status(400).json({
        error: 'Invalid issue type',
        validTypes: validIssueTypes
      });
    }

    const result = contentHealthService.submitReport({
      contentId,
      contentType,
      contentName,
      issueType,
      description,
      userAgent: req.headers['user-agent'],
      username
    });

    res.json(result);
  } catch (error) {
    logger.error('Report submission error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/health/status/:type/:id
 * Get health status for specific content
 */
router.get('/status/:type/:id', (req, res) => {
  try {
    const { type, id } = req.params;
    const health = contentHealthService.getContentHealth(id, type);

    // Also get report count
    const reports = contentHealthService.getReports({ contentId: id, resolved: false });

    res.json({
      success: true,
      contentId: id,
      contentType: type,
      health,
      activeReports: reports.length,
      hasFallback: contentHealthService.getFallbackChain(id) !== null
    });
  } catch (error) {
    logger.error('Health status error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/health/fallback/:type/:id
 * Get fallback sources for content (if primary fails)
 */
router.get('/fallback/:type/:id', (req, res) => {
  try {
    const { type, id } = req.params;
    const fallbackChain = contentHealthService.getFallbackChain(id);

    if (!fallbackChain) {
      return res.json({
        success: true,
        hasFallback: false,
        fallbacks: []
      });
    }

    res.json({
      success: true,
      hasFallback: true,
      fallbacks: fallbackChain
    });
  } catch (error) {
    logger.error('Fallback lookup error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/health/offline
 * Get list of currently offline content (for UI to blur/hide)
 */
router.get('/offline', (req, res) => {
  try {
    const offline = contentHealthService.getOfflineContent();
    const degraded = contentHealthService.getDegradedContent();

    res.json({
      success: true,
      offline: offline.map(c => ({
        id: c.contentId,
        type: c.contentType,
        reason: c.reason
      })),
      degraded: degraded.map(c => ({
        id: c.contentId,
        type: c.contentType,
        reason: c.reason
      }))
    });
  } catch (error) {
    logger.error('Offline list error:', error);
    res.status(500).json({ error: error.message });
  }
});

// =====================
// ADMIN ENDPOINTS
// =====================

/**
 * GET /api/health/admin/dashboard
 * Full health dashboard for admin
 */
router.get('/admin/dashboard', requireAdmin, (req, res) => {
  try {
    const dashboard = contentHealthService.getDashboardData();
    res.json({ success: true, ...dashboard });
  } catch (error) {
    logger.error('Dashboard error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/health/admin/reports
 * Get all reports (with filtering)
 */
router.get('/admin/reports', requireAdmin, (req, res) => {
  try {
    const { limit, contentId, issueType, resolved } = req.query;

    const reports = contentHealthService.getReports({
      limit: parseInt(limit) || 50,
      contentId,
      issueType,
      resolved: resolved === 'true' ? true : resolved === 'false' ? false : undefined
    });

    res.json({
      success: true,
      count: reports.length,
      reports
    });
  } catch (error) {
    logger.error('Admin reports error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/health/admin/reports/:id/resolve
 * Resolve a user report
 * Body: { resolution: 'fixed' | 'removed' | 'cannot_reproduce' | 'duplicate' | 'wont_fix' }
 */
router.post('/admin/reports/:id/resolve', requireAdmin, (req, res) => {
  try {
    const { resolution } = req.body;
    const validResolutions = ['fixed', 'removed', 'cannot_reproduce', 'duplicate', 'wont_fix'];

    if (!validResolutions.includes(resolution)) {
      return res.status(400).json({
        error: 'Invalid resolution',
        validResolutions
      });
    }

    const result = contentHealthService.resolveReport(req.params.id, resolution);
    res.json(result);
  } catch (error) {
    logger.error('Resolve report error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/health/admin/flag-offline
 * Manually flag content as offline
 * Body: { contentId, contentType, reason }
 */
router.post('/admin/flag-offline', requireAdmin, (req, res) => {
  try {
    const { contentId, contentType, reason } = req.body;

    if (!contentId || !contentType) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['contentId', 'contentType']
      });
    }

    contentHealthService.flagContentAsOffline(contentId, contentType, reason || 'Admin flagged');

    res.json({ success: true, message: 'Content flagged as offline' });
  } catch (error) {
    logger.error('Flag offline error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/health/admin/clear-flag
 * Clear offline/degraded flag for content
 * Body: { contentId, contentType }
 */
router.post('/admin/clear-flag', requireAdmin, (req, res) => {
  try {
    const { contentId, contentType } = req.body;

    if (!contentId || !contentType) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['contentId', 'contentType']
      });
    }

    const result = contentHealthService.clearOfflineFlag(contentId, contentType);
    res.json(result);
  } catch (error) {
    logger.error('Clear flag error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/health/admin/duplicates
 * Add a duplicate group (link same content from different sources)
 * Body: { canonicalTitle, variants: [{ id, source, quality, language, priority }] }
 */
router.post('/admin/duplicates', requireAdmin, (req, res) => {
  try {
    const { canonicalTitle, variants } = req.body;

    if (!canonicalTitle || !variants || !Array.isArray(variants) || variants.length < 2) {
      return res.status(400).json({
        error: 'Invalid duplicate group',
        required: ['canonicalTitle', 'variants (array with at least 2 items)']
      });
    }

    const group = contentHealthService.addDuplicateGroup(canonicalTitle, variants);

    res.json({ success: true, group });
  } catch (error) {
    logger.error('Add duplicate group error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/health/admin/duplicates
 * Get all duplicate groups
 */
router.get('/admin/duplicates', requireAdmin, (req, res) => {
  try {
    const groups = contentHealthService.getDuplicateGroups();
    res.json({
      success: true,
      count: groups.length,
      groups
    });
  } catch (error) {
    logger.error('Get duplicates error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/health/check
 * Record a health check result (called by player when stream fails/succeeds)
 * Body: { contentId, contentType, success, latency }
 */
router.post('/check', (req, res) => {
  try {
    const { contentId, contentType, success, latency } = req.body;

    if (!contentId || !contentType || success === undefined) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['contentId', 'contentType', 'success']
      });
    }

    const result = contentHealthService.updateHealthStatus(contentId, contentType, {
      success,
      latency
    });

    res.json({ success: true, health: result });
  } catch (error) {
    logger.error('Health check error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
