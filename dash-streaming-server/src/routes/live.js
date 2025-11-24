import express from 'express';
import starshareService from '../services/starshare.service.js';
import cacheService from '../services/cache.service.js';
import logger from '../utils/logger.js';
import axios from 'axios';

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
 * GET /api/live/:streamId/proxy
 * Full HLS proxy with manifest rewriting - MAIN ENTRY POINT
 *
 * This endpoint:
 * 1. Resolves the Live TV redirect to get the HLS manifest URL
 * 2. Fetches the manifest from origin
 * 3. Rewrites all URLs in manifest to proxy through this server
 * 4. Returns modified manifest to client
 */
router.get('/:streamId/proxy', async (req, res) => {
  const { streamId } = req.params;

  try {
    logger.info(`[HLS Proxy] Initial request: ${streamId}`);

    // Resolve the redirect and get HLS URL
    const result = await starshareService.resolveLiveUrl(streamId);
    const hlsUrl = result.url;

    logger.info(`[HLS Proxy] Fetching manifest: ${hlsUrl.substring(0, 100)}...`);

    // Fetch the content with mobile app-like headers (mimics Starshare APK)
    const response = await axios.get(hlsUrl, {
      responseType: 'text',
      timeout: 10000, // Reduced timeout - fail fast
      maxRedirects: 5,
      headers: {
        'User-Agent': 'Lavf/58.76.100', // FFmpeg/ExoPlayer User-Agent (used by Android IPTV apps)
        'Accept': '*/*',
        'Connection': 'keep-alive'
      }
    });

    const content = response.data;
    const contentType = response.headers['content-type'];

    // Check if this is an m3u8 manifest
    const isManifest = hlsUrl.includes('.m3u8') ||
                       contentType?.includes('mpegurl') ||
                       contentType?.includes('m3u8') ||
                       content.includes('#EXTM3U');

    if (isManifest) {
      logger.info(`[HLS Proxy] Processing manifest (${content.length} bytes)`);

      // Rewrite manifest URLs to go through this proxy
      const modifiedContent = rewriteManifest(content, streamId, hlsUrl);

      res.setHeader('Content-Type', 'application/vnd.apple.mpegurl');
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
      res.setHeader('Cache-Control', 'no-cache');
      res.send(modifiedContent);
    } else {
      // Not a manifest, proxy binary content as-is
      logger.info(`[HLS Proxy] Proxying binary content (${content.length} bytes)`);

      res.setHeader('Content-Type', contentType || 'video/MP2T');
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Cache-Control', 'public, max-age=300');
      res.send(content);
    }

  } catch (error) {
    logger.error(`[HLS Proxy] Error: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/live/:streamId/proxy/*
 * Proxy additional HLS resources (variant playlists, segments)
 *
 * The resource path is base64 encoded to preserve special characters
 */
router.get('/:streamId/proxy/*', async (req, res) => {
  const { streamId } = req.params;
  const resourcePath = req.params[0]; // Everything after /proxy/
  const queryString = req.url.split('?')[1] || '';

  try {
    // Decode base64 to get the original URL
    let targetUrl;

    try {
      targetUrl = Buffer.from(resourcePath, 'base64').toString('utf-8');
    } catch (e) {
      // Fallback: assume it's a relative path
      logger.warn(`[HLS Proxy] Failed to decode base64, treating as relative path: ${resourcePath}`);
      const result = await starshareService.resolveLiveUrl(streamId);
      const baseUrl = new URL(result.url);
      targetUrl = `${baseUrl.origin}${resourcePath.startsWith('/') ? '' : '/'}${resourcePath}`;
    }

    // Add query string if present
    if (queryString) {
      targetUrl += `?${queryString}`;
    }

    logger.info(`[HLS Proxy] Fetching resource: ${targetUrl.substring(0, 100)}...`);

    const response = await axios.get(targetUrl, {
      responseType: 'arraybuffer',
      timeout: 10000, // Reduced timeout - fail fast
      maxRedirects: 5,
      headers: {
        'User-Agent': 'Lavf/58.76.100', // FFmpeg/ExoPlayer User-Agent (Android IPTV apps)
        'Accept': '*/*',
        'Connection': 'keep-alive'
      }
    });

    const contentType = response.headers['content-type'];
    const content = response.data;

    // Check if this is another manifest (nested playlist)
    const isManifest = targetUrl.includes('.m3u8') ||
                       contentType?.includes('mpegurl') ||
                       contentType?.includes('m3u8');

    if (isManifest) {
      logger.info(`[HLS Proxy] Processing nested manifest`);

      const textContent = content.toString('utf-8');
      const modifiedContent = rewriteManifest(textContent, streamId, targetUrl);

      res.setHeader('Content-Type', 'application/vnd.apple.mpegurl');
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
      res.setHeader('Cache-Control', 'no-cache');
      res.send(modifiedContent);
    } else {
      // Binary segment (TS file)
      logger.info(`[HLS Proxy] Proxying segment (${content.length} bytes)`);

      res.setHeader('Content-Type', contentType || 'video/MP2T');
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Cache-Control', 'public, max-age=300');
      res.send(content);
    }

  } catch (error) {
    logger.error(`[HLS Proxy] Segment error: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Rewrite M3U8 manifest to proxy all URLs through our server
 *
 * This function:
 * 1. Parses each line of the manifest
 * 2. Identifies URL lines (non-comment, non-empty)
 * 3. Resolves relative URLs to absolute
 * 4. Encodes the URL in base64
 * 5. Rewrites to go through /api/live/:streamId/proxy/:encodedUrl
 */
function rewriteManifest(manifestContent, streamId, baseUrl) {
  const lines = manifestContent.split('\n');
  const modifiedLines = [];

  for (const line of lines) {
    if (line.startsWith('#') || line.trim() === '') {
      // Comment or empty line - keep as is
      modifiedLines.push(line);
    } else {
      // This is a URL line
      const trimmedLine = line.trim();

      // Resolve relative URLs to absolute
      let absoluteUrl;
      if (trimmedLine.startsWith('http://') || trimmedLine.startsWith('https://')) {
        // Already absolute
        absoluteUrl = trimmedLine;
      } else {
        // Relative URL - resolve against base
        const base = new URL(baseUrl);
        if (trimmedLine.startsWith('/')) {
          // Absolute path
          absoluteUrl = `${base.origin}${trimmedLine}`;
        } else {
          // Relative path
          const basePath = base.pathname.substring(0, base.pathname.lastIndexOf('/'));
          absoluteUrl = `${base.origin}${basePath}/${trimmedLine}`;
        }
      }

      // Encode the URL in base64 to preserve special characters
      const encodedUrl = Buffer.from(absoluteUrl).toString('base64');

      // Rewrite to go through our proxy
      const proxyUrl = `/api/live/${streamId}/proxy/${encodedUrl}`;

      modifiedLines.push(proxyUrl);
    }
  }

  return modifiedLines.join('\n');
}

/**
 * GET /api/live/:streamId/direct (LEGACY - kept for compatibility)
 * Directly proxy the live stream (for players that don't support URL resolution)
 *
 * NOTE: This endpoint doesn't handle HLS properly and is kept only for compatibility.
 * Use /api/live/:streamId/proxy instead for HLS streams.
 */
router.get('/:streamId/direct', async (req, res) => {
  const { streamId } = req.params;

  try {
    logger.info(`Live TV direct proxy (LEGACY): ${streamId}`);

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
