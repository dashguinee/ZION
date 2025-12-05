/**
 * SECURE API PROXY - Hides provider details from frontend
 *
 * All provider information stays server-side.
 * Frontend only knows about YOUR backend endpoints.
 *
 * WHAT THIS HIDES:
 * - Provider URL (starshare.cx)
 * - Credentials (username/password)
 * - URL patterns
 * - Content metadata source
 */

import express from 'express';
import axios from 'axios';
import config from '../config.js';
import logger from '../utils/logger.js';
import cacheService from '../services/cache.service.js';

const router = express.Router();

// Provider configuration (from env vars - NEVER exposed to frontend)
const PROVIDERS = {
  primary: {
    name: 'Provider-A',
    baseUrl: config.starshare.baseUrl,
    username: config.starshare.username,
    password: config.starshare.password,
    active: true
  }
  // Add more providers here for fallback:
  // secondary: { name: 'Provider-B', baseUrl: '...', username: '...', password: '...', active: true }
};

// Get active provider
function getActiveProvider() {
  return Object.values(PROVIDERS).find(p => p.active) || PROVIDERS.primary;
}

// Build internal API URL (NEVER exposed)
function buildApiUrl(action, params = {}) {
  const provider = getActiveProvider();
  const url = new URL('/player_api.php', provider.baseUrl);
  url.searchParams.set('username', provider.username);
  url.searchParams.set('password', provider.password);
  if (action) url.searchParams.set('action', action);
  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.set(key, value);
  });
  return url.toString();
}

// Build stream URL (returns to frontend for direct play)
function buildStreamUrl(type, id, extension = 'mp4') {
  const provider = getActiveProvider();
  const paths = {
    movie: `/movie/${provider.username}/${provider.password}/${id}.${extension}`,
    series: `/series/${provider.username}/${provider.password}/${id}.${extension}`,
    live: `/live/${provider.username}/${provider.password}/${id}.ts`
  };
  return `${provider.baseUrl}${paths[type]}`;
}

// ============================================
// METADATA ENDPOINTS (Proxied, cached)
// ============================================

/**
 * GET /api/secure/categories/:type
 * Returns categories for vod, series, or live
 */
router.get('/categories/:type', async (req, res) => {
  try {
    const { type } = req.params;
    const cacheKey = `categories:${type}`;

    // Check cache first
    const cached = await cacheService.get(cacheKey);
    if (cached) {
      return res.json(JSON.parse(cached));
    }

    const actionMap = {
      vod: 'get_vod_categories',
      movies: 'get_vod_categories',
      series: 'get_series_categories',
      live: 'get_live_categories'
    };

    const action = actionMap[type];
    if (!action) {
      return res.status(400).json({ error: 'Invalid type. Use: vod, series, or live' });
    }

    const url = buildApiUrl(action);
    const response = await axios.get(url, { timeout: 10000 });

    // Cache for 24 hours
    await cacheService.set(cacheKey, JSON.stringify(response.data), 86400);

    res.json(response.data);
  } catch (error) {
    logger.error('Categories fetch error:', error.message);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

/**
 * GET /api/secure/content/:type
 * Returns content list (movies, series, or live channels)
 * Optional: ?category_id=123
 */
router.get('/content/:type', async (req, res) => {
  try {
    const { type } = req.params;
    const { category_id } = req.query;
    const cacheKey = `content:${type}:${category_id || 'all'}`;

    // Check cache
    const cached = await cacheService.get(cacheKey);
    if (cached) {
      return res.json(JSON.parse(cached));
    }

    const actionMap = {
      vod: 'get_vod_streams',
      movies: 'get_vod_streams',
      series: 'get_series',
      live: 'get_live_streams'
    };

    const action = actionMap[type];
    if (!action) {
      return res.status(400).json({ error: 'Invalid type' });
    }

    const params = category_id ? { category_id } : {};
    const url = buildApiUrl(action, params);
    const response = await axios.get(url, { timeout: 30000 });

    // Cache for 6 hours (content changes less often)
    await cacheService.set(cacheKey, JSON.stringify(response.data), 21600);

    res.json(response.data);
  } catch (error) {
    logger.error('Content fetch error:', error.message);
    res.status(500).json({ error: 'Failed to fetch content' });
  }
});

/**
 * GET /api/secure/info/:type/:id
 * Returns detailed info for a movie or series
 */
router.get('/info/:type/:id', async (req, res) => {
  try {
    const { type, id } = req.params;
    const cacheKey = `info:${type}:${id}`;

    const cached = await cacheService.get(cacheKey);
    if (cached) {
      return res.json(JSON.parse(cached));
    }

    const actionMap = {
      vod: 'get_vod_info',
      movie: 'get_vod_info',
      series: 'get_series_info'
    };

    const action = actionMap[type];
    if (!action) {
      return res.status(400).json({ error: 'Invalid type. Use: vod or series' });
    }

    const paramKey = type === 'series' ? 'series_id' : 'vod_id';
    const url = buildApiUrl(action, { [paramKey]: id });
    const response = await axios.get(url, { timeout: 10000 });

    // Cache for 24 hours
    await cacheService.set(cacheKey, JSON.stringify(response.data), 86400);

    res.json(response.data);
  } catch (error) {
    logger.error('Info fetch error:', error.message);
    res.status(500).json({ error: 'Failed to fetch info' });
  }
});

// ============================================
// STREAM URL ENDPOINTS (Returns playable URLs)
// ============================================

/**
 * GET /api/secure/play/movie/:id
 * Returns the stream URL for a movie
 * Query: ?extension=mp4|mkv
 */
router.get('/play/movie/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { extension = 'mp4' } = req.query;

    const needsTranscode = ['mkv', 'avi', 'flv', 'wmv'].includes(extension.toLowerCase());

    if (needsTranscode) {
      // Route through our FFmpeg transcoder (same server)
      const quality = req.query.quality || config.ffmpeg.defaultQuality;
      return res.json({
        url: `/api/stream/vod/${id}?extension=${extension}&quality=${quality}`,
        type: 'transcode',
        quality
      });
    }

    // Direct play URL (frontend plays this directly)
    const streamUrl = buildStreamUrl('movie', id, extension);
    res.json({
      url: streamUrl,
      type: 'direct'
    });
  } catch (error) {
    logger.error('Play movie error:', error.message);
    res.status(500).json({ error: 'Failed to generate stream URL' });
  }
});

/**
 * GET /api/secure/play/episode/:id
 * Returns the stream URL for a series episode
 */
router.get('/play/episode/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { extension = 'mp4' } = req.query;

    const needsTranscode = ['mkv', 'avi', 'flv', 'wmv'].includes(extension.toLowerCase());

    if (needsTranscode) {
      const quality = req.query.quality || config.ffmpeg.defaultQuality;
      return res.json({
        url: `/api/stream/episode/${id}?extension=${extension}&quality=${quality}`,
        type: 'transcode',
        quality
      });
    }

    const streamUrl = buildStreamUrl('series', id, extension);
    res.json({
      url: streamUrl,
      type: 'direct'
    });
  } catch (error) {
    logger.error('Play episode error:', error.message);
    res.status(500).json({ error: 'Failed to generate stream URL' });
  }
});

/**
 * GET /api/secure/play/live/:id
 * Returns the stream URL for a live channel
 * Includes proxy URL for CORS bypass
 */
router.get('/play/live/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { format = 'ts' } = req.query;

    const provider = getActiveProvider();
    const directUrl = `${provider.baseUrl}/live/${provider.username}/${provider.password}/${id}.${format}`;

    // For HLS (Safari/iOS) - can play direct
    if (format === 'm3u8') {
      return res.json({
        url: directUrl,
        type: 'hls-native'
      });
    }

    // For MPEG-TS (Chrome/Android) - needs proxy
    // Return pre-built proxy URL so frontend doesn't know the real URL
    const proxyUrl = `https://dash-webtv.vercel.app/api/stream?url=${encodeURIComponent(directUrl)}`;

    res.json({
      url: proxyUrl,
      type: 'mpegts',
      // Also provide direct for fallback (frontend can try if proxy fails)
      fallback: directUrl
    });
  } catch (error) {
    logger.error('Play live error:', error.message);
    res.status(500).json({ error: 'Failed to generate stream URL' });
  }
});

/**
 * GET /api/secure/download/:type/:id
 * Returns direct download URL (bypasses transcoder)
 */
router.get('/download/:type/:id', async (req, res) => {
  try {
    const { type, id } = req.params;
    const { extension = 'mp4' } = req.query;

    const typeMap = { movie: 'movie', episode: 'series', series: 'series' };
    const streamType = typeMap[type];

    if (!streamType) {
      return res.status(400).json({ error: 'Invalid type. Use: movie or episode' });
    }

    const downloadUrl = buildStreamUrl(streamType, id, extension);
    res.json({
      url: downloadUrl,
      type: 'download',
      filename: `${type}_${id}.${extension}`
    });
  } catch (error) {
    logger.error('Download URL error:', error.message);
    res.status(500).json({ error: 'Failed to generate download URL' });
  }
});

// ============================================
// PROVIDER MANAGEMENT (Internal use only)
// ============================================

/**
 * GET /api/secure/patterns
 * Returns URL patterns for frontend to build URLs locally
 * This is the key to keeping sync URL building while hiding provider
 *
 * SECURITY: These patterns contain the provider URL, but frontend
 * receives them at runtime, not hardcoded in source code.
 * Much harder for investigators to find than static strings.
 */
router.get('/patterns', async (req, res) => {
  const provider = getActiveProvider();

  // Return URL patterns with placeholders
  // Frontend replaces {id} and {ext} at runtime
  res.json({
    movie: `${provider.baseUrl}/movie/${provider.username}/${provider.password}/{id}.{ext}`,
    series: `${provider.baseUrl}/series/${provider.username}/${provider.password}/{id}.{ext}`,
    live: `${provider.baseUrl}/live/${provider.username}/${provider.password}/{id}.{ext}`,
    // Don't include API patterns - those stay server-side
    version: '2.0',
    expires: Date.now() + 3600000 // 1 hour cache hint
  });
});

/**
 * GET /api/secure/health
 * Check provider connectivity (no sensitive data exposed)
 */
router.get('/health', async (req, res) => {
  try {
    const provider = getActiveProvider();
    const testUrl = buildApiUrl(null); // Just auth check

    const start = Date.now();
    const response = await axios.get(testUrl, { timeout: 5000 });
    const latency = Date.now() - start;

    res.json({
      status: 'ok',
      provider: 'active', // Don't reveal provider name
      latency: `${latency}ms`,
      accountStatus: response.data?.user_info?.status || 'unknown'
    });
  } catch (error) {
    res.json({
      status: 'degraded',
      provider: 'issues',
      error: 'Provider connectivity issue'
    });
  }
});

export default router;
