/**
 * French VOD API Routes
 *
 * Endpoints for French movies and series using embed APIs
 *
 * Created: December 5, 2025
 */

import express from 'express';
import frenchVOD from '../services/french-vod.service.js';
import streamExtractor from '../services/stream-extractor.service.js';
import frenchLiveTV from '../services/french-livetv.service.js';
import logger from '../utils/logger.js';

const router = express.Router();

/**
 * GET /api/french-vod/stats
 * Get provider stats and content estimates
 */
router.get('/stats', (req, res) => {
  res.json({
    success: true,
    ...frenchVOD.getProviderStats()
  });
});

/**
 * GET /api/french-vod/movies
 * Get popular French movies
 */
router.get('/movies', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const data = await frenchVOD.getFrenchMovies(page);

    res.json({
      success: true,
      ...data
    });
  } catch (error) {
    logger.error('Error in /french-vod/movies:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/french-vod/series
 * Get popular French TV series
 */
router.get('/series', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const data = await frenchVOD.getFrenchSeries(page);

    res.json({
      success: true,
      ...data
    });
  } catch (error) {
    logger.error('Error in /french-vod/series:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/french-vod/search
 * Search French movies
 */
router.get('/search', async (req, res) => {
  try {
    const { q, page = 1 } = req.query;

    if (!q) {
      return res.status(400).json({ success: false, error: 'Query parameter "q" is required' });
    }

    const data = await frenchVOD.searchFrenchMovies(q, parseInt(page));

    res.json({
      success: true,
      query: q,
      ...data
    });
  } catch (error) {
    logger.error('Error in /french-vod/search:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/french-vod/movie/:id
 * Get movie details with embed URLs
 */
router.get('/movie/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const movie = await frenchVOD.getMovieDetails(id);

    if (!movie) {
      return res.status(404).json({ success: false, error: 'Movie not found' });
    }

    res.json({
      success: true,
      movie
    });
  } catch (error) {
    logger.error('Error in /french-vod/movie:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/french-vod/embed/movie/:id
 * Get embed URL for a movie
 */
router.get('/embed/movie/:id', (req, res) => {
  const { id } = req.params;
  const { provider = 'vidsrc' } = req.query;

  const embedUrl = frenchVOD.getMovieEmbed(id, provider);

  res.json({
    success: true,
    id,
    provider,
    embed_url: embedUrl,
    all_embeds: frenchVOD.getAllMovieEmbeds(id)
  });
});

/**
 * GET /api/french-vod/embed/series/:id/:season/:episode
 * Get embed URL for a TV series episode
 */
router.get('/embed/series/:id/:season/:episode', (req, res) => {
  const { id, season, episode } = req.params;
  const { provider = 'vidsrc' } = req.query;

  const embedUrl = frenchVOD.getSeriesEmbed(id, season, episode, provider);

  res.json({
    success: true,
    id,
    season: parseInt(season),
    episode: parseInt(episode),
    provider,
    embed_url: embedUrl
  });
});

/**
 * GET /api/french-vod/curated
 * Get curated French movie collection
 */
router.get('/curated', async (req, res) => {
  try {
    const movies = await frenchVOD.getCuratedFrenchMovies();

    res.json({
      success: true,
      count: movies.length,
      collection: 'French Cinema Essentials',
      movies
    });
  } catch (error) {
    logger.error('Error in /french-vod/curated:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/french-vod/stream/movie/:id
 * Extract direct stream URL for a movie (bypasses ads)
 */
router.get('/stream/movie/:id', async (req, res) => {
  try {
    const { id } = req.params;
    logger.info(`[StreamExtract] Movie request: ${id}`);

    const stream = await streamExtractor.extractStream(id, 'movie');

    if (!stream) {
      return res.status(404).json({
        success: false,
        error: 'Could not extract stream - try again later'
      });
    }

    res.json({
      success: true,
      tmdb_id: id,
      type: 'movie',
      stream: {
        url: stream.url,
        provider: stream.provider,
        server: stream.server,
        format: stream.format || 'hls',
        subtitles: stream.subtitles || []
      }
    });
  } catch (error) {
    logger.error('[StreamExtract] Movie error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/french-vod/stream/tv/:id/:season/:episode
 * Extract direct stream URL for a TV episode
 */
router.get('/stream/tv/:id/:season/:episode', async (req, res) => {
  try {
    const { id, season, episode } = req.params;
    logger.info(`[StreamExtract] TV request: ${id} S${season}E${episode}`);

    const stream = await streamExtractor.extractStream(id, 'tv', season, episode);

    if (!stream) {
      return res.status(404).json({
        success: false,
        error: 'Could not extract stream - try again later'
      });
    }

    res.json({
      success: true,
      tmdb_id: id,
      type: 'tv',
      season: parseInt(season),
      episode: parseInt(episode),
      stream: {
        url: stream.url,
        provider: stream.provider,
        server: stream.server,
        format: stream.format || 'hls',
        subtitles: stream.subtitles || []
      }
    });
  } catch (error) {
    logger.error('[StreamExtract] TV error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/french-vod/proxy
 * Proxy stream with proper headers (for CORS issues)
 */
router.get('/proxy', async (req, res) => {
  try {
    const { url, referer } = req.query;

    if (!url) {
      return res.status(400).json({ success: false, error: 'URL required' });
    }

    const proxyRes = await streamExtractor.proxyStream(url, referer);

    // Forward headers
    res.set('Content-Type', proxyRes.headers.get('content-type') || 'application/vnd.apple.mpegurl');
    res.set('Access-Control-Allow-Origin', '*');

    // Pipe response
    proxyRes.body.pipe(res);
  } catch (error) {
    logger.error('[Proxy] Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/french-vod/streams/all/movie/:id
 * Get ALL available streams from ALL providers for a movie
 */
router.get('/streams/all/movie/:id', async (req, res) => {
  try {
    const { id } = req.params;
    logger.info(`[AllStreams] Movie request: ${id}`);

    const streams = await streamExtractor.extractAllStreams(id, 'movie');

    res.json({
      success: true,
      tmdb_id: id,
      type: 'movie',
      provider_count: new Set(streams.map(s => s.provider)).size,
      stream_count: streams.length,
      streams: streams.map(s => ({
        url: s.url,
        provider: s.provider,
        server: s.server,
        quality: s.quality || '720p',
        format: s.format || 'hls',
        subtitles: s.subtitles || []
      }))
    });
  } catch (error) {
    logger.error('[AllStreams] Movie error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/french-vod/streams/all/tv/:id/:season/:episode
 * Get ALL available streams from ALL providers for a TV episode
 */
router.get('/streams/all/tv/:id/:season/:episode', async (req, res) => {
  try {
    const { id, season, episode } = req.params;
    logger.info(`[AllStreams] TV request: ${id} S${season}E${episode}`);

    const streams = await streamExtractor.extractAllStreams(id, 'tv', season, episode);

    res.json({
      success: true,
      tmdb_id: id,
      type: 'tv',
      season: parseInt(season),
      episode: parseInt(episode),
      provider_count: new Set(streams.map(s => s.provider)).size,
      stream_count: streams.length,
      streams: streams.map(s => ({
        url: s.url,
        provider: s.provider,
        server: s.server,
        quality: s.quality || '720p',
        format: s.format || 'hls',
        subtitles: s.subtitles || []
      }))
    });
  } catch (error) {
    logger.error('[AllStreams] TV error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/french-vod/providers
 * List all available stream providers
 */
router.get('/providers', (req, res) => {
  res.json({
    success: true,
    providers: [
      { name: 'Vixsrc', status: 'active', format: 'hls', description: 'Primary - direct HLS extraction' },
      { name: 'VidZee', status: 'active', format: 'hls/mp4', description: 'AES-256 encrypted, 10 servers' },
      { name: 'MP4Hydra', status: 'active', format: 'mp4', description: 'Direct MP4 downloads with subs' },
      { name: 'VidSrcMe', status: 'active', format: 'hls', description: 'Multiple embedded sources' },
      { name: 'MultiEmbed', status: 'active', format: 'hls', description: 'Hunter decryption' },
      { name: 'EmbedSu', status: 'active', format: 'hls', description: 'Alternative embed source' },
      { name: 'VidSrcRip', status: 'active', format: 'hls', description: 'VidSrc mirror' },
      { name: 'AutoEmbed', status: 'active', format: 'hls', description: 'Auto-selecting embed' },
      { name: 'Smashy', status: 'active', format: 'hls', description: 'Smashy stream' },
      { name: 'VidLink', status: 'active', format: 'hls', description: 'VidLink streams' },
    ]
  });
});

// ============================================
// FRENCH LIVE TV ENDPOINTS
// ============================================

/**
 * GET /api/french-vod/livetv/channels
 * Get all French live TV channels
 */
router.get('/livetv/channels', async (req, res) => {
  try {
    const channels = await frenchLiveTV.getFrenchChannels();

    res.json({
      success: true,
      count: channels.length,
      source: 'iptv-org',
      channels
    });
  } catch (error) {
    logger.error('Error in /french-vod/livetv/channels:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/french-vod/livetv/featured
 * Get featured/popular French channels
 */
router.get('/livetv/featured', async (req, res) => {
  try {
    const { featured, rest } = await frenchLiveTV.getFeaturedChannels();

    res.json({
      success: true,
      featured: {
        count: featured.length,
        channels: featured
      },
      other: {
        count: rest.length,
        channels: rest.slice(0, 50) // First 50 others
      }
    });
  } catch (error) {
    logger.error('Error in /french-vod/livetv/featured:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/french-vod/livetv/groups
 * Get channel categories/groups
 */
router.get('/livetv/groups', async (req, res) => {
  try {
    const groups = await frenchLiveTV.getGroups();

    res.json({
      success: true,
      count: groups.length,
      groups
    });
  } catch (error) {
    logger.error('Error in /french-vod/livetv/groups:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/french-vod/livetv/search
 * Search French channels
 */
router.get('/livetv/search', async (req, res) => {
  try {
    const { q } = req.query;

    if (!q) {
      return res.status(400).json({ success: false, error: 'Query "q" required' });
    }

    const channels = await frenchLiveTV.searchChannels(q);

    res.json({
      success: true,
      query: q,
      count: channels.length,
      channels
    });
  } catch (error) {
    logger.error('Error in /french-vod/livetv/search:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/french-vod/livetv/channel/:id
 * Get single channel by ID
 */
router.get('/livetv/channel/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const channel = await frenchLiveTV.getChannel(id);

    if (!channel) {
      return res.status(404).json({ success: false, error: 'Channel not found' });
    }

    res.json({
      success: true,
      channel
    });
  } catch (error) {
    logger.error('Error in /french-vod/livetv/channel:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
