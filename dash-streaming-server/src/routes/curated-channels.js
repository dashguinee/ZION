/**
 * CURATED CHANNELS API - Tiered Access Control
 *
 * Endpoints for accessing curated channel lists based on user tier.
 * Tiers: BASIC (free), STANDARD, PREMIUM
 *
 * Created: December 2025
 */

import express from 'express';
import curatedChannelsService from '../services/curated-channels.service.js';
import logger from '../utils/logger.js';

const router = express.Router();

/**
 * GET /api/curated/tiers
 * Get all tier configurations
 */
router.get('/tiers', async (req, res) => {
  try {
    const tiers = curatedChannelsService.getAllTiers();

    res.json({
      success: true,
      tiers
    });
  } catch (error) {
    logger.error('Error fetching tiers:', error.message);
    res.status(500).json({ error: 'Failed to fetch tiers' });
  }
});

/**
 * GET /api/curated/stats
 * Get curated channel statistics
 */
router.get('/stats', async (req, res) => {
  try {
    const stats = await curatedChannelsService.getStats();

    res.json({
      success: true,
      ...stats
    });
  } catch (error) {
    logger.error('Error fetching curated stats:', error.message);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

/**
 * GET /api/curated/basic
 * Get BASIC tier channels (free tier)
 */
router.get('/basic', async (req, res) => {
  try {
    const data = await curatedChannelsService.getBasicChannels();

    res.json({
      success: true,
      ...data
    });
  } catch (error) {
    logger.error('Error fetching basic channels:', error.message);
    res.status(500).json({ error: 'Failed to fetch channels' });
  }
});

/**
 * GET /api/curated/standard
 * Get STANDARD tier channels
 */
router.get('/standard', async (req, res) => {
  try {
    const data = await curatedChannelsService.getStandardChannels();

    res.json({
      success: true,
      ...data
    });
  } catch (error) {
    logger.error('Error fetching standard channels:', error.message);
    res.status(500).json({ error: 'Failed to fetch channels' });
  }
});

/**
 * GET /api/curated/premium
 * Get PREMIUM tier channels (all content)
 */
router.get('/premium', async (req, res) => {
  try {
    const data = await curatedChannelsService.getPremiumChannels();

    res.json({
      success: true,
      ...data
    });
  } catch (error) {
    logger.error('Error fetching premium channels:', error.message);
    res.status(500).json({ error: 'Failed to fetch channels' });
  }
});

/**
 * GET /api/curated/tier/:name
 * Get channels by tier name (dynamic)
 */
router.get('/tier/:name', async (req, res) => {
  try {
    const { name } = req.params;
    const data = await curatedChannelsService.getChannelsForTier(name);

    res.json({
      success: true,
      ...data
    });
  } catch (error) {
    logger.error(`Error fetching ${req.params.name} channels:`, error.message);
    res.status(500).json({ error: 'Failed to fetch channels' });
  }
});

/**
 * GET /api/curated/category/:name
 * Get channels by category (uses premium tier by default)
 */
router.get('/category/:name', async (req, res) => {
  try {
    const { name } = req.params;
    const tier = req.query.tier || 'PREMIUM';

    const channels = await curatedChannelsService.getCategoryChannels(name, tier);

    res.json({
      success: true,
      category: name,
      tier: tier,
      count: channels.length,
      channels
    });
  } catch (error) {
    logger.error(`Error fetching ${req.params.name} category:`, error.message);
    res.status(500).json({ error: 'Failed to fetch channels' });
  }
});

/**
 * GET /api/curated/search
 * Search curated channels
 */
router.get('/search', async (req, res) => {
  try {
    const { q, tier = 'PREMIUM' } = req.query;

    if (!q || q.length < 2) {
      return res.status(400).json({ error: 'Query must be at least 2 characters' });
    }

    const channels = await curatedChannelsService.searchChannels(q, tier);

    res.json({
      success: true,
      query: q,
      tier: tier,
      count: channels.length,
      channels
    });
  } catch (error) {
    logger.error('Error searching channels:', error.message);
    res.status(500).json({ error: 'Failed to search channels' });
  }
});

/**
 * POST /api/curated/block
 * Block a channel (admin only)
 */
router.post('/block', async (req, res) => {
  try {
    const { channelId, apiKey } = req.body;

    // Simple API key check (you should use proper auth)
    if (apiKey !== process.env.ADMIN_API_KEY) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    curatedChannelsService.blockChannel(channelId);

    res.json({
      success: true,
      message: `Channel ${channelId} blocked`
    });
  } catch (error) {
    logger.error('Error blocking channel:', error.message);
    res.status(500).json({ error: 'Failed to block channel' });
  }
});

/**
 * POST /api/curated/unblock
 * Unblock a channel (admin only)
 */
router.post('/unblock', async (req, res) => {
  try {
    const { channelId, apiKey } = req.body;

    if (apiKey !== process.env.ADMIN_API_KEY) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    curatedChannelsService.unblockChannel(channelId);

    res.json({
      success: true,
      message: `Channel ${channelId} unblocked`
    });
  } catch (error) {
    logger.error('Error unblocking channel:', error.message);
    res.status(500).json({ error: 'Failed to unblock channel' });
  }
});

export default router;
