import express from 'express';
import axios from 'axios';
import logger from '../utils/logger.js';

const router = express.Router();

/**
 * GET /api/proxy/hls
 * Proxy HLS streams to bypass CORS and mixed content issues
 *
 * Query params:
 * - url: The HLS stream URL to proxy (required)
 */
router.get('/hls', async (req, res) => {
  const { url } = req.query;

  if (!url) {
    return res.status(400).json({ error: 'Missing url parameter' });
  }

  try {
    logger.info(`Proxying HLS stream: ${url}`);

    // Fetch the HLS content
    const response = await axios.get(url, {
      responseType: 'text',
      timeout: 30000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': '*/*',
        'Accept-Language': 'en-US,en;q=0.9',
        'Referer': new URL(url).origin + '/',
      },
      // Handle redirects
      maxRedirects: 5,
    });

    // Get the base URL for relative paths in the m3u8
    const baseUrl = url.substring(0, url.lastIndexOf('/') + 1);

    // Process the m3u8 content to rewrite relative URLs
    let content = response.data;

    if (url.includes('.m3u8') || response.headers['content-type']?.includes('mpegurl')) {
      // Rewrite relative URLs in the playlist to go through our proxy
      content = rewritePlaylist(content, baseUrl);
    }

    // Set appropriate headers
    res.setHeader('Content-Type', response.headers['content-type'] || 'application/vnd.apple.mpegurl');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Range');
    res.setHeader('Cache-Control', 'no-cache');

    res.send(content);

  } catch (error) {
    logger.error(`Proxy error for ${url}: ${error.message}`);

    // Return appropriate error
    if (error.response) {
      res.status(error.response.status).json({
        error: 'Upstream error',
        status: error.response.status,
        message: error.message
      });
    } else if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
      res.status(502).json({ error: 'Upstream server unavailable' });
    } else {
      res.status(500).json({ error: 'Proxy failed', message: error.message });
    }
  }
});

/**
 * GET /api/proxy/segment
 * Proxy video segments (TS files)
 */
router.get('/segment', async (req, res) => {
  const { url } = req.query;

  if (!url) {
    return res.status(400).json({ error: 'Missing url parameter' });
  }

  try {
    const response = await axios.get(url, {
      responseType: 'arraybuffer',
      timeout: 60000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': '*/*',
        'Referer': new URL(url).origin + '/',
      },
      maxRedirects: 5,
    });

    res.setHeader('Content-Type', response.headers['content-type'] || 'video/MP2T');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cache-Control', 'public, max-age=300');

    res.send(Buffer.from(response.data));

  } catch (error) {
    logger.error(`Segment proxy error for ${url}: ${error.message}`);
    res.status(error.response?.status || 500).json({ error: 'Segment proxy failed' });
  }
});

/**
 * Rewrite relative URLs in HLS playlist to go through our proxy
 */
function rewritePlaylist(content, baseUrl) {
  const proxyBase = '/api/proxy';
  const lines = content.split('\n');

  return lines.map(line => {
    const trimmed = line.trim();

    // Skip comments and empty lines
    if (trimmed.startsWith('#') || trimmed === '') {
      // But check for URI in EXT-X-KEY or EXT-X-MAP
      if (trimmed.includes('URI="')) {
        return rewriteUriInTag(trimmed, baseUrl, proxyBase);
      }
      return line;
    }

    // This is a URL line
    let fullUrl;
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
      fullUrl = trimmed;
    } else {
      // Relative URL - make absolute
      fullUrl = new URL(trimmed, baseUrl).href;
    }

    // Route through our proxy
    if (fullUrl.includes('.m3u8')) {
      return `${proxyBase}/hls?url=${encodeURIComponent(fullUrl)}`;
    } else if (fullUrl.includes('.ts') || fullUrl.includes('.aac') || fullUrl.includes('.fmp4')) {
      return `${proxyBase}/segment?url=${encodeURIComponent(fullUrl)}`;
    }

    // Default: proxy as segment
    return `${proxyBase}/segment?url=${encodeURIComponent(fullUrl)}`;
  }).join('\n');
}

/**
 * Rewrite URI attributes in HLS tags (like EXT-X-KEY)
 */
function rewriteUriInTag(line, baseUrl, proxyBase) {
  return line.replace(/URI="([^"]+)"/g, (match, uri) => {
    let fullUrl;
    if (uri.startsWith('http://') || uri.startsWith('https://')) {
      fullUrl = uri;
    } else {
      fullUrl = new URL(uri, baseUrl).href;
    }
    return `URI="${proxyBase}/segment?url=${encodeURIComponent(fullUrl)}"`;
  });
}

export default router;
