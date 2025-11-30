/**
 * DASH⚡ Xtream Codes API Client
 * Dynamic credentials - no hardcoding!
 */

class XtreamClient {
  constructor() {
    this.baseUrl = 'https://starshare.cx'
    this.username = null
    this.password = null
    this.backendUrl = 'https://zion-production-39d8.up.railway.app'
    // Cloudflare Worker proxy - same network as Starshare = faster
    this.streamProxy = 'https://dash-webtv-proxy.dash-webtv.workers.dev'
  }

  /**
   * Set credentials dynamically after login
   */
  setCredentials(username, password) {
    this.username = username
    this.password = password
    console.log(`⚡ Credentials loaded for: ${this.username}`)
  }

  /**
   * Check if user is authenticated
   */
  get isAuthenticated() {
    return !!(this.username && this.password)
  }

  /**
   * Login - just store credentials, no API validation needed
   * Credentials will be validated when user tries to play content
   */
  async login(username, password) {
    console.log('🔄 Storing credentials...')

    if (!username || !password) {
      return { success: false, error: 'Username and password required' }
    }

    // Just store the credentials - they'll be used in stream URLs
    this.setCredentials(username, password)
    console.log('✅ Credentials saved for:', username)

    return { success: true, info: { username } }
  }

  /**
   * Build player API URL with authentication
   * Uses Vercel proxy to bypass CORS for metadata
   */
  buildPlayerApiUrl(action, params = {}) {
    if (!this.isAuthenticated) {
      console.warn('⚠️ Not authenticated!')
      return null
    }

    // Use Vercel serverless proxy for API metadata calls
    const url = new URL('/api/proxy', window.location.origin)
    url.searchParams.set('username', this.username)
    url.searchParams.set('password', this.password)

    if (action) url.searchParams.set('action', action)

    Object.keys(params).forEach(key => {
      url.searchParams.set(key, params[key])
    })

    return url.toString()
  }

  /**
   * Generic fetch method with error handling
   */
  async fetch(url) {
    if (!url) throw new Error('Authentication required')

    try {
      const response = await fetch(url)
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      return await response.json()
    } catch (error) {
      console.error('Xtream API Error:', error)
      throw error
    }
  }

  // ============================================
  // CATEGORIES
  // ============================================

  async getVODCategories() {
    const url = this.buildPlayerApiUrl('get_vod_categories')
    return this.fetch(url)
  }

  async getSeriesCategories() {
    const url = this.buildPlayerApiUrl('get_series_categories')
    return this.fetch(url)
  }

  async getLiveCategories() {
    const url = this.buildPlayerApiUrl('get_live_categories')
    return this.fetch(url)
  }

  // ============================================
  // STREAMS
  // ============================================

  async getVODStreams(categoryId = null) {
    const params = categoryId ? { category_id: categoryId } : {}
    const url = this.buildPlayerApiUrl('get_vod_streams', params)
    return this.fetch(url)
  }

  async getSeries(categoryId = null) {
    const params = categoryId ? { category_id: categoryId } : {}
    const url = this.buildPlayerApiUrl('get_series', params)
    return this.fetch(url)
  }

  async getLiveStreams(categoryId = null) {
    const params = categoryId ? { category_id: categoryId } : {}
    const url = this.buildPlayerApiUrl('get_live_streams', params)
    return this.fetch(url)
  }

  // ============================================
  // DETAILED INFO
  // ============================================

  async getVODInfo(vodId) {
    const url = this.buildPlayerApiUrl('get_vod_info', { vod_id: vodId })
    return this.fetch(url)
  }

  async getSeriesInfo(seriesId) {
    const url = this.buildPlayerApiUrl('get_series_info', { series_id: seriesId })
    return this.fetch(url)
  }

  async getShortEPG(streamId, limit = 10) {
    const url = this.buildPlayerApiUrl('get_short_epg', {
      stream_id: streamId,
      limit: limit.toString()
    })
    return this.fetch(url)
  }

  // ============================================
  // PLAYBACK URLs - DYNAMIC with user credentials
  // ============================================

  /**
   * Build playable URL for VOD content
   * Proxied via Cloudflare Worker for reliability
   */
  buildVODUrl(vodId, extension = 'mp4') {
    if (!this.isAuthenticated) return ''
    const directUrl = `${this.baseUrl}/movie/${this.username}/${this.password}/${vodId}.${extension}`

    // Proxy through Cloudflare worker for better reliability
    const proxyUrl = `${this.streamProxy}/?url=${encodeURIComponent(directUrl)}`
    console.log(`🎬 Movie URL (Cloudflare proxied): ${proxyUrl}`)
    return proxyUrl
  }

  /**
   * Build playable URL for Series episode
   * Proxied via Cloudflare Worker for reliability
   */
  buildSeriesUrl(episodeId, extension = 'mp4') {
    if (!this.isAuthenticated) return ''
    const directUrl = `${this.baseUrl}/series/${this.username}/${this.password}/${episodeId}.${extension}`

    // Proxy through Cloudflare worker for better reliability
    const proxyUrl = `${this.streamProxy}/?url=${encodeURIComponent(directUrl)}`
    console.log(`📺 Series URL (Cloudflare proxied): ${proxyUrl}`)
    return proxyUrl
  }

  /**
   * Build playable URL for Live TV stream
   * Uses MPEG-TS (.ts) format - works better than HLS for this provider
   * Proxied via Cloudflare Worker (same network as Starshare = fast)
   */
  buildLiveStreamUrl(streamId, extension = 'ts') {
    if (!this.isAuthenticated) return ''
    // Use .ts format (MPEG-TS) - confirmed working with mpegts.js
    const directUrl = `${this.baseUrl}/live/${this.username}/${this.password}/${streamId}.ts`

    // Use Cloudflare Worker proxy (same network as Starshare)
    const proxyUrl = `${this.streamProxy}/?url=${encodeURIComponent(directUrl)}`
    console.log(`📡 Live TV URL (Cloudflare proxied): ${proxyUrl}`)
    return proxyUrl
  }

  // ============================================
  // UTILITY METHODS
  // ============================================

  async getAccountInfo() {
    if (!this.isAuthenticated) return null
    const url = `${this.baseUrl}/player_api.php?username=${this.username}&password=${this.password}`
    return this.fetch(url)
  }

  async testConnection() {
    try {
      const info = await this.getAccountInfo()
      return { success: true, info }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  buildM3UUrl(type = 'm3u_plus', output = 'ts') {
    if (!this.isAuthenticated) return ''
    return `${this.baseUrl}/get.php?username=${this.username}&password=${this.password}&type=${type}&output=${output}`
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = XtreamClient
}
