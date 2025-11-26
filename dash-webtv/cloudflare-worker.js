/**
 * DASH⚡ Cloudflare Worker - Stream Proxy
 *
 * Ultra-fast stream proxy on Cloudflare's network.
 * Starshare uses Cloudflare, so same-network = minimal latency.
 *
 * Deploy: wrangler deploy
 * URL: https://dash-stream.dashguinee.workers.dev
 */

export default {
  async fetch(request) {
    const url = new URL(request.url)
    const streamUrl = url.searchParams.get('url')

    // CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, OPTIONS',
          'Access-Control-Allow-Headers': '*',
        }
      })
    }

    if (!streamUrl) {
      return new Response('Missing url', { status: 400 })
    }

    try {
      // Direct passthrough - same Cloudflare network as Starshare
      const response = await fetch(decodeURIComponent(streamUrl), {
        headers: {
          'User-Agent': 'DASH-WebTV/1.0'
        }
      })

      // Stream body directly with CORS
      return new Response(response.body, {
        status: response.status,
        headers: {
          'Content-Type': response.headers.get('content-type') || 'video/mp2t',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Expose-Headers': '*',
        }
      })
    } catch (e) {
      return new Response('Stream error', { status: 500 })
    }
  }
}
