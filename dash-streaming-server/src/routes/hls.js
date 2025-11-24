import express from 'express';
import hlsService from '../services/hls.service.js';
import logger from '../utils/logger.js';

const router = express.Router();

/**
 * GET /api/hls/:streamId/master.m3u8
 * Serve HLS master playlist
 */
router.get('/:streamId/master.m3u8', async (req, res) => {
  const { streamId } = req.params;

  try {
    const playlist = await hlsService.getMasterPlaylist(streamId);

    res.setHeader('Content-Type', 'application/vnd.apple.mpegurl');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cache-Control', 'public, max-age=3600');

    res.send(playlist);

  } catch (error) {
    logger.error(`Master playlist error: ${error.message}`);
    res.status(404).json({ error: 'Playlist not found' });
  }
});

/**
 * GET /api/hls/:streamId/:variant.m3u8
 * Serve HLS variant playlist (specific quality level)
 */
router.get('/:streamId/:variant.m3u8', async (req, res) => {
  const { streamId, variant } = req.params;

  try {
    const playlist = await hlsService.getVariantPlaylist(streamId, variant.replace('.m3u8', ''));

    res.setHeader('Content-Type', 'application/vnd.apple.mpegurl');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cache-Control', 'public, max-age=3600');

    res.send(playlist);

  } catch (error) {
    logger.error(`Variant playlist error: ${error.message}`);
    res.status(404).json({ error: 'Variant playlist not found' });
  }
});

/**
 * GET /api/hls/:streamId/:segment.ts
 * Serve HLS segment file
 */
router.get('/:streamId/:segment.ts', async (req, res) => {
  const { streamId, segment } = req.params;
  const segmentName = `${segment}.ts`;

  try {
    const data = await hlsService.getSegment(streamId, segmentName);

    res.setHeader('Content-Type', 'video/MP2T');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cache-Control', 'public, max-age=86400'); // Cache segments for 24h

    res.send(data);

  } catch (error) {
    logger.error(`Segment error: ${error.message}`);
    res.status(404).json({ error: 'Segment not found' });
  }
});

export default router;
