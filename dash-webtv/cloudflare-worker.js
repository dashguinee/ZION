/**
 * DASH⚡ Cloudflare Worker - Live Stream Proxy (PERFECTION MODE)
 *
 * Maximum optimization for continuous MPEG-TS live streams:
 * - Direct passthrough (zero processing overhead)
 * - Chunked transfer encoding for immediate data flow
 * - No caching, no buffering, no transformation
 * - Connection keep-alive with upstream
 *
 * Deploy: npx wrangler deploy
 */

// Shared CORS headers
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
  'Access-Control-Allow-Headers': '*',
  'Access-Control-Expose-Headers': '*',
  'Access-Control-Max-Age': '86400',
}

export default {
  async fetch(request) {
    const url = new URL(request.url)
    const streamUrl = url.searchParams.get('url')

    // CORS preflight - instant response
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: CORS_HEADERS })
    }

    // Health check endpoint
    if (url.pathname === '/health') {
      return new Response(JSON.stringify({ status: 'ok', timestamp: Date.now() }), {
        headers: { 'Content-Type': 'application/json', ...CORS_HEADERS }
      })
    }

    if (!streamUrl) {
      return new Response(JSON.stringify({ error: 'Missing url parameter' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...CORS_HEADERS }
      })
    }

    try {
      const decodedUrl = decodeURIComponent(streamUrl)

      // PERFECTION: Fetch with maximum streaming optimizations
      const response = await fetch(decodedUrl, {
        headers: {
          'User-Agent': 'DASH-WebTV/2.0',
          'Accept': '*/*',
          'Accept-Encoding': 'identity',  // No compression - raw bytes for speed
          'Connection': 'keep-alive',
        },
        cf: {
          // Cloudflare edge optimizations
          cacheTtl: 0,              // Never cache
          cacheEverything: false,   // Really, never cache
          cacheKey: '',             // No cache key
          mirage: false,            // No image optimization
          polish: 'off',            // No compression
          minify: false,            // No minification
          scrapeShield: false,      // No content scanning
          apps: false,              // No Cloudflare apps
        }
      })

      // Check upstream response
      if (!response.ok) {
        return new Response(JSON.stringify({
          error: 'Upstream error',
          status: response.status,
          statusText: response.statusText
        }), {
          status: response.status,
          headers: { 'Content-Type': 'application/json', ...CORS_HEADERS }
        })
      }

      // PERFECTION: Direct passthrough with optimal headers
      // The response.body is a ReadableStream - pass it directly
      return new Response(response.body, {
        status: 200,
        headers: {
          // Content type from upstream or default to MPEG-TS
          'Content-Type': response.headers.get('content-type') || 'video/mp2t',

          // CORS - allow everything
          ...CORS_HEADERS,

          // Caching - absolutely none
          'Cache-Control': 'no-cache, no-store, no-transform, must-revalidate, max-age=0',
          'Pragma': 'no-cache',
          'Expires': '0',

          // Streaming hints
          'X-Content-Type-Options': 'nosniff',
          'X-Accel-Buffering': 'no',          // Nginx hint: don't buffer
          'X-Stream-Type': 'live',             // Custom hint for debugging

          // Transfer: chunked is automatic when no Content-Length
          // DO NOT set Content-Length for live streams!
        }
      })

    } catch (e) {
      return new Response(JSON.stringify({
        error: 'Stream proxy error',
        message: e.message,
        stack: e.stack
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...CORS_HEADERS }
      })
    }
  }
}
