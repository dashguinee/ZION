import express from 'express';
import starshareService from '../services/starshare.service.js';
import ffmpegService from '../services/ffmpeg.service.js';
import hlsService from '../services/hls.service.js';
import bandwidthOptimizer from '../services/bandwidth-optimizer.service.js';
import logger from '../utils/logger.js';
import { requireAuth, requirePackageAccess } from '../middleware/auth.js';

const router = express.Router();

/**
 * GET /api/stream/vod/:id
 * Stream a movie (VOD content)
 *
 * Query params:
 *   - quality: 360p, 480p, 720p, 1080p (default: 720p)
 *   - format: mp4, hls (default: mp4)
 *   - extension: Original file extension (default: mp4)
 */
router.get('/vod/:id', requireAuth, requirePackageAccess('vod'), async (req, res) => {
  const { id } = req.params;
  const { quality = '720p', format = 'mp4', extension = 'mp4' } = req.query;

  try {
    logger.info(`VOD stream request: ${id} (${quality}, ${format})`);

    // Track view for bandwidth optimization
    await bandwidthOptimizer.trackView(id, 'vod');

    // Build source URL from Starshare
    const sourceUrl = starshareService.buildVODUrl(id, extension);

    // Check if source needs transcoding
    const needsTranscode = extension.toLowerCase() !== 'mp4' || format === 'hls';

    if (format === 'hls') {
      // HLS adaptive streaming
      const hlsResult = await ffmpegService.transcodeToHLS(sourceUrl, `vod_${id}`);
      const masterPlaylist = await hlsService.getMasterPlaylist(`vod_${id}`);

      res.setHeader('Content-Type', 'application/vnd.apple.mpegurl');
      res.send(masterPlaylist);

    } else if (needsTranscode) {
      // Transcode to MP4
      const stream = await ffmpegService.transcodeToMP4(sourceUrl, quality);

      res.setHeader('Content-Type', 'video/mp4');
      res.setHeader('Accept-Ranges', 'bytes');
      res.setHeader('Access-Control-Allow-Origin', '*');

      stream.pipe(res);

      stream.on('error', (err) => {
        logger.error(`Stream error: ${err.message}`);
        if (!res.headersSent) {
          res.status(500).json({ error: 'Streaming error' });
        }
      });

    } else {
      // Direct proxy (no transcoding needed) - Use streaming proxy to save bandwidth
      logger.info('Direct proxy (no transcoding)');
      const streamData = await starshareService.fetchStream(sourceUrl);

      // Use bandwidth-optimized streaming proxy
      const proxy = bandwidthOptimizer.createStreamingProxy(streamData);

      res.setHeader('Content-Type', 'video/mp4');
      res.setHeader('Access-Control-Allow-Origin', '*');

      proxy.pipe(res);

      bandwidthOptimizer.logOptimizationMetrics(id, 'vod', false, 0);
    }

  } catch (error) {
    logger.error(`VOD stream error: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/stream/episode/:episodeId
 * Stream a series episode by episode ID only (Xtream Codes style)
 *
 * Query params:
 *   - quality: 360p, 480p, 720p, 1080p (default: 720p)
 *   - format: mp4, hls (default: mp4)
 *   - extension: Original file extension (default: mp4)
 */
router.get('/episode/:episodeId', requireAuth, requirePackageAccess('series'), async (req, res) => {
  const { episodeId } = req.params;
  const { quality = '720p', format = 'mp4', extension = 'mp4' } = req.query;

  try {
    logger.info(`Episode stream request: ${episodeId} (${quality}, ${format}, ext: ${extension})`);

    // Track view for bandwidth optimization
    await bandwidthOptimizer.trackView(episodeId, 'series');

    // Build source URL from Starshare using episode ID directly
    const sourceUrl = starshareService.buildSeriesUrlByEpisodeId(episodeId, extension);

    // Check if source needs transcoding
    const needsTranscode = extension.toLowerCase() !== 'mp4' || format === 'hls';

    if (format === 'hls') {
      // HLS adaptive streaming
      const streamId = `episode_${episodeId}`;
      const hlsResult = await ffmpegService.transcodeToHLS(sourceUrl, streamId);
      const masterPlaylist = await hlsService.getMasterPlaylist(streamId);

      res.setHeader('Content-Type', 'application/vnd.apple.mpegurl');
      res.send(masterPlaylist);

    } else if (needsTranscode) {
      // Transcode to MP4
      const stream = await ffmpegService.transcodeToMP4(sourceUrl, quality);

      res.setHeader('Content-Type', 'video/mp4');
      res.setHeader('Accept-Ranges', 'bytes');
      res.setHeader('Access-Control-Allow-Origin', '*');

      stream.pipe(res);

      stream.on('error', (err) => {
        logger.error(`Stream error: ${err.message}`);
        if (!res.headersSent) {
          res.status(500).json({ error: 'Streaming error' });
        }
      });

    } else {
      // Direct proxy - Use streaming proxy to save bandwidth
      logger.info('Direct proxy (no transcoding)');
      const streamData = await starshareService.fetchStream(sourceUrl);

      // Use bandwidth-optimized streaming proxy
      const proxy = bandwidthOptimizer.createStreamingProxy(streamData);

      res.setHeader('Content-Type', 'video/mp4');
      res.setHeader('Access-Control-Allow-Origin', '*');

      proxy.pipe(res);

      bandwidthOptimizer.logOptimizationMetrics(episodeId, 'series', false, 0);
    }

  } catch (error) {
    logger.error(`Episode stream error: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/stream/series/:id/:season/:episode
 * Stream a series episode (legacy - requires season/episode)
 */
router.get('/series/:id/:season/:episode', requireAuth, requirePackageAccess('series'), async (req, res) => {
  const { id, season, episode } = req.params;
  const { quality = '720p', format = 'mp4', extension = 'mp4' } = req.query;

  try {
    const contentId = `${id}_${season}_${episode}`;
    logger.info(`Series stream request: ${id} S${season}E${episode} (${quality}, ${format})`);

    // Track view for bandwidth optimization
    await bandwidthOptimizer.trackView(contentId, 'series');

    // Build source URL from Starshare
    const sourceUrl = starshareService.buildSeriesUrl(id, season, episode, extension);

    // Check if source needs transcoding
    const needsTranscode = extension.toLowerCase() !== 'mp4' || format === 'hls';

    if (format === 'hls') {
      // HLS adaptive streaming
      const streamId = `series_${id}_${season}_${episode}`;
      const hlsResult = await ffmpegService.transcodeToHLS(sourceUrl, streamId);
      const masterPlaylist = await hlsService.getMasterPlaylist(streamId);

      res.setHeader('Content-Type', 'application/vnd.apple.mpegurl');
      res.send(masterPlaylist);

    } else if (needsTranscode) {
      // Transcode to MP4
      const stream = await ffmpegService.transcodeToMP4(sourceUrl, quality);

      res.setHeader('Content-Type', 'video/mp4');
      res.setHeader('Accept-Ranges', 'bytes');
      res.setHeader('Access-Control-Allow-Origin', '*');

      stream.pipe(res);

      stream.on('error', (err) => {
        logger.error(`Stream error: ${err.message}`);
        if (!res.headersSent) {
          res.status(500).json({ error: 'Streaming error' });
        }
      });

    } else {
      // Direct proxy - Use streaming proxy to save bandwidth
      logger.info('Direct proxy (no transcoding)');
      const streamData = await starshareService.fetchStream(sourceUrl);

      // Use bandwidth-optimized streaming proxy
      const proxy = bandwidthOptimizer.createStreamingProxy(streamData);

      res.setHeader('Content-Type', 'video/mp4');
      res.setHeader('Access-Control-Allow-Origin', '*');

      proxy.pipe(res);

      bandwidthOptimizer.logOptimizationMetrics(contentId, 'series', false, 0);
    }

  } catch (error) {
    logger.error(`Series stream error: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/stream/info/:type/:id
 * Get stream metadata
 */
router.get('/info/:type/:id', async (req, res) => {
  const { type, id } = req.params;

  try {
    const info = await starshareService.getStreamInfo(type, id);
    res.json(info);
  } catch (error) {
    logger.error(`Stream info error: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/stream/probe/:type/:id
 * Probe video file for technical details
 */
router.get('/probe/:type/:id', async (req, res) => {
  const { type, id } = req.params;
  const { extension = 'mp4' } = req.query;

  try {
    let sourceUrl;

    if (type === 'vod') {
      sourceUrl = starshareService.buildVODUrl(id, extension);
    } else {
      // For series, need season/episode
      const { season, episode } = req.query;
      if (!season || !episode) {
        return res.status(400).json({ error: 'season and episode required for series' });
      }
      sourceUrl = starshareService.buildSeriesUrl(id, season, episode, extension);
    }

    const metadata = await ffmpegService.probeVideo(sourceUrl);
    res.json(metadata);

  } catch (error) {
    logger.error(`Probe error: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
});

export default router;
