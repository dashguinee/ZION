/**
 * DASH⚡ Cloudflare Worker - Live Stream Proxy
 *
 * Optimized for continuous MPEG-TS live streams.
 * - TransformStream keeps connection alive
 * - Same Cloudflare network as Starshare = minimal latency
 * - No buffering/caching for real-time streaming
 *
 * Deploy: npx wrangler deploy
 */

export default {
  async fetch(request) {
    const url = new URL(request.url)
    const streamUrl = url.searchParams.get('url')

    // CORS preflight - fast response
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, OPTIONS',
          'Access-Control-Allow-Headers': '*',
          'Access-Control-Max-Age': '86400',
        }
      })
    }

    if (!streamUrl) {
      return new Response(JSON.stringify({ error: 'Missing url parameter' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    try {
      const decodedUrl = decodeURIComponent(streamUrl)

      // Fetch upstream with streaming optimizations
      const response = await fetch(decodedUrl, {
        headers: {
          'User-Agent': 'DASH-WebTV/1.0',
          'Accept': '*/*',
          'Connection': 'keep-alive',
        },
        cf: {
          // Cloudflare optimizations for live streaming
          cacheTtl: 0,
          cacheEverything: false,
          mirage: false,
          polish: 'off',
        }
      })

      // Check if upstream responded correctly
      if (!response.ok) {
        return new Response(JSON.stringify({
          error: 'Upstream error',
          status: response.status
        }), {
          status: response.status,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        })
      }

      // DIRECT PASSTHROUGH - No TransformStream wrapper
      // Pass the response body directly for true streaming
      // The upstream connection stays open = continuous live data
      return new Response(response.body, {
        status: 200,
        headers: {
          'Content-Type': response.headers.get('content-type') || 'video/mp2t',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, OPTIONS',
          'Access-Control-Expose-Headers': '*',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
          'X-Content-Type-Options': 'nosniff',
          // DO NOT set Content-Length - it's a live stream with unknown length!
        }
      })

    } catch (e) {
      return new Response(JSON.stringify({
        error: 'Stream proxy error',
        message: e.message
      }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      })
    }
  }
}
