/**
 * DASH⚡ Cloudflare Worker - HLS Proxy with Manifest Rewriting
 *
 * This worker proxies HLS streams from ostv.info and rewrites manifest URLs
 * to route all traffic through Cloudflare's distributed network.
 *
 * Benefits:
 * - Bypasses IP blocks (Cloudflare IPs rarely blocked)
 * - Handles CORS automatically
 * - Rewrites manifest URLs to proxy all segments
 * - Free tier: 100,000 requests/day
 */

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

async function handleRequest(request) {
  // Get the target URL from query parameter
  const url = new URL(request.url)
  const targetUrl = url.searchParams.get('url')

  if (!targetUrl) {
    return new Response('Missing url parameter', { status: 400 })
  }

  try {
    // Fetch from origin with spoofed User-Agent
    const response = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Referer': 'https://ostv.info/',
        'Origin': 'https://ostv.info'
      }
    })

    // Get content type
    const contentType = response.headers.get('content-type') || ''

    // Check if this is an HLS manifest (m3u8)
    const isManifest = contentType.includes('application/vnd.apple.mpegurl') ||
                      contentType.includes('application/x-mpegurl') ||
                      targetUrl.includes('.m3u8')

    if (isManifest) {
      // Read manifest text
      const manifestText = await response.text()

      // Rewrite URLs in manifest to go through this worker
      const rewrittenManifest = rewriteManifest(manifestText, targetUrl, url.origin)

      // Return rewritten manifest with CORS headers
      return new Response(rewrittenManifest, {
        status: response.status,
        headers: {
          'Content-Type': 'application/vnd.apple.mpegurl',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
          'Access-Control-Allow-Headers': '*',
          'Cache-Control': 'no-cache'
        }
      })
    } else {
      // For non-manifest content (video segments), just proxy through
      return new Response(response.body, {
        status: response.status,
        headers: {
          'Content-Type': contentType,
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
          'Access-Control-Allow-Headers': '*',
          'Cache-Control': 'public, max-age=3600'
        }
      })
    }
  } catch (error) {
    return new Response(`Proxy Error: ${error.message}`, {
      status: 500,
      headers: {
        'Access-Control-Allow-Origin': '*'
      }
    })
  }
}

/**
 * Rewrite manifest URLs to route through this worker
 */
function rewriteManifest(manifest, originalUrl, workerOrigin) {
  const lines = manifest.split('\n')
  const baseUrl = originalUrl.substring(0, originalUrl.lastIndexOf('/') + 1)

  const rewrittenLines = lines.map(line => {
    // Skip comments and empty lines
    if (line.startsWith('#') || line.trim() === '') {
      return line
    }

    // Check if line is a URL
    if (line.trim().length > 0) {
      let targetUrl

      // Handle absolute URLs
      if (line.startsWith('http://') || line.startsWith('https://')) {
        targetUrl = line
      }
      // Handle relative URLs
      else {
        targetUrl = baseUrl + line
      }

      // Rewrite URL to go through this worker
      return `${workerOrigin}/?url=${encodeURIComponent(targetUrl)}`
    }

    return line
  })

  return rewrittenLines.join('\n')
}
