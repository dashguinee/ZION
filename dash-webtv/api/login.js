/**
 * DASH WebTV - Login Proxy
 * SECURE: Provider URL from env variable, never hardcoded
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
    const { username, password } = req.query

    if (!username || !password) {
      return res.status(400).json({ error: 'Missing username or password' })
    }

    // SECURE: Provider URL from environment variable
    const providerUrl = process.env.XTREAM_PROVIDER_URL
    if (!providerUrl) {
      console.error('XTREAM_PROVIDER_URL not configured')
      return res.status(500).json({ error: 'Server configuration error' })
    }

    const url = `${providerUrl}/player_api.php?username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}`

    console.log('Proxying login for:', username)

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'DASH-WebTV/1.0'
      }
    })

    if (!response.ok) {
      return res.status(response.status).json({ error: `Server error: ${response.status}` })
    }

    const data = await response.json()
    res.status(200).json(data)

  } catch (error) {
    console.error('Login proxy error:', error)
    res.status(500).json({
      error: 'Login failed',
      message: error.message
    })
  }
}
