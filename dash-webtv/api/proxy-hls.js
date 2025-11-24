/**
 * Vercel Edge Function - HLS Proxy
 * Proxies Live TV HLS streams to avoid CORS and authentication issues
 */

export const config = {
  runtime: 'edge',
};

export default async function handler(req) {
  const url = new URL(req.url);
  const targetUrl = url.searchParams.get('url');

  if (!targetUrl) {
    return new Response('Missing url parameter', { status: 400 });
  }

  try {
    console.log(`Proxying: ${targetUrl.substring(0, 100)}...`);

    const response = await fetch(targetUrl);

    if (!response.ok) {
      return new Response(`Upstream error: ${response.status}`, {
        status: response.status
      });
    }

    const data = await response.text();

    // Check if this is an HLS manifest
    const isManifest = targetUrl.includes('.m3u8') || data.includes('#EXTM3U');

    let processedData = data;

    if (isManifest) {
      // Rewrite manifest URLs to proxy through our edge function
      const baseUrl = targetUrl.substring(0, targetUrl.lastIndexOf('/') + 1);

      processedData = data.split('\n').map(line => {
        // Skip comments and empty lines
        if (line.startsWith('#') || !line.trim()) {
          return line;
        }

        // If line is already a full URL, proxy it
        if (line.startsWith('http')) {
          return `/api/proxy-hls?url=${encodeURIComponent(line)}`;
        }

        // If it's a relative path, make it absolute then proxy
        if (line.trim()) {
          const absoluteUrl = baseUrl + line.trim();
          return `/api/proxy-hls?url=${encodeURIComponent(absoluteUrl)}`;
        }

        return line;
      }).join('\n');

      console.log(`Rewritten manifest with ${processedData.split('\n').length} lines`);
    }

    return new Response(processedData, {
      headers: {
        'Content-Type': isManifest
          ? 'application/vnd.apple.mpegurl'
          : 'video/MP2T',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Cache-Control': isManifest
          ? 'public, max-age=10'
          : 'public, max-age=300',
      }
    });
  } catch (error) {
    console.error(`Proxy error: ${error.message}`);
    return new Response(`Proxy error: ${error.message}`, { status: 500 });
  }
}
