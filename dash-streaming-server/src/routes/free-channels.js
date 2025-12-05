/**
 * FREE CHANNELS API - Legal Free Stream Endpoints
 *
 * Provides access to community-curated free IPTV streams
 * All streams are from legal sources (official broadcasters, iptv-org)
 *
 * Created: December 2025
 */

import express from 'express';
import freeIPTVService from '../services/free-iptv.service.js';
import logger from '../utils/logger.js';

const router = express.Router();

/**
 * GET /api/free/channels
 * Get DASH priority channels (West Africa + French + Sports)
 */
router.get('/channels', async (req, res) => {
  try {
    const channels = await freeIPTVService.getDashPriorityChannels();

    res.json({
      success: true,
      count: channels.length,
      source: 'iptv-org + direct',
      legal: true,
      channels
    });
  } catch (error) {
    logger.error('Error fetching free channels:', error.message);
    res.status(500).json({ error: 'Failed to fetch channels' });
  }
});

/**
 * GET /api/free/guinea
 * Get Guinea-specific channels
 */
router.get('/guinea', async (req, res) => {
  try {
    const channels = await freeIPTVService.getChannelsByCountry('gn');

    res.json({
      success: true,
      country: 'Guinea',
      count: channels.length,
      channels
    });
  } catch (error) {
    logger.error('Error fetching Guinea channels:', error.message);
    res.status(500).json({ error: 'Failed to fetch channels' });
  }
});

/**
 * GET /api/free/sports
 * Get African sports channels
 */
router.get('/sports', async (req, res) => {
  try {
    const channels = await freeIPTVService.getAfricanSports();

    res.json({
      success: true,
      category: 'African Sports',
      count: channels.length,
      channels
    });
  } catch (error) {
    logger.error('Error fetching sports channels:', error.message);
    res.status(500).json({ error: 'Failed to fetch channels' });
  }
});

/**
 * GET /api/free/french
 * Get French language channels
 */
router.get('/french', async (req, res) => {
  try {
    const channels = await freeIPTVService.getFrenchChannels();

    res.json({
      success: true,
      language: 'French',
      count: channels.length,
      channels
    });
  } catch (error) {
    logger.error('Error fetching French channels:', error.message);
    res.status(500).json({ error: 'Failed to fetch channels' });
  }
});

/**
 * GET /api/free/west-africa
 * Get all West African channels
 */
router.get('/west-africa', async (req, res) => {
  try {
    const channels = await freeIPTVService.getWestAfricanChannels();

    res.json({
      success: true,
      region: 'West Africa',
      count: channels.length,
      channels
    });
  } catch (error) {
    logger.error('Error fetching West African channels:', error.message);
    res.status(500).json({ error: 'Failed to fetch channels' });
  }
});

/**
 * GET /api/free/country/:code
 * Get channels by country code
 */
router.get('/country/:code', async (req, res) => {
  try {
    const { code } = req.params;
    const channels = await freeIPTVService.getChannelsByCountry(code);

    res.json({
      success: true,
      country: code.toUpperCase(),
      count: channels.length,
      channels
    });
  } catch (error) {
    logger.error(`Error fetching ${req.params.code} channels:`, error.message);
    res.status(500).json({ error: 'Failed to fetch channels' });
  }
});

/**
 * GET /api/free/category/:name
 * Get channels by category
 */
router.get('/category/:name', async (req, res) => {
  try {
    const { name } = req.params;
    const channels = await freeIPTVService.getChannelsByCategory(name);

    res.json({
      success: true,
      category: name,
      count: channels.length,
      channels
    });
  } catch (error) {
    logger.error(`Error fetching ${req.params.name} channels:`, error.message);
    res.status(500).json({ error: 'Failed to fetch channels' });
  }
});

/**
 * GET /api/free/test
 * Test stream availability (limited to prevent abuse)
 */
router.get('/test', async (req, res) => {
  try {
    const { url } = req.query;

    if (!url) {
      return res.status(400).json({ error: 'URL parameter required' });
    }

    const working = await freeIPTVService.testStream(url);

    res.json({
      url,
      working,
      testedAt: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error testing stream:', error.message);
    res.status(500).json({ error: 'Failed to test stream' });
  }
});

/**
 * GET /api/free/stats
 * Get statistics about available free channels
 */
router.get('/stats', async (req, res) => {
  try {
    const stats = await freeIPTVService.getStats();

    res.json({
      success: true,
      ...stats
    });
  } catch (error) {
    logger.error('Error fetching stats:', error.message);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// ===== NEW: iptv-org API Endpoints =====

/**
 * GET /api/free/api/channels
 * Get ALL channels from iptv-org API (full database)
 */
router.get('/api/channels', async (req, res) => {
  try {
    const channels = await freeIPTVService.getAPIChannels();

    res.json({
      success: true,
      count: channels.length,
      source: 'iptv-org-api',
      channels
    });
  } catch (error) {
    logger.error('Error fetching API channels:', error.message);
    res.status(500).json({ error: 'Failed to fetch channels' });
  }
});

/**
 * GET /api/free/api/streams
 * Get all streams from iptv-org API
 */
router.get('/api/streams', async (req, res) => {
  try {
    const streams = await freeIPTVService.getAPIStreams();

    res.json({
      success: true,
      count: streams.length,
      source: 'iptv-org-api',
      streams
    });
  } catch (error) {
    logger.error('Error fetching API streams:', error.message);
    res.status(500).json({ error: 'Failed to fetch streams' });
  }
});

/**
 * GET /api/free/api/country/:code
 * Get channels by country using API (more structured than M3U)
 */
router.get('/api/country/:code', async (req, res) => {
  try {
    const { code } = req.params;
    const channels = await freeIPTVService.getAPIChannelsByCountry(code);

    res.json({
      success: true,
      country: code.toUpperCase(),
      count: channels.length,
      source: 'iptv-org-api',
      channels
    });
  } catch (error) {
    logger.error(`Error fetching API ${req.params.code} channels:`, error.message);
    res.status(500).json({ error: 'Failed to fetch channels' });
  }
});

/**
 * GET /api/free/api/category/:name
 * Get channels by category using API
 */
router.get('/api/category/:name', async (req, res) => {
  try {
    const { name } = req.params;
    const channels = await freeIPTVService.getAPIChannelsByCategory(name);

    res.json({
      success: true,
      category: name,
      count: channels.length,
      source: 'iptv-org-api',
      channels
    });
  } catch (error) {
    logger.error(`Error fetching API ${req.params.name} channels:`, error.message);
    res.status(500).json({ error: 'Failed to fetch channels' });
  }
});

// ===== NEW: Scraper Zilla Endpoints (Auto-updates hourly!) =====

/**
 * GET /api/free/zilla/combined
 * Get ALL channels from Scraper Zilla (thousands, updated hourly)
 */
router.get('/zilla/combined', async (req, res) => {
  try {
    const channels = await freeIPTVService.getScraperZillaChannels('combined');

    res.json({
      success: true,
      count: channels.length,
      source: 'scraper-zilla',
      autoUpdated: true,
      updateFrequency: '1 hour',
      channels
    });
  } catch (error) {
    logger.error('Error fetching Zilla combined:', error.message);
    res.status(500).json({ error: 'Failed to fetch channels' });
  }
});

/**
 * GET /api/free/zilla/sports
 * Get sports channels from Scraper Zilla
 */
router.get('/zilla/sports', async (req, res) => {
  try {
    const channels = await freeIPTVService.getZillaSports();

    res.json({
      success: true,
      count: channels.length,
      source: 'scraper-zilla',
      category: 'sports',
      channels
    });
  } catch (error) {
    logger.error('Error fetching Zilla sports:', error.message);
    res.status(500).json({ error: 'Failed to fetch channels' });
  }
});

/**
 * GET /api/free/zilla/movies
 * Get movie channels from Scraper Zilla
 */
router.get('/zilla/movies', async (req, res) => {
  try {
    const channels = await freeIPTVService.getZillaMovies();

    res.json({
      success: true,
      count: channels.length,
      source: 'scraper-zilla',
      category: 'movies',
      channels
    });
  } catch (error) {
    logger.error('Error fetching Zilla movies:', error.message);
    res.status(500).json({ error: 'Failed to fetch channels' });
  }
});

/**
 * GET /api/free/zilla/anime
 * Get anime channels from Scraper Zilla
 */
router.get('/zilla/anime', async (req, res) => {
  try {
    const channels = await freeIPTVService.getZillaAnime();

    res.json({
      success: true,
      count: channels.length,
      source: 'scraper-zilla',
      category: 'anime',
      channels
    });
  } catch (error) {
    logger.error('Error fetching Zilla anime:', error.message);
    res.status(500).json({ error: 'Failed to fetch channels' });
  }
});

// ===== NEW: Super Combined Endpoints =====

/**
 * GET /api/free/all-sports
 * Get ALL sports from ALL sources (API + Zilla + Official)
 */
router.get('/all-sports', async (req, res) => {
  try {
    const channels = await freeIPTVService.getAllSports();

    res.json({
      success: true,
      count: channels.length,
      sources: ['iptv-org-api', 'scraper-zilla', 'official-broadcasters'],
      channels
    });
  } catch (error) {
    logger.error('Error fetching all sports:', error.message);
    res.status(500).json({ error: 'Failed to fetch channels' });
  }
});

/**
 * GET /api/free/mega
 * Get MEGA list - ALL channels from ALL sources combined
 */
router.get('/mega', async (req, res) => {
  try {
    const channels = await freeIPTVService.getMegaList();

    res.json({
      success: true,
      count: channels.length,
      sources: ['dash-priority', 'iptv-org-api', 'scraper-zilla', 'official'],
      description: 'Combined super-list from all sources',
      channels
    });
  } catch (error) {
    logger.error('Error fetching mega list:', error.message);
    res.status(500).json({ error: 'Failed to fetch channels' });
  }
});

export default router;
