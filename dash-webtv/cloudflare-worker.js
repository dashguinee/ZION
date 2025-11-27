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

      // TransformStream keeps the pipe open for continuous streaming
      // This is critical for live TV - prevents premature connection close
      const { readable, writable } = new TransformStream()

      // Pipe in background without awaiting
      // The catch prevents unhandled rejection when client disconnects
      response.body.pipeTo(writable).catch(() => {
        // Client disconnected - this is normal for live streams
      })

      // Return streaming response with proper headers
      return new Response(readable, {
        status: 200,
        headers: {
          'Content-Type': response.headers.get('content-type') || 'video/mp2t',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Expose-Headers': '*',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
          'Connection': 'keep-alive',
          'X-Content-Type-Options': 'nosniff',
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
