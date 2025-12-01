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

    // Multi-proxy fallback system for reliability
    // If Cloudflare gets blocked, fall back to Vercel Edge
    this.proxyList = [
      { name: 'Cloudflare', url: 'https://dash-webtv-proxy.dash-webtv.workers.dev', param: 'url' },
      { name: 'Vercel Edge', url: '/api/stream', param: 'url' }  // Our own Vercel Edge function
    ]
    this.currentProxyIndex = 0
    this.streamProxy = this.proxyList[0].url
  }

  /**
   * Get current proxy with fallback support
   */
  getProxy() {
    return this.proxyList[this.currentProxyIndex]
  }

  /**
   * Switch to next proxy (called on stream failure)
   */
  switchProxy() {
    this.currentProxyIndex = (this.currentProxyIndex + 1) % this.proxyList.length
    const proxy = this.getProxy()
    console.log(`🔄 Switching to ${proxy.name} proxy`)
    return proxy
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
   * - MP4: Direct to Starshare (CORS enabled)
   * - MKV/AVI/etc: Route through FFmpeg server for real-time transcoding
   *
   * FFmpeg server uses env credentials (single account mode)
   */
  buildVODUrl(vodId, extension = 'mp4') {
    if (!this.isAuthenticated) return ''

    // Formats that need transcoding (browser can't play these containers)
    const needsTranscode = ['mkv', 'avi', 'flv', 'wmv', 'mov', 'webm']
      .includes(extension.toLowerCase())

    if (needsTranscode) {
      // Route through our FFmpeg transcoding server
      // Server uses env vars for Starshare credentials (single account mode)
      const url = `${this.backendUrl}/api/stream/vod/${vodId}?extension=${extension}&quality=720p`
      console.log(`🎬 Movie URL (FFmpeg transcode): ${url}`)
      return url
    }

    // Direct play for MP4 - Starshare has CORS enabled
    const url = `${this.baseUrl}/movie/${this.username}/${this.password}/${vodId}.${extension}`
    console.log(`🎬 Movie URL (direct): ${url}`)
    return url
  }

  /**
   * Build playable URL for Series episode
   * - MP4: Direct to Starshare (CORS enabled)
   * - MKV/AVI/etc: Route through FFmpeg server for real-time transcoding
   *
   * FFmpeg server uses env credentials (single account mode)
   */
  buildSeriesUrl(episodeId, extension = 'mp4') {
    if (!this.isAuthenticated) return ''

    // Formats that need transcoding (browser can't play these containers)
    const needsTranscode = ['mkv', 'avi', 'flv', 'wmv', 'mov', 'webm']
      .includes(extension.toLowerCase())

    if (needsTranscode) {
      // Route through our FFmpeg transcoding server
      // Using /episode/:episodeId endpoint - takes episode ID directly
      const url = `${this.backendUrl}/api/stream/episode/${episodeId}?extension=${extension}&quality=720p`
      console.log(`📺 Series URL (FFmpeg transcode): ${url}`)
      return url
    }

    // Direct play for MP4 - Starshare has CORS enabled
    const url = `${this.baseUrl}/series/${this.username}/${this.password}/${episodeId}.${extension}`
    console.log(`📺 Series URL (direct): ${url}`)
    return url
  }

  /**
   * Detect if browser has native HLS support (no CORS issues!)
   * - Safari macOS/iOS: Native HLS
   * - ALL iOS browsers: Use WebKit engine = Native HLS
   * - Android/Windows/Linux: No native HLS (need proxy)
   */
  hasNativeHLS() {
    const ua = navigator.userAgent

    // iOS detection - ALL iOS browsers use WebKit with native HLS!
    const isIOS = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)

    // Safari on macOS (but not Chrome pretending to be Safari)
    const isSafariMac = /Safari/.test(ua) && !/Chrome/.test(ua) && !/Chromium/.test(ua) && /Mac/.test(ua)

    if (isIOS) {
      console.log('📱 iOS detected - ALL browsers have native HLS!')
      return true
    }
    if (isSafariMac) {
      console.log('🍎 Safari macOS detected - native HLS!')
      return true
    }
    return false
  }

  /**
   * Build playable URL for Live TV stream
   * HYBRID APPROACH:
   * - iOS (all browsers) + Safari macOS: Direct HLS (.m3u8) - native support, no CORS needed!
   * - Android/Windows/Linux: Proxied MPEG-TS (.ts) via Cloudflare
   */
  buildLiveStreamUrl(streamId, extension = 'ts') {
    if (!this.isAuthenticated) return ''

    // iOS/Safari has native HLS support - can play .m3u8 directly without CORS!
    if (this.hasNativeHLS()) {
      const hlsUrl = `${this.baseUrl}/live/${this.username}/${this.password}/${streamId}.m3u8`
      console.log(`🍎 Live TV URL (native HLS - no proxy!): ${hlsUrl}`)
      return { url: hlsUrl, type: 'hls-native' }
    }

    // Android/Windows/Linux: Use MPEG-TS with proxy (Cloudflare or Vercel fallback)
    const directUrl = `${this.baseUrl}/live/${this.username}/${this.password}/${streamId}.ts`
    const proxy = this.getProxy()
    const proxyUrl = `${proxy.url}/?${proxy.param}=${encodeURIComponent(directUrl)}`
    console.log(`📡 Live TV URL (${proxy.name} proxied TS): ${proxyUrl}`)
    return { url: proxyUrl, type: 'mpegts', proxy: proxy.name, directUrl }
  }

  /**
   * Build fallback URL using next proxy (for retry on failure)
   */
  buildFallbackLiveStreamUrl(streamId) {
    if (!this.isAuthenticated) return null

    const proxy = this.switchProxy()
    const directUrl = `${this.baseUrl}/live/${this.username}/${this.password}/${streamId}.ts`
    const proxyUrl = `${proxy.url}/?${proxy.param}=${encodeURIComponent(directUrl)}`
    console.log(`🔄 Fallback Live TV URL (${proxy.name}): ${proxyUrl}`)
    return { url: proxyUrl, type: 'mpegts', proxy: proxy.name }
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
