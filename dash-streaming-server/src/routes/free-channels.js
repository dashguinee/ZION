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
    const [guinea, sports, french, westAfrica] = await Promise.all([
      freeIPTVService.getChannelsByCountry('gn'),
      freeIPTVService.getAfricanSports(),
      freeIPTVService.getFrenchChannels(),
      freeIPTVService.getWestAfricanChannels()
    ]);

    res.json({
      success: true,
      stats: {
        guinea: guinea.length,
        africanSports: sports.length,
        french: french.length,
        westAfrica: westAfrica.length
      },
      sources: ['iptv-org', 'direct-broadcasters'],
      legal: true,
      lastUpdated: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error fetching stats:', error.message);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

export default router;
