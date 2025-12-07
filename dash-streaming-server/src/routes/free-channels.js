/**
 * FREE CHANNELS API - Verified Working Stream Endpoints
 *
 * WORKING SOURCES (December 7, 2025):
 * - iptv-org: PRIMARY (38K channels, ~85% working)
 * - Free-TV: CURATED (1,851 channels, ~60% working)
 * - Verified: GUARANTEED (hand-tested streams)
 *
 * ARCHIVED/BROKEN (disabled but documented):
 * - Scraper Zilla: jmp2.uk redirects broken
 * - M3U8-Xtream: zplaypro.lat offline
 * - PlutoTV: US geo-blocked
 *
 * Created: December 2025
 * Updated: December 7, 2025 - Removed broken endpoints
 */

import express from 'express';
import freeIPTVService from '../services/free-iptv.service.js';
import logger from '../utils/logger.js';

const router = express.Router();

// ===============================================
// VERIFIED CHANNELS (Guaranteed Working)
// Hand-tested December 7, 2025
// ===============================================

/**
 * GET /api/free/verified
 * Get ALL verified working channels (the gold list)
 */
router.get('/verified', async (req, res) => {
  try {
    const channels = freeIPTVService.getAllVerifiedChannels();

    res.json({
      success: true,
      count: channels.length,
      verified: true,
      verifiedDate: '2025-12-07',
      description: 'Hand-tested guaranteed working streams',
      channels
    });
  } catch (error) {
    logger.error('Error fetching verified channels:', error.message);
    res.status(500).json({ error: 'Failed to fetch channels' });
  }
});

/**
 * GET /api/free/verified/guinea
 * Get verified Guinea channels only
 */
router.get('/verified/guinea', async (req, res) => {
  try {
    const channels = freeIPTVService.getVerifiedGuineaChannels();

    res.json({
      success: true,
      count: channels.length,
      country: 'Guinea',
      verified: true,
      channels
    });
  } catch (error) {
    logger.error('Error fetching verified Guinea:', error.message);
    res.status(500).json({ error: 'Failed to fetch channels' });
  }
});

/**
 * GET /api/free/verified/sports
 * Get verified sports channels only
 */
router.get('/verified/sports', async (req, res) => {
  try {
    const channels = freeIPTVService.getVerifiedSportsChannels();

    res.json({
      success: true,
      count: channels.length,
      category: 'Sports',
      verified: true,
      channels
    });
  } catch (error) {
    logger.error('Error fetching verified sports:', error.message);
    res.status(500).json({ error: 'Failed to fetch channels' });
  }
});

/**
 * GET /api/free/verified/french
 * Get verified French channels only
 */
router.get('/verified/french', async (req, res) => {
  try {
    const channels = freeIPTVService.getVerifiedFrenchChannels();

    res.json({
      success: true,
      count: channels.length,
      language: 'French',
      verified: true,
      channels
    });
  } catch (error) {
    logger.error('Error fetching verified French:', error.message);
    res.status(500).json({ error: 'Failed to fetch channels' });
  }
});

// ===============================================
// PRIMARY ENDPOINTS (Recommended for App)
// ===============================================

/**
 * GET /api/free/channels
 * MAIN ENDPOINT - DASH priority channels (Verified + Guinea + Sports + French)
 */
router.get('/channels', async (req, res) => {
  try {
    const channels = await freeIPTVService.getDashPriorityChannels();

    res.json({
      success: true,
      count: channels.length,
      sources: ['verified', 'iptv-org'],
      description: 'DASH priority: Guinea + Sports + French',
      channels
    });
  } catch (error) {
    logger.error('Error fetching free channels:', error.message);
    res.status(500).json({ error: 'Failed to fetch channels' });
  }
});

/**
 * GET /api/free/guinea
 * Guinea-specific channels (verified + iptv-org)
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
 * African sports channels
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
 * French language channels
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
 * All West African channels
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

// ===============================================
// IPTV-ORG ENDPOINTS (Primary Source)
// ===============================================

/**
 * GET /api/free/country/:code
 * Get channels by country code (iptv-org)
 */
router.get('/country/:code', async (req, res) => {
  try {
    const { code } = req.params;
    const channels = await freeIPTVService.getChannelsByCountry(code);

    res.json({
      success: true,
      country: code.toUpperCase(),
      source: 'iptv-org',
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
 * Get channels by category (iptv-org)
 */
router.get('/category/:name', async (req, res) => {
  try {
    const { name } = req.params;
    const channels = await freeIPTVService.getChannelsByCategory(name);

    res.json({
      success: true,
      category: name,
      source: 'iptv-org',
      count: channels.length,
      channels
    });
  } catch (error) {
    logger.error(`Error fetching ${req.params.name} channels:`, error.message);
    res.status(500).json({ error: 'Failed to fetch channels' });
  }
});

// ===============================================
// FREE-TV ENDPOINT (Quality Curated)
// ===============================================

/**
 * GET /api/free/freetv
 * Get channels from Free-TV (quality curated, HD preferred)
 */
router.get('/freetv', async (req, res) => {
  try {
    const channels = await freeIPTVService.getFreeTVChannels();

    res.json({
      success: true,
      count: channels.length,
      source: 'free-tv',
      description: 'Quality curated, HD preferred, EPG support',
      channels
    });
  } catch (error) {
    logger.error('Error fetching Free-TV:', error.message);
    res.status(500).json({ error: 'Failed to fetch channels' });
  }
});

// ===============================================
// SCRAPER ZILLA ENDPOINT (Filtered Working)
// ===============================================

/**
 * GET /api/free/scraper-zilla
 * Get working channels from Scraper Zilla (filtered to working domains only)
 */
router.get('/scraper-zilla', async (req, res) => {
  try {
    const channels = await freeIPTVService.getScraperZillaChannels();

    res.json({
      success: true,
      count: channels.length,
      source: 'scraper-zilla',
      workingDomains: ['sofast.tv', 'tubi.io', 'a1xs.vip', 'tvpass.org'],
      description: '1,041 working streams filtered from 20K+ (broken domains excluded)',
      channels
    });
  } catch (error) {
    logger.error('Error fetching Scraper-Zilla:', error.message);
    res.status(500).json({ error: 'Failed to fetch channels' });
  }
});

// ===============================================
// ULTIMATE COMBINED LIST
// ===============================================

/**
 * GET /api/free/ultimate
 * Get all channels from all working sources combined
 */
router.get('/ultimate', async (req, res) => {
  try {
    const channels = await freeIPTVService.getUltimateList();

    res.json({
      success: true,
      count: channels.length,
      sources: ['verified', 'iptv-org', 'free-tv', 'scraper-zilla'],
      description: 'All working sources combined (including filtered Scraper Zilla)',
      channels
    });
  } catch (error) {
    logger.error('Error fetching ultimate:', error.message);
    res.status(500).json({ error: 'Failed to fetch' });
  }
});

// ===============================================
// HEALTH & STATS
// ===============================================

/**
 * GET /api/free/stats
 * Get statistics about sources and availability
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

/**
 * GET /api/free/health
 * Check health of a specific stream URL
 */
router.get('/health', async (req, res) => {
  try {
    const { url } = req.query;

    if (!url) {
      return res.status(400).json({ error: 'URL parameter required' });
    }

    const health = await freeIPTVService.getStreamHealth(url);

    res.json({
      success: true,
      ...health
    });
  } catch (error) {
    logger.error('Error checking stream health:', error.message);
    res.status(500).json({ error: 'Failed to check health' });
  }
});

/**
 * GET /api/free/test
 * Quick test if a stream URL is working
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

// ===============================================
// ARCHIVED SOURCES (Documented but disabled)
// These return errors explaining why they're broken
// ===============================================

/**
 * GET /api/free/archived/:source
 * Get info about archived/broken sources
 */
router.get('/archived/:source', async (req, res) => {
  const { source } = req.params;

  const archivedInfo = {
    'scraper-zilla': {
      name: 'IPTV Scraper Zilla',
      status: 'broken',
      reason: 'jmp2.uk redirects return 404, pixelstreams return 403',
      lastChecked: '2025-12-07',
      originalUrl: 'https://raw.githubusercontent.com/abusaeeidx/IPTV-Scraper-Zilla/main/combined-playlist.m3u',
      totalChannels: 20557,
      workingChannels: '~10%'
    },
    'm3u8-xtream': {
      name: 'M3U8-Xtream TMDB Movies',
      status: 'broken',
      reason: 'zplaypro.lat provider offline (HTTP 521)',
      lastChecked: '2025-12-07',
      originalUrl: 'https://aymrgknetzpucldhpkwm.supabase.co/storage/v1/object/public/tmdb/top-movies.m3u',
      totalMovies: 4000,
      workingStreams: 0
    },
    'plutotv': {
      name: 'PlutoTV',
      status: 'geo_blocked',
      reason: 'US only - returns HTTP 400 from outside US',
      lastChecked: '2025-12-07',
      originalUrl: 'https://raw.githubusercontent.com/iptv-org/iptv/master/streams/us_pluto.m3u',
      totalChannels: 328,
      workaround: 'Requires US VPN or proxy'
    }
  };

  if (archivedInfo[source]) {
    res.json({
      success: true,
      archived: true,
      ...archivedInfo[source]
    });
  } else {
    res.status(404).json({
      error: 'Unknown archived source',
      available: Object.keys(archivedInfo)
    });
  }
});

export default router;
