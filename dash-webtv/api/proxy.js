/**
 * DASH WebTV - Xtream API Proxy
 * Proxies requests with DYNAMIC user credentials
 */

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  // Handle preflight
  if (req.method === 'OPTIONS') {
    res.status(200).end()
    return
  }

  try {
    // Get credentials from query (DYNAMIC - passed from client)
    const { username, password, action, category_id, stream_id, series_id, vod_id, limit } = req.query

    // Validate credentials are provided
    if (!username || !password) {
      return res.status(400).json({
        error: 'Missing credentials',
        message: 'Username and password are required'
      })
    }

    // Build API URL with user's credentials
    const baseUrl = 'https://starshare.cx'
    const url = new URL(`${baseUrl}/player_api.php`)
    url.searchParams.set('username', username)
    url.searchParams.set('password', password)

    if (action) url.searchParams.set('action', action)
    if (category_id) url.searchParams.set('category_id', category_id)
    if (stream_id) url.searchParams.set('stream_id', stream_id)
    if (series_id) url.searchParams.set('series_id', series_id)
    if (vod_id) url.searchParams.set('vod_id', vod_id)
    if (limit) url.searchParams.set('limit', limit)

    console.log('Proxying request for user:', username)

    // Fetch from Xtream API
    const response = await fetch(url.toString())
    const data = await response.json()

    // Return proxied data
    res.status(200).json(data)

  } catch (error) {
    console.error('Proxy error:', error)
    res.status(500).json({
      error: 'Proxy failed',
      message: error.message
    })
  }
}
