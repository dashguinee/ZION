/**
 * DASH⚡ Secure Streaming Client v2.0
 *
 * SECURITY UPDATE (Dec 2025):
 * - Provider URL fetched from backend at runtime
 * - No hardcoded provider information in frontend code
 * - Patterns cached locally after first fetch
 */

class XtreamClient {
  constructor() {
    // SECURE: Backend URL only - provider details fetched at runtime
    this.backendUrl = 'https://zion-production-39d8.up.railway.app'

    // URL patterns (loaded from backend)
    this._patterns = null
    this._patternsLoading = null

    // User session
    this.username = null
    this.password = null

    // Multi-proxy fallback system for reliability
    this.proxyList = [
      { name: 'Vercel Edge', url: 'https://dash-webtv.vercel.app/api/stream', param: 'url' },
      { name: 'Cloudflare', url: 'https://dash-webtv-proxy.dash-webtv.workers.dev', param: 'url' }
    ]
    this.currentProxyIndex = 0
    this.streamProxy = this.proxyList[0].url

    // Quality settings
    this.availableQualities = ['360p', '480p', '720p', '1080p']
    this.defaultQuality = '720p'

    // Auto-load patterns on construction
    this._loadPatterns()
  }

  /**
   * Load URL patterns from backend (called once)
   * Patterns contain the provider URL but are fetched at runtime
   */
  async _loadPatterns() {
    if (this._patternsLoading) return this._patternsLoading

    this._patternsLoading = fetch(`${this.backendUrl}/api/secure/patterns`)
      .then(r => r.json())
      .then(patterns => {
        this._patterns = patterns
        console.log('🔒 Secure patterns loaded')
        return patterns
      })
      .catch(err => {
        console.warn('⚠️ Failed to load patterns, using fallback mode')
        return null
      })

    return this._patternsLoading
  }

  /**
   * Get base URL from patterns (or null if not loaded)
   */
  get baseUrl() {
    if (this._patterns?.movie) {
      // Extract base URL from movie pattern
      const match = this._patterns.movie.match(/^(https?:\/\/[^/]+)/)
      return match ? match[1] : null
    }
    return null
  }

  // ============================================
  // QUALITY PREFERENCE MANAGEMENT
  // ============================================

  /**
   * Get user's preferred quality from localStorage
   * Defaults to 720p for good balance of quality/bandwidth
   */
  getPreferredQuality() {
    const saved = localStorage.getItem('dash_quality_preference')
    if (saved && this.availableQualities.includes(saved)) {
      return saved
    }
    return this.defaultQuality
  }

  /**
   * Set user's preferred quality
   */
  setPreferredQuality(quality) {
    if (this.availableQualities.includes(quality)) {
      localStorage.setItem('dash_quality_preference', quality)
      console.log(`📺 Quality preference set to: ${quality}`)
      return true
    }
    console.warn(`⚠️ Invalid quality: ${quality}. Available: ${this.availableQualities.join(', ')}`)
    return false
  }

  /**
   * Get all available quality options
   */
  getAvailableQualities() {
    return [...this.availableQualities]
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
   * SECURE: Uses patterns from backend (no hardcoded provider URL)
   *
   * @param {string} vodId - VOD content ID
   * @param {string} extension - File extension (mp4, mkv, etc)
   * @param {string} quality - Quality setting (360p, 480p, 720p, 1080p)
   */
  buildVODUrl(vodId, extension = 'mp4', quality = null) {
    if (!this.isAuthenticated) return ''

    const selectedQuality = quality || this.getPreferredQuality()

    // Formats that need transcoding (browser can't play these containers)
    const needsTranscode = ['mkv', 'avi', 'flv', 'wmv', 'mov', 'webm']
      .includes(extension.toLowerCase())

    // MKV always goes through our secure FFmpeg transcoder
    if (needsTranscode) {
      const url = `${this.backendUrl}/api/stream/vod/${vodId}?extension=${extension}&quality=${selectedQuality}`
      console.log(`🎬 Movie (transcode): ${vodId}`)
      return url
    }

    // Use pattern from backend if available
    if (this._patterns?.movie) {
      const url = this._patterns.movie
        .replace('{id}', vodId)
        .replace('{ext}', extension)
      console.log(`🎬 Movie (direct): ${vodId}`)
      return url
    }

    // Fallback: Route through backend transcoder (slower but always works)
    console.log(`🎬 Movie (fallback): ${vodId}`)
    return `${this.backendUrl}/api/stream/vod/${vodId}?extension=${extension}&quality=${selectedQuality}`
  }

  /**
   * Build playable URL for Series episode
   * SECURE: Uses patterns from backend (no hardcoded provider URL)
   */
  buildSeriesUrl(episodeId, extension = 'mp4', quality = null) {
    if (!this.isAuthenticated) return ''

    const selectedQuality = quality || this.getPreferredQuality()

    const needsTranscode = ['mkv', 'avi', 'flv', 'wmv', 'mov', 'webm']
      .includes(extension.toLowerCase())

    if (needsTranscode) {
      const url = `${this.backendUrl}/api/stream/episode/${episodeId}?extension=${extension}&quality=${selectedQuality}`
      console.log(`📺 Episode (transcode): ${episodeId}`)
      return url
    }

    // Use pattern from backend if available
    if (this._patterns?.series) {
      const url = this._patterns.series
        .replace('{id}', episodeId)
        .replace('{ext}', extension)
      console.log(`📺 Episode (direct): ${episodeId}`)
      return url
    }

    // Fallback: Route through backend transcoder
    console.log(`📺 Episode (fallback): ${episodeId}`)
    return `${this.backendUrl}/api/stream/episode/${episodeId}?extension=${extension}&quality=${selectedQuality}`
  }

  /**
   * Build DIRECT URL for Series episode (for downloads)
   * SECURE: Uses patterns from backend
   */
  buildDirectSeriesUrl(episodeId, extension = 'mp4') {
    if (!this.isAuthenticated) return ''

    if (this._patterns?.series) {
      return this._patterns.series
        .replace('{id}', episodeId)
        .replace('{ext}', extension)
    }

    // Fallback
    return `${this.backendUrl}/api/stream/episode/${episodeId}?extension=${extension}`
  }

  /**
   * Build DIRECT URL for VOD content (for downloads)
   * SECURE: Uses patterns from backend
   */
  buildDirectVODUrl(vodId, extension = 'mp4') {
    if (!this.isAuthenticated) return ''

    if (this._patterns?.movie) {
      return this._patterns.movie
        .replace('{id}', vodId)
        .replace('{ext}', extension)
    }

    // Fallback
    return `${this.backendUrl}/api/stream/vod/${vodId}?extension=${extension}`
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
   * SECURE: Uses patterns from backend
   */
  buildLiveStreamUrl(streamId, extension = 'ts') {
    if (!this.isAuthenticated) return ''

    // iOS/Safari has native HLS support
    if (this.hasNativeHLS()) {
      if (this._patterns?.live) {
        const hlsUrl = this._patterns.live
          .replace('{id}', streamId)
          .replace('{ext}', 'm3u8')
        console.log(`🍎 Live TV (HLS): ${streamId}`)
        return { url: hlsUrl, type: 'hls-native' }
      }
      // Fallback to backend
      return {
        url: `${this.backendUrl}/api/live/${streamId}`,
        type: 'hls-native'
      }
    }

    // Android/Windows/Linux: Use MPEG-TS with proxy
    let directUrl = ''
    if (this._patterns?.live) {
      directUrl = this._patterns.live
        .replace('{id}', streamId)
        .replace('{ext}', 'ts')
    } else {
      directUrl = `${this.backendUrl}/api/live/${streamId}`
    }

    const proxy = this.getProxy()
    const proxyUrl = `${proxy.url}/?${proxy.param}=${encodeURIComponent(directUrl)}`
    console.log(`📡 Live TV (${proxy.name}): ${streamId}`)
    return { url: proxyUrl, type: 'mpegts', proxy: proxy.name, directUrl }
  }

  /**
   * Build fallback URL using next proxy
   */
  buildFallbackLiveStreamUrl(streamId) {
    if (!this.isAuthenticated) return null

    const proxy = this.switchProxy()
    let directUrl = ''
    if (this._patterns?.live) {
      directUrl = this._patterns.live
        .replace('{id}', streamId)
        .replace('{ext}', 'ts')
    } else {
      directUrl = `${this.backendUrl}/api/live/${streamId}`
    }

    const proxyUrl = `${proxy.url}/?${proxy.param}=${encodeURIComponent(directUrl)}`
    console.log(`🔄 Fallback Live TV (${proxy.name}): ${streamId}`)
    return { url: proxyUrl, type: 'mpegts', proxy: proxy.name }
  }

  // ============================================
  // UTILITY METHODS
  // ============================================

  async getAccountInfo() {
    // Use backend secure health check instead of direct provider call
    try {
      const response = await fetch(`${this.backendUrl}/api/secure/health`)
      return response.json()
    } catch {
      return null
    }
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
    // SECURITY: M3U export disabled in secure mode
    // This would expose the provider URL directly
    // If needed, implement via backend: /api/secure/export/m3u
    console.warn('⚠️ M3U export disabled for security - use backend endpoint')
    return ''
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = XtreamClient
}
