/**
 * DASH WebTV - Stream Proxy
 * Proxies HLS streams to add CORS headers
 */

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Range')
  res.setHeader('Access-Control-Expose-Headers', 'Content-Length, Content-Range')

  // Handle preflight
  if (req.method === 'OPTIONS') {
    res.status(200).end()
    return
  }

  try {
    const { url } = req.query

    if (!url) {
      return res.status(400).json({ error: 'Missing URL parameter' })
    }

    // Decode the URL
    const streamUrl = decodeURIComponent(url)
    console.log('Proxying stream:', streamUrl)

    // Fetch the stream
    const response = await fetch(streamUrl, {
      headers: {
        'User-Agent': 'DASH-WebTV/1.0',
        'Accept': '*/*',
        ...(req.headers.range ? { 'Range': req.headers.range } : {})
      },
      redirect: 'follow'
    })

    // Forward status and headers
    res.status(response.status)

    const contentType = response.headers.get('content-type')
    if (contentType) {
      res.setHeader('Content-Type', contentType)
    }

    const contentLength = response.headers.get('content-length')
    if (contentLength) {
      res.setHeader('Content-Length', contentLength)
    }

    const contentRange = response.headers.get('content-range')
    if (contentRange) {
      res.setHeader('Content-Range', contentRange)
    }

    // Stream the response body
    if (response.body) {
      const reader = response.body.getReader()

      const pump = async () => {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          res.write(Buffer.from(value))
        }
        res.end()
      }

      await pump()
    } else {
      // Fallback for environments without streaming
      const buffer = await response.arrayBuffer()
      res.send(Buffer.from(buffer))
    }

  } catch (error) {
    console.error('Stream proxy error:', error)
    res.status(500).json({
      error: 'Stream proxy failed',
      message: error.message
    })
  }
}

export const config = {
  api: {
    responseLimit: false,
  },
}
