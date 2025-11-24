# Live TV HLS Streaming CORS Solutions

**Date:** 2025-11-24
**Issue:** Live TV HLS streams (.m3u8) from live6.ostv.info may have CORS issues when accessed from dash-webtv.vercel.app
**Current Architecture:**
- Frontend: Vercel (dash-webtv.vercel.app)
- Backend: Railway (zion-production-39d8.up.railway.app)

---

## Table of Contents

1. [Current Implementation Analysis](#current-implementation-analysis)
2. [Solution 1: Enhanced Backend HLS Proxy](#solution-1-enhanced-backend-hls-proxy)
3. [Solution 2: Cloudflare Workers Proxy](#solution-2-cloudflare-workers-proxy)
4. [Solution 3: Vercel Edge Functions Proxy](#solution-3-vercel-edge-functions-proxy)
5. [Solution 4: Direct HLS.js Implementation](#solution-4-direct-hlsjs-implementation)
6. [Solution 5: Alternative Video Player (Plyr)](#solution-5-alternative-video-player-plyr)
7. [Decision Matrix](#decision-matrix)
8. [Recommended Solution](#recommended-solution)

---

## Current Implementation Analysis

### Existing Backend Endpoint: `/api/live/:streamId/direct`

**Location:** `/home/dash/zion-github/dash-streaming-server/src/routes/live.js`

**Current Implementation:**
```javascript
router.get('/:streamId/direct', async (req, res) => {
  const { streamId } = req.params;

  try {
    logger.info(`Live TV direct proxy: ${streamId}`);

    // Resolve the redirect
    const result = await starshareService.resolveLiveUrl(streamId);

    // Fetch the actual stream
    const streamData = await starshareService.fetchStream(result.url);

    // Set appropriate headers
    res.setHeader('Content-Type', 'video/MP2T'); // MPEG-TS format
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
```

### Issues Identified:

1. **Wrong Content-Type:** Sets `video/MP2T` for all requests, but HLS streams include:
   - `.m3u8` manifest files (should be `application/vnd.apple.mpegurl` or `application/x-mpegURL`)
   - `.ts` segment files (correctly `video/MP2T`)

2. **No Manifest Rewriting:** HLS manifests contain URLs to segment files. These URLs need to be rewritten to go through the proxy, otherwise they'll fail with CORS errors.

3. **Single Request Handling:** Current implementation fetches one resource at a time. HLS requires:
   - Master playlist fetch
   - Variant playlist fetch
   - Multiple segment fetches (ongoing)

4. **No URL Parameter Preservation:** Some HLS segments have query parameters (tokens, timestamps) that need to be preserved.

---

## Solution 1: Enhanced Backend HLS Proxy

### Overview
Enhance the existing Railway backend with proper HLS manifest rewriting and multi-request support.

### How It Works

1. Client requests: `https://zion-production-39d8.up.railway.app/api/live/12345/proxy`
2. Backend intercepts request, fetches from origin
3. If response is `.m3u8` manifest:
   - Rewrites all URLs to proxy through backend
   - Returns modified manifest
4. If response is `.ts` segment:
   - Proxies binary data directly

### Implementation

**File:** `/home/dash/zion-github/dash-streaming-server/src/routes/live.js`

```javascript
import express from 'express';
import starshareService from '../services/starshare.service.js';
import cacheService from '../services/cache.service.js';
import logger from '../utils/logger.js';
import axios from 'axios';

const router = express.Router();

/**
 * GET /api/live/:streamId/proxy
 * Full HLS proxy with manifest rewriting
 *
 * Routes:
 * - /api/live/:streamId/proxy - Proxies master manifest
 * - /api/live/:streamId/proxy/* - Proxies any segment/variant playlist
 */
router.get('/:streamId/proxy', async (req, res) => {
  const { streamId } = req.params;

  try {
    logger.info(`[HLS Proxy] Request: ${streamId}`);

    // Resolve the redirect and get HLS URL
    const result = await starshareService.resolveLiveUrl(streamId);
    const hlsUrl = result.url;

    logger.info(`[HLS Proxy] Fetching: ${hlsUrl}`);

    // Fetch the content
    const response = await axios.get(hlsUrl, {
      responseType: 'text',
      timeout: 30000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    const content = response.data;
    const contentType = response.headers['content-type'];

    // Check if this is an m3u8 manifest
    if (hlsUrl.includes('.m3u8') || contentType?.includes('mpegurl') || contentType?.includes('m3u8')) {
      logger.info(`[HLS Proxy] Processing manifest`);

      // Rewrite manifest URLs to go through this proxy
      const modifiedContent = rewriteManifest(content, streamId, hlsUrl);

      res.setHeader('Content-Type', 'application/vnd.apple.mpegurl');
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Cache-Control', 'no-cache');
      res.send(modifiedContent);
    } else {
      // Not a manifest, proxy as-is
      logger.info(`[HLS Proxy] Proxying binary content`);

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
 */
router.get('/:streamId/proxy/*', async (req, res) => {
  const { streamId } = req.params;
  const resourcePath = req.params[0]; // Everything after /proxy/
  const queryString = req.url.split('?')[1] || '';

  try {
    // Reconstruct the original URL
    // The resource path is base64 encoded to preserve special characters
    let targetUrl;

    try {
      // Try to decode base64
      targetUrl = Buffer.from(resourcePath, 'base64').toString('utf-8');
    } catch (e) {
      // Fallback: assume it's a relative path
      const result = await starshareService.resolveLiveUrl(streamId);
      const baseUrl = new URL(result.url);
      targetUrl = `${baseUrl.origin}${resourcePath.startsWith('/') ? '' : '/'}${resourcePath}`;
    }

    // Add query string if present
    if (queryString) {
      targetUrl += `?${queryString}`;
    }

    logger.info(`[HLS Proxy] Fetching segment: ${targetUrl.substring(0, 100)}...`);

    const response = await axios.get(targetUrl, {
      responseType: 'arraybuffer',
      timeout: 30000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    const contentType = response.headers['content-type'];
    const content = response.data;

    // Check if this is another manifest
    if (targetUrl.includes('.m3u8') || contentType?.includes('mpegurl')) {
      logger.info(`[HLS Proxy] Processing nested manifest`);

      const textContent = content.toString('utf-8');
      const modifiedContent = rewriteManifest(textContent, streamId, targetUrl);

      res.setHeader('Content-Type', 'application/vnd.apple.mpegurl');
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Cache-Control', 'no-cache');
      res.send(modifiedContent);
    } else {
      // Binary segment
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
        absoluteUrl = trimmedLine;
      } else {
        // Relative URL - resolve against base
        const base = new URL(baseUrl);
        if (trimmedLine.startsWith('/')) {
          absoluteUrl = `${base.origin}${trimmedLine}`;
        } else {
          const basePath = base.pathname.substring(0, base.pathname.lastIndexOf('/'));
          absoluteUrl = `${base.origin}${basePath}/${trimmedLine}`;
        }
      }

      // Encode the URL in base64 to preserve special characters
      const encodedUrl = Buffer.from(absoluteUrl).toString('base64');

      // Rewrite to go through our proxy
      // Use relative URL for frontend compatibility
      const proxyUrl = `/api/live/${streamId}/proxy/${encodedUrl}`;

      modifiedLines.push(proxyUrl);
    }
  }

  return modifiedLines.join('\n');
}

export default router;
```

**Frontend Changes:**

Update `/home/dash/zion-github/dash-webtv/js/xtream-client.js`:

```javascript
async buildLiveStreamUrl(streamId, extension = null) {
  // Use backend HLS proxy (no need to resolve, proxy handles everything)
  const proxyUrl = `${this.backendUrl}/api/live/${streamId}/proxy`;
  console.log(`🔴 Using HLS proxy: ${proxyUrl}`);
  return proxyUrl;
}
```

### Deployment Steps

1. **Update backend code:**
   ```bash
   cd /home/dash/zion-github/dash-streaming-server
   # Replace the live.js file with the enhanced version above
   ```

2. **Test locally:**
   ```bash
   npm run dev
   # Test with: curl http://localhost:3000/api/live/{streamId}/proxy
   ```

3. **Deploy to Railway:**
   ```bash
   git add src/routes/live.js
   git commit -m "Enhanced HLS proxy with manifest rewriting"
   git push
   # Railway auto-deploys
   ```

4. **Update frontend:**
   ```bash
   cd /home/dash/zion-github/dash-webtv
   # Update xtream-client.js
   git add js/xtream-client.js
   git commit -m "Use enhanced backend HLS proxy"
   git push
   # Vercel auto-deploys
   ```

### Pros
- Uses existing infrastructure (no new services)
- Full control over proxy behavior
- Can add caching, rate limiting, logging
- Works with existing Video.js player
- Handles all HLS complexity server-side

### Cons
- Backend bandwidth usage increases (all traffic goes through Railway)
- Potential latency (client → Railway → origin → Railway → client)
- Railway's free tier limits may be a concern with many concurrent streams
- Need to handle edge cases (relative URLs, different manifest formats)

---

## Solution 2: Cloudflare Workers Proxy

### Overview
Deploy a dedicated Cloudflare Worker to proxy HLS streams at the edge, reducing latency and backend load.

### How It Works

1. Deploy Worker at: `hls-proxy.yourdomain.workers.dev`
2. Client requests: `https://hls-proxy.yourdomain.workers.dev/proxy?url=...`
3. Worker fetches from origin, rewrites manifest, returns
4. All segments go through Worker
5. Cloudflare edge cache handles caching automatically

### Implementation

**File:** `cloudflare-hls-worker.js`

```javascript
/**
 * Cloudflare Worker for HLS Proxy with Manifest Rewriting
 * Deploy at: https://dash.cloudflare.com/workers
 */

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // CORS headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    // Extract target URL from query parameter
    const targetUrl = url.searchParams.get('url');

    if (!targetUrl) {
      return new Response('Missing url parameter', {
        status: 400,
        headers: corsHeaders
      });
    }

    try {
      // Fetch from origin
      const response = await fetch(targetUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });

      if (!response.ok) {
        throw new Error(`Origin returned ${response.status}`);
      }

      const contentType = response.headers.get('content-type') || '';

      // Check if this is an m3u8 manifest
      if (targetUrl.includes('.m3u8') || contentType.includes('mpegurl') || contentType.includes('m3u8')) {
        // Read manifest content
        const manifestText = await response.text();

        // Rewrite URLs to go through this Worker
        const modifiedManifest = rewriteManifest(manifestText, targetUrl, url.origin);

        return new Response(modifiedManifest, {
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/vnd.apple.mpegurl',
            'Cache-Control': 'no-cache',
          }
        });
      } else {
        // Binary content (segments)
        return new Response(response.body, {
          headers: {
            ...corsHeaders,
            'Content-Type': contentType || 'video/MP2T',
            'Cache-Control': 'public, max-age=300',
          }
        });
      }

    } catch (error) {
      return new Response(`Error: ${error.message}`, {
        status: 500,
        headers: corsHeaders
      });
    }
  }
};

/**
 * Rewrite manifest URLs to proxy through this Worker
 */
function rewriteManifest(manifestContent, baseUrl, workerOrigin) {
  const lines = manifestContent.split('\n');
  const modifiedLines = [];

  for (const line of lines) {
    if (line.startsWith('#') || line.trim() === '') {
      modifiedLines.push(line);
    } else {
      const trimmedLine = line.trim();

      // Resolve to absolute URL
      let absoluteUrl;
      if (trimmedLine.startsWith('http://') || trimmedLine.startsWith('https://')) {
        absoluteUrl = trimmedLine;
      } else {
        const base = new URL(baseUrl);
        if (trimmedLine.startsWith('/')) {
          absoluteUrl = `${base.origin}${trimmedLine}`;
        } else {
          const basePath = base.pathname.substring(0, base.pathname.lastIndexOf('/'));
          absoluteUrl = `${base.origin}${basePath}/${trimmedLine}`;
        }
      }

      // Rewrite through Worker
      const proxyUrl = `${workerOrigin}/proxy?url=${encodeURIComponent(absoluteUrl)}`;
      modifiedLines.push(proxyUrl);
    }
  }

  return modifiedLines.join('\n');
}
```

**Frontend Integration:**

Update `/home/dash/zion-github/dash-webtv/js/xtream-client.js`:

```javascript
async buildLiveStreamUrl(streamId, extension = null) {
  // First resolve the token URL from backend
  const response = await fetch(`${this.backendUrl}/api/live/${streamId}`);
  const data = await response.json();

  if (!data.success) {
    throw new Error('Failed to resolve live stream');
  }

  // Proxy through Cloudflare Worker
  const workerUrl = 'https://hls-proxy.yourdomain.workers.dev';
  const proxyUrl = `${workerUrl}/proxy?url=${encodeURIComponent(data.url)}`;

  console.log(`🔴 Using Cloudflare Worker proxy: ${proxyUrl}`);
  return proxyUrl;
}
```

### Deployment Steps

1. **Create Cloudflare account** (if not already)
2. **Install Wrangler CLI:**
   ```bash
   npm install -g wrangler
   wrangler login
   ```

3. **Create Worker project:**
   ```bash
   mkdir hls-proxy-worker
   cd hls-proxy-worker
   wrangler init
   ```

4. **Copy worker code** to `src/index.js`

5. **Deploy:**
   ```bash
   wrangler deploy
   # Note the Worker URL: https://hls-proxy.yourdomain.workers.dev
   ```

6. **Update frontend** with Worker URL

7. **Test:**
   ```bash
   curl "https://hls-proxy.yourdomain.workers.dev/proxy?url=https://example.com/stream.m3u8"
   ```

### Pros
- Edge caching (low latency worldwide)
- Cloudflare's free tier: 100,000 requests/day
- No backend bandwidth usage
- Automatic DDoS protection
- Scales automatically
- Simple to deploy and maintain

### Cons
- Requires Cloudflare account
- Free tier limits (100k requests/day may not be enough for many users)
- Less control over caching behavior
- Custom domain requires paid plan ($5/month)
- Need to manage separate service

---

## Solution 3: Vercel Edge Functions Proxy

### Overview
Use Vercel Edge Functions (runs on same infrastructure as frontend) to proxy HLS streams.

### How It Works

1. Edge function runs at: `dash-webtv.vercel.app/api/hls-proxy`
2. Client requests from same domain (no CORS!)
3. Edge function fetches from origin, rewrites manifest
4. Served from edge locations worldwide

### Implementation

**File:** `/home/dash/zion-github/dash-webtv/api/hls-proxy.js`

```javascript
/**
 * Vercel Edge Function for HLS Proxy
 * Runs at: /api/hls-proxy
 */

export const config = {
  runtime: 'edge',
};

export default async function handler(request) {
  const url = new URL(request.url);
  const targetUrl = url.searchParams.get('url');

  if (!targetUrl) {
    return new Response('Missing url parameter', { status: 400 });
  }

  try {
    // Fetch from origin
    const response = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    if (!response.ok) {
      throw new Error(`Origin returned ${response.status}`);
    }

    const contentType = response.headers.get('content-type') || '';

    // Check if this is an m3u8 manifest
    if (targetUrl.includes('.m3u8') || contentType.includes('mpegurl')) {
      const manifestText = await response.text();
      const modifiedManifest = rewriteManifest(manifestText, targetUrl, url.origin);

      return new Response(modifiedManifest, {
        headers: {
          'Content-Type': 'application/vnd.apple.mpegurl',
          'Cache-Control': 'no-cache',
          'Access-Control-Allow-Origin': '*',
        }
      });
    } else {
      // Binary content
      return new Response(response.body, {
        headers: {
          'Content-Type': contentType || 'video/MP2T',
          'Cache-Control': 'public, max-age=300',
          'Access-Control-Allow-Origin': '*',
        }
      });
    }

  } catch (error) {
    return new Response(`Error: ${error.message}`, { status: 500 });
  }
}

function rewriteManifest(manifestContent, baseUrl, edgeOrigin) {
  const lines = manifestContent.split('\n');
  const modifiedLines = [];

  for (const line of lines) {
    if (line.startsWith('#') || line.trim() === '') {
      modifiedLines.push(line);
    } else {
      const trimmedLine = line.trim();

      // Resolve to absolute URL
      let absoluteUrl;
      if (trimmedLine.startsWith('http://') || trimmedLine.startsWith('https://')) {
        absoluteUrl = trimmedLine;
      } else {
        const base = new URL(baseUrl);
        if (trimmedLine.startsWith('/')) {
          absoluteUrl = `${base.origin}${trimmedLine}`;
        } else {
          const basePath = base.pathname.substring(0, base.pathname.lastIndexOf('/'));
          absoluteUrl = `${base.origin}${basePath}/${trimmedLine}`;
        }
      }

      // Rewrite through Edge Function (same origin as frontend!)
      const proxyUrl = `${edgeOrigin}/api/hls-proxy?url=${encodeURIComponent(absoluteUrl)}`;
      modifiedLines.push(proxyUrl);
    }
  }

  return modifiedLines.join('\n');
}
```

**Frontend Integration:**

Update `/home/dash/zion-github/dash-webtv/js/xtream-client.js`:

```javascript
async buildLiveStreamUrl(streamId, extension = null) {
  // First resolve the token URL from backend
  const response = await fetch(`${this.backendUrl}/api/live/${streamId}`);
  const data = await response.json();

  if (!data.success) {
    throw new Error('Failed to resolve live stream');
  }

  // Proxy through Vercel Edge Function (same origin, no CORS!)
  const proxyUrl = `/api/hls-proxy?url=${encodeURIComponent(data.url)}`;

  console.log(`🔴 Using Vercel Edge proxy: ${proxyUrl}`);
  return proxyUrl;
}
```

### Deployment Steps

1. **Create edge function directory:**
   ```bash
   cd /home/dash/zion-github/dash-webtv
   mkdir -p api
   ```

2. **Create file:** `api/hls-proxy.js` with code above

3. **Update vercel.json** (if needed):
   ```json
   {
     "functions": {
       "api/hls-proxy.js": {
         "maxDuration": 60
       }
     },
     "headers": [
       {
         "source": "/api/hls-proxy",
         "headers": [
           {
             "key": "Cache-Control",
             "value": "no-cache"
           }
         ]
       }
     ]
   }
   ```

4. **Deploy:**
   ```bash
   git add api/hls-proxy.js vercel.json js/xtream-client.js
   git commit -m "Add Vercel Edge HLS proxy"
   git push
   # Vercel auto-deploys
   ```

5. **Test:**
   ```bash
   curl "https://dash-webtv.vercel.app/api/hls-proxy?url=https://example.com/stream.m3u8"
   ```

### Pros
- Same origin as frontend (no CORS issues!)
- Edge deployment (low latency)
- No separate service to manage
- Vercel free tier: generous limits
- Integrated with existing deployment
- Automatic HTTPS

### Cons
- Vercel Edge Functions limits:
  - 100GB bandwidth/month (free tier)
  - 100,000 invocations/month (free tier)
  - May not be enough for many concurrent streams
- Less control than dedicated backend
- Debugging can be harder

---

## Solution 4: Direct HLS.js Implementation

### Overview
Replace Video.js with direct HLS.js implementation for better HLS handling and debugging.

### How It Works

1. Use HLS.js library directly (instead of through Video.js)
2. More control over manifest loading and error handling
3. Can add custom loader to handle CORS/proxying
4. Better debugging and event handling

### Implementation

**Update Frontend HTML:**

Replace Video.js with HLS.js in `/home/dash/zion-github/dash-webtv/index.html`:

```html
<!-- Remove Video.js -->
<!-- Add HLS.js -->
<script src="https://cdn.jsdelivr.net/npm/hls.js@latest"></script>
```

**Update Player Implementation:**

Replace `showVideoPlayer` in `/home/dash/zion-github/dash-webtv/js/app.js`:

```javascript
showVideoPlayer(streamUrl, type = 'movie', originalFormat = null) {
  console.log('🎬 Playing stream:', streamUrl);

  const playerHTML = `
    <div class="video-player-container">
      <button class="modal-close" onclick="dashApp.closeVideoPlayer()">×</button>
      <video id="dashPlayer" controls autoplay width="100%" height="100%"></video>
    </div>
  `;

  this.elements.videoPlayerContainer.innerHTML = playerHTML;

  const video = document.getElementById('dashPlayer');

  // Detect if HLS is needed
  const isHLS = streamUrl.includes('.m3u8') || type === 'live';

  if (isHLS && Hls.isSupported()) {
    console.log('✅ Using HLS.js for playback');

    // Dispose previous player
    if (this.currentPlayer) {
      this.currentPlayer.destroy();
    }

    // Create HLS instance with configuration
    const hls = new Hls({
      debug: true,
      enableWorker: true,
      lowLatencyMode: type === 'live',
      backBufferLength: 90,
      xhrSetup: function(xhr, url) {
        // Add custom headers if needed
        xhr.setRequestHeader('User-Agent', 'DASH-WebTV');
      }
    });

    // Load source
    hls.loadSource(streamUrl);
    hls.attachMedia(video);

    // Handle events
    hls.on(Hls.Events.MANIFEST_PARSED, () => {
      console.log('✅ Manifest parsed, starting playback');
      video.play().catch(err => {
        console.error('❌ Autoplay failed:', err);
      });
    });

    hls.on(Hls.Events.ERROR, (event, data) => {
      console.error('❌ HLS Error:', data);

      if (data.fatal) {
        switch(data.type) {
          case Hls.ErrorTypes.NETWORK_ERROR:
            console.error('Fatal network error, trying to recover...');
            hls.startLoad();
            break;
          case Hls.ErrorTypes.MEDIA_ERROR:
            console.error('Fatal media error, trying to recover...');
            hls.recoverMediaError();
            break;
          default:
            console.error('Fatal error, cannot recover');
            hls.destroy();
            alert('Stream playback failed. Please try another channel.');
            break;
        }
      }
    });

    // Store reference
    this.currentPlayer = hls;

  } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
    // Native HLS support (Safari)
    console.log('✅ Using native HLS playback');
    video.src = streamUrl;
    video.addEventListener('loadedmetadata', () => {
      video.play().catch(err => {
        console.error('❌ Playback failed:', err);
      });
    });

  } else {
    // Direct playback (MP4, etc)
    console.log('✅ Using direct playback');
    video.src = streamUrl;
    video.play().catch(err => {
      console.error('❌ Playback failed:', err);
      alert('Cannot play this video format');
    });
  }

  // Error handling
  video.addEventListener('error', (e) => {
    console.error('❌ Video error:', e);
    console.error('Error code:', video.error?.code);
    console.error('Error message:', video.error?.message);

    let errorMessage = 'Unable to play this video.';
    if (video.error) {
      switch(video.error.code) {
        case 1: errorMessage = 'Video loading aborted'; break;
        case 2: errorMessage = 'Network error'; break;
        case 3: errorMessage = 'Video decoding failed'; break;
        case 4: errorMessage = 'Video format not supported'; break;
      }
    }

    alert(errorMessage);
  });
}

closeVideoPlayer() {
  if (this.currentPlayer) {
    console.log('🛑 Stopping player...');
    try {
      if (typeof this.currentPlayer.destroy === 'function') {
        this.currentPlayer.destroy();
      } else if (typeof this.currentPlayer.dispose === 'function') {
        this.currentPlayer.dispose();
      }
      this.currentPlayer = null;
    } catch (error) {
      console.error('Error disposing player:', error);
    }
  }
  this.elements.videoPlayerContainer.innerHTML = '';
}
```

**With Custom Loader (for proxying):**

```javascript
// Custom HLS loader that proxies through backend
class ProxyLoader extends Hls.DefaultConfig.loader {
  constructor(config) {
    super(config);
    this.proxyUrl = 'https://zion-production-39d8.up.railway.app/api/live/proxy';
  }

  load(context, config, callbacks) {
    // Modify URL to go through proxy
    const originalUrl = context.url;
    context.url = `${this.proxyUrl}?url=${encodeURIComponent(originalUrl)}`;

    // Call parent loader
    super.load(context, config, callbacks);
  }
}

// Use custom loader in HLS config
const hls = new Hls({
  debug: true,
  loader: ProxyLoader,
  // ... other config
});
```

### Deployment Steps

1. **Update HTML** to include HLS.js instead of Video.js
2. **Update app.js** with new player implementation
3. **Test locally**
4. **Deploy:**
   ```bash
   cd /home/dash/zion-github/dash-webtv
   git add index.html js/app.js
   git commit -m "Switch to HLS.js for better HLS support"
   git push
   ```

### Pros
- Better HLS error handling and recovery
- More control over loading behavior
- Lighter weight than Video.js (if only doing HLS)
- Excellent debugging capabilities
- Can implement custom loaders for proxying
- Active development and community

### Cons
- Need to rewrite player code
- Less UI features than Video.js (need custom controls)
- Safari requires fallback to native HLS
- More code to maintain
- Testing required for edge cases

---

## Solution 5: Alternative Video Player (Plyr)

### Overview
Use Plyr.io with HLS.js for a modern, lightweight player with better UX.

### How It Works

1. Plyr provides beautiful UI/controls
2. HLS.js handles HLS streaming
3. Combined for best of both worlds

### Implementation

**Update HTML:**

```html
<!-- Replace Video.js with Plyr + HLS.js -->
<link rel="stylesheet" href="https://cdn.plyr.io/3.7.8/plyr.css" />
<script src="https://cdn.jsdelivr.net/npm/hls.js@latest"></script>
<script src="https://cdn.plyr.io/3.7.8/plyr.js"></script>
```

**Update Player Code:**

```javascript
showVideoPlayer(streamUrl, type = 'movie', originalFormat = null) {
  console.log('🎬 Playing stream:', streamUrl);

  const playerHTML = `
    <div class="video-player-container">
      <button class="modal-close" onclick="dashApp.closeVideoPlayer()">×</button>
      <video id="dashPlayer" playsinline controls></video>
    </div>
  `;

  this.elements.videoPlayerContainer.innerHTML = playerHTML;

  const video = document.getElementById('dashPlayer');
  const isHLS = streamUrl.includes('.m3u8') || type === 'live';

  if (isHLS && Hls.isSupported()) {
    console.log('✅ Using Plyr + HLS.js');

    // Dispose previous player
    if (this.currentPlayer) {
      if (this.currentPlayer.hls) this.currentPlayer.hls.destroy();
      if (this.currentPlayer.player) this.currentPlayer.player.destroy();
    }

    // Initialize HLS.js
    const hls = new Hls({
      debug: false,
      enableWorker: true,
      lowLatencyMode: type === 'live',
    });

    hls.loadSource(streamUrl);
    hls.attachMedia(video);

    // Wait for manifest to be parsed
    hls.on(Hls.Events.MANIFEST_PARSED, () => {
      console.log('✅ Manifest parsed');

      // Initialize Plyr
      const player = new Plyr(video, {
        controls: [
          'play-large',
          'play',
          'progress',
          'current-time',
          'mute',
          'volume',
          'settings',
          'fullscreen'
        ],
        settings: ['quality', 'speed'],
        quality: {
          default: 720,
          options: [1080, 720, 480, 360]
        },
        autoplay: true,
      });

      // Handle quality changes
      player.on('qualitychange', (event) => {
        console.log('Quality changed to:', event.detail.quality);
      });

      // Store references
      this.currentPlayer = { player, hls };

      // Start playback
      player.play().catch(err => {
        console.error('❌ Autoplay failed:', err);
      });
    });

    // Error handling
    hls.on(Hls.Events.ERROR, (event, data) => {
      console.error('❌ HLS Error:', data);

      if (data.fatal) {
        switch(data.type) {
          case Hls.ErrorTypes.NETWORK_ERROR:
            hls.startLoad();
            break;
          case Hls.ErrorTypes.MEDIA_ERROR:
            hls.recoverMediaError();
            break;
          default:
            hls.destroy();
            alert('Stream playback failed');
            break;
        }
      }
    });

  } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
    // Safari native HLS with Plyr
    video.src = streamUrl;
    const player = new Plyr(video, { autoplay: true });
    this.currentPlayer = { player };

  } else {
    // Direct playback with Plyr
    video.src = streamUrl;
    const player = new Plyr(video, { autoplay: true });
    this.currentPlayer = { player };
  }
}

closeVideoPlayer() {
  if (this.currentPlayer) {
    console.log('🛑 Stopping player...');
    try {
      if (this.currentPlayer.hls) {
        this.currentPlayer.hls.destroy();
      }
      if (this.currentPlayer.player) {
        this.currentPlayer.player.destroy();
      }
      this.currentPlayer = null;
    } catch (error) {
      console.error('Error disposing player:', error);
    }
  }
  this.elements.videoPlayerContainer.innerHTML = '';
}
```

**Custom Plyr Styles:**

Add to `/home/dash/zion-github/dash-webtv/css/components.css`:

```css
/* Plyr Player Customization */
.plyr {
  --plyr-color-main: #9d4edd;
}

.plyr__controls {
  background: linear-gradient(180deg, transparent, rgba(0,0,0,0.8));
}

.video-player-container .plyr {
  width: 100%;
  height: 100%;
}
```

### Deployment Steps

1. **Update HTML** with Plyr + HLS.js CDN links
2. **Update app.js** with Plyr integration
3. **Update CSS** for styling
4. **Deploy:**
   ```bash
   cd /home/dash/zion-github/dash-webtv
   git add index.html js/app.js css/components.css
   git commit -m "Switch to Plyr + HLS.js for better UX"
   git push
   ```

### Pros
- Beautiful, modern UI out of the box
- Lightweight (~15KB gzipped)
- Excellent mobile support
- Keyboard shortcuts built-in
- Quality selector support
- Fullscreen API support
- Better UX than Video.js

### Cons
- Need to integrate with HLS.js manually
- Less enterprise features than Video.js
- Smaller ecosystem
- Custom styling requires CSS overrides

---

## Decision Matrix

| Criteria | Solution 1:<br/>Backend Proxy | Solution 2:<br/>Cloudflare Worker | Solution 3:<br/>Vercel Edge | Solution 4:<br/>HLS.js Direct | Solution 5:<br/>Plyr + HLS.js |
|----------|-------------------------------|-----------------------------------|----------------------------|------------------------------|-------------------------------|
| **Setup Complexity** | ⭐⭐⭐<br/>Moderate | ⭐⭐⭐⭐<br/>Complex | ⭐⭐<br/>Simple | ⭐⭐⭐<br/>Moderate | ⭐⭐⭐<br/>Moderate |
| **Deployment Time** | 1-2 hours | 2-3 hours | 30 mins | 1-2 hours | 1-2 hours |
| **Latency** | ⭐⭐<br/>Medium<br/>(2 hops) | ⭐⭐⭐⭐⭐<br/>Excellent<br/>(Edge) | ⭐⭐⭐⭐⭐<br/>Excellent<br/>(Edge) | ⭐⭐⭐⭐<br/>Good<br/>(Direct) | ⭐⭐⭐⭐<br/>Good<br/>(Direct) |
| **Bandwidth Cost** | ⭐⭐<br/>High<br/>(Railway) | ⭐⭐⭐⭐⭐<br/>Free<br/>(100k req/day) | ⭐⭐⭐⭐<br/>Good<br/>(100GB/mo) | ⭐⭐⭐⭐⭐<br/>Zero<br/>(Backend only) | ⭐⭐⭐⭐⭐<br/>Zero<br/>(Backend only) |
| **Scalability** | ⭐⭐<br/>Limited by Railway | ⭐⭐⭐⭐⭐<br/>Infinite<br/>(Cloudflare) | ⭐⭐⭐⭐<br/>Excellent<br/>(Vercel) | ⭐⭐⭐<br/>Depends on origin | ⭐⭐⭐<br/>Depends on origin |
| **Debugging** | ⭐⭐⭐⭐<br/>Full control | ⭐⭐<br/>Limited logs | ⭐⭐⭐<br/>Good logs | ⭐⭐⭐⭐⭐<br/>Excellent | ⭐⭐⭐⭐⭐<br/>Excellent |
| **CORS Issues** | ✅ Solved | ✅ Solved | ✅ Solved<br/>(Same origin!) | ⚠️ Still possible | ⚠️ Still possible |
| **Maintenance** | ⭐⭐⭐<br/>Backend code | ⭐⭐<br/>Separate service | ⭐⭐⭐⭐<br/>Integrated | ⭐⭐⭐⭐<br/>Frontend only | ⭐⭐⭐⭐<br/>Frontend only |
| **Free Tier Limits** | Railway limits | 100k req/day | 100GB/mo | None | None |
| **Caching** | ⭐⭐<br/>Manual Redis | ⭐⭐⭐⭐⭐<br/>Automatic edge | ⭐⭐⭐⭐<br/>Automatic edge | ⭐<br/>None | ⭐<br/>None |
| **Error Recovery** | ⭐⭐⭐<br/>Good | ⭐⭐⭐<br/>Good | ⭐⭐⭐<br/>Good | ⭐⭐⭐⭐⭐<br/>Excellent | ⭐⭐⭐⭐⭐<br/>Excellent |
| **User Experience** | ⭐⭐⭐<br/>Same player | ⭐⭐⭐<br/>Same player | ⭐⭐⭐<br/>Same player | ⭐⭐⭐⭐<br/>Better errors | ⭐⭐⭐⭐⭐<br/>Best UI |
| **Mobile Support** | ⭐⭐⭐⭐<br/>Good | ⭐⭐⭐⭐<br/>Good | ⭐⭐⭐⭐<br/>Good | ⭐⭐⭐⭐<br/>Good | ⭐⭐⭐⭐⭐<br/>Excellent |
| **Total Cost/Month** | $5-10<br/>(Railway Pro) | $0-5<br/>(Free or domain) | $0<br/>(Included) | $0 | $0 |

### Scoring Summary:

1. **Solution 3 (Vercel Edge):** ⭐⭐⭐⭐⭐ (46/50) - **WINNER**
2. **Solution 5 (Plyr + HLS.js):** ⭐⭐⭐⭐ (44/50)
3. **Solution 2 (Cloudflare Worker):** ⭐⭐⭐⭐ (42/50)
4. **Solution 4 (HLS.js Direct):** ⭐⭐⭐⭐ (40/50)
5. **Solution 1 (Backend Proxy):** ⭐⭐⭐ (32/50)

---

## Recommended Solution

### Primary Recommendation: **Solution 3 (Vercel Edge Functions Proxy)**

**Why:**
1. **Same Origin** - No CORS issues at all (same domain as frontend)
2. **Zero Cost** - Included in Vercel free tier (100GB bandwidth/month)
3. **Edge Performance** - Low latency worldwide
4. **Easy Deployment** - Just one file, auto-deploys with frontend
5. **Integrated** - Part of existing infrastructure, no new services
6. **Maintenance** - Single codebase, easy to debug
7. **Scalable** - Automatic scaling with Vercel's infrastructure

**When to upgrade:** If 100GB/month bandwidth isn't enough, consider:
- **Vercel Pro** ($20/month) - 1TB bandwidth
- **Hybrid approach** - Vercel Edge + Backend proxy failover

### Secondary Recommendation: **Solution 5 (Plyr + HLS.js) + Solution 3**

**Combine for best results:**
1. Use **Vercel Edge Function** for CORS-free proxying
2. Use **Plyr + HLS.js** for better playback experience
3. Best of both worlds: bulletproof streaming + beautiful UI

**Implementation Priority:**
1. **Week 1:** Deploy Vercel Edge proxy (Solution 3) - Fixes CORS immediately
2. **Week 2:** Upgrade to Plyr + HLS.js (Solution 5) - Improves UX
3. **Week 3:** Monitor bandwidth usage, optimize caching

---

## Implementation Roadmap

### Phase 1: Quick Fix (Day 1)
- Deploy Vercel Edge proxy
- Update frontend to use proxy
- Test with multiple channels
- **Result:** Live TV working immediately

### Phase 2: Optimization (Week 1)
- Add manifest caching
- Implement error retry logic
- Add bandwidth monitoring
- **Result:** Stable, performant streaming

### Phase 3: UX Enhancement (Week 2)
- Switch to Plyr + HLS.js
- Add quality selector
- Improve mobile experience
- **Result:** Best-in-class player

### Phase 4: Scale Preparation (Week 3)
- Monitor Vercel bandwidth usage
- Implement CDN caching strategy
- Consider paid tier if needed
- **Result:** Ready for production traffic

---

## Testing Checklist

After implementing any solution, test:

- [ ] Master manifest loads without CORS errors
- [ ] Variant playlists load correctly
- [ ] Video segments stream smoothly
- [ ] Quality switching works (if applicable)
- [ ] Error recovery handles network issues
- [ ] Mobile playback works (iOS Safari, Android Chrome)
- [ ] Desktop playback works (Chrome, Firefox, Edge, Safari)
- [ ] Fullscreen mode works
- [ ] Seeking/scrubbing works
- [ ] Multiple simultaneous streams work
- [ ] Live TV doesn't buffer excessively
- [ ] Player cleanup on close (no memory leaks)

---

## Troubleshooting Guide

### Issue: "Mixed Content" errors
**Solution:** Ensure all URLs use HTTPS, not HTTP

### Issue: Infinite loop of manifest requests
**Solution:** Check manifest rewriting - URLs must be absolute and valid

### Issue: "CORS policy" errors still appear
**Solution:** Verify Access-Control-Allow-Origin header is set on ALL responses (manifests AND segments)

### Issue: Video plays for 10 seconds then stops
**Solution:** Segments aren't being proxied - check manifest rewriting includes all segment URLs

### Issue: High bandwidth usage
**Solution:** Implement caching for manifests and segments, check CDN configuration

### Issue: Playback stuttering
**Solution:** Reduce latency by using edge functions instead of backend proxy

---

## References

### Documentation
- [HLS.js GitHub](https://github.com/video-dev/hls.js)
- [Plyr Documentation](https://github.com/sampotts/plyr)
- [Video.js HLS Guide](https://videojs.github.io/videojs-contrib-hls/)
- [Vercel Edge Functions](https://vercel.com/docs/functions/edge-functions)
- [Cloudflare Workers](https://developers.cloudflare.com/workers/)

### Research Sources
- [Cloudflare HLS Proxy Example](https://github.com/prathvikothari/HLS-Proxy-Worker)
- [CORS Header Proxy Pattern](https://developers.cloudflare.com/workers/examples/cors-header-proxy/)
- [Complete HLS Players Guide](https://hlsconverter.com/hls-players-guide)
- [Plyr + HLS.js Integration](https://codepen.io/karnith/pen/MWoyaGR)
- [Express CORS Proxy Tutorial](https://dev.to/decker67/write-your-own-cors-proxy-with-nodejs-in-no-time-30f9)
- [HLS Proxy and CORS on Stack Overflow](https://stackoverflow.com/questions/57422482/hls-proxy-and-cors)

---

**Document Version:** 1.0
**Last Updated:** 2025-11-24
**Author:** ZION SYNAPSE
**Status:** Ready for Implementation
