import express from 'express';
import starshareService from '../services/starshare.service.js';
import cacheService from '../services/cache.service.js';
import logger from '../utils/logger.js';

const router = express.Router();

/**
 * GET /api/live/:streamId
 * Resolve Live TV redirect and return final streaming URL
 *
 * Live TV uses a redirect-based system:
 * 1. Request: /username/password/streamId (NO extension)
 * 2. Server responds with HTTP 302 redirect
 * 3. Redirect URL contains token and points to actual streaming server
 * 4. We cache this token URL for 5 minutes
 */
router.get('/:streamId', async (req, res) => {
  const { streamId } = req.params;

  try {
    logger.info(`Live TV request: ${streamId}`);

    // Resolve the redirect and get final URL with token
    const result = await starshareService.resolveLiveUrl(streamId);

    // Return the resolved URL and metadata
    res.json({
      success: true,
      streamId,
      url: result.url,
      cached: result.cached,
      timestamp: result.timestamp,
      expiresIn: 300 // Token expires in 5 minutes
    });

  } catch (error) {
    logger.error(`Live TV error: ${error.message}`);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/live/:streamId/direct
 * Directly proxy the live stream (for players that don't support URL resolution)
 */
router.get('/:streamId/direct', async (req, res) => {
  const { streamId } = req.params;

  try {
    logger.info(`Live TV direct proxy: ${streamId}`);

    // Resolve the redirect
    const result = await starshareService.resolveLiveUrl(streamId);

    // Fetch the actual stream
    const streamData = await starshareService.fetchStream(result.url);

    // Set appropriate headers
    res.setHeader('Content-Type', 'video/MP2T'); // MPEG-TS format for live TV
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cache-Control', 'no-cache');

    // Pipe the stream
    streamData.pipe(res);

    streamData.on('error', (err) => {
      logger.error(`Live stream error: ${err.message}`);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Streaming error' });
      }
    });

  } catch (error) {
    logger.error(`Live TV direct error: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/live/:streamId/refresh
 * Force refresh the Live TV token (bypass cache)
 */
router.get('/:streamId/refresh', async (req, res) => {
  const { streamId } = req.params;

  try {
    logger.info(`Live TV token refresh: ${streamId}`);

    // Delete cached token
    const cacheKey = `live:token:${streamId}`;
    await cacheService.del(cacheKey);

    // Resolve fresh token
    const result = await starshareService.resolveLiveUrl(streamId);

    res.json({
      success: true,
      streamId,
      url: result.url,
      cached: false,
      timestamp: result.timestamp,
      message: 'Token refreshed successfully'
    });

  } catch (error) {
    logger.error(`Live TV refresh error: ${error.message}`);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;
