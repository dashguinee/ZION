/**
 * DASH⚡ Secure Streaming Client v2.1
 *
 * SECURITY: Provider details hidden server-side.
 * Frontend fetches URL patterns once, then builds URLs locally.
 *
 * Flow:
 * 1. On init: fetch URL patterns from backend
 * 2. Build URLs locally using patterns (fast, sync)
 * 3. No provider information in frontend code
 *
 * December 2025
 */

class XtreamClient {
  constructor() {
    // SECURE: Only our backend URL - no provider!
    this.backendUrl = 'https://zion-production-39d8.up.railway.app'

    // URL patterns (fetched from backend on init)
    this.patterns = null
    this.patternsLoaded = false

    // Session state
    this.isLoggedIn = false

    // Multi-proxy fallback for Live TV
    this.proxyList = [
      { name: 'Edge', url: 'https://dash-webtv.vercel.app/api/stream', param: 'url' },
      { name: 'Worker', url: 'https://dash-webtv-proxy.dash-webtv.workers.dev', param: 'url' }
    ]
    this.currentProxyIndex = 0

    // Quality settings
    this.availableQualities = ['360p', '480p', '720p', '1080p']
    this.defaultQuality = '720p'
  }

  // ============================================
  // INITIALIZATION - Fetch patterns from backend
  // ============================================

  /**
   * Initialize client - MUST be called before using URL builders
   * Fetches URL patterns from backend (called once on app load)
   */
  async init() {
    try {
      const response = await fetch(`${this.backendUrl}/api/secure/patterns`)
      if (response.ok) {
        this.patterns = await response.json()
        this.patternsLoaded = true
        console.log('🔒 Secure patterns loaded')
        return true
      }
    } catch (error) {
      console.warn('Failed to load patterns, using fallback')
    }

    // Fallback: Use backend for all URL generation (slower but works)
    this.patternsLoaded = false
    return false
  }

  // ============================================
  // QUALITY PREFERENCE
  // ============================================

  getPreferredQuality() {
    const saved = localStorage.getItem('dash_quality_preference')
    if (saved && this.availableQualities.includes(saved)) {
      return saved
    }
    return this.defaultQuality
  }

  setPreferredQuality(quality) {
    if (this.availableQualities.includes(quality)) {
      localStorage.setItem('dash_quality_preference', quality)
      return true
    }
    return false
  }

  getAvailableQualities() {
    return [...this.availableQualities]
  }

  // ============================================
  // PROXY MANAGEMENT
  // ============================================

  getProxy() {
    return this.proxyList[this.currentProxyIndex]
  }

  switchProxy() {
    this.currentProxyIndex = (this.currentProxyIndex + 1) % this.proxyList.length
    return this.getProxy()
  }

  // ============================================
  // AUTHENTICATION
  // ============================================

  setCredentials(username, password) {
    // Store user identity (backend handles actual provider auth)
    localStorage.setItem('dash_user', username)
    this.isLoggedIn = true
    console.log('⚡ User logged in:', username)
  }

  get isAuthenticated() {
    if (this.isLoggedIn) return true
    const savedUser = localStorage.getItem('dash_user')
    if (savedUser) {
      this.isLoggedIn = true
      return true
    }
    return false
  }

  async login(username, password) {
    if (!username || !password) {
      return { success: false, error: 'Username and password required' }
    }
    this.setCredentials(username, password)
    return { success: true, info: { username } }
  }

  logout() {
    localStorage.removeItem('dash_user')
    this.isLoggedIn = false
  }

  // ============================================
  // SECURE API CALLS (Metadata from backend)
  // ============================================

  async secureFetch(endpoint) {
    try {
      const response = await fetch(`${this.backendUrl}${endpoint}`)
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      return await response.json()
    } catch (error) {
      console.error('API Error:', error)
      throw error
    }
  }

  // Categories
  async getVODCategories() {
    return this.secureFetch('/api/secure/categories/vod')
  }

  async getSeriesCategories() {
    return this.secureFetch('/api/secure/categories/series')
  }

  async getLiveCategories() {
    return this.secureFetch('/api/secure/categories/live')
  }

  // Content lists
  async getVODStreams(categoryId = null) {
    const endpoint = categoryId
      ? `/api/secure/content/vod?category_id=${categoryId}`
      : '/api/secure/content/vod'
    return this.secureFetch(endpoint)
  }

  async getSeries(categoryId = null) {
    const endpoint = categoryId
      ? `/api/secure/content/series?category_id=${categoryId}`
      : '/api/secure/content/series'
    return this.secureFetch(endpoint)
  }

  async getLiveStreams(categoryId = null) {
    const endpoint = categoryId
      ? `/api/secure/content/live?category_id=${categoryId}`
      : '/api/secure/content/live'
    return this.secureFetch(endpoint)
  }

  // Detailed info
  async getVODInfo(vodId) {
    return this.secureFetch(`/api/secure/info/vod/${vodId}`)
  }

  async getSeriesInfo(seriesId) {
    return this.secureFetch(`/api/secure/info/series/${seriesId}`)
  }

  async getShortEPG(streamId, limit = 10) {
    // EPG not critical - return empty if fails
    try {
      return await this.secureFetch(`/api/secure/epg/${streamId}?limit=${limit}`)
    } catch {
      return []
    }
  }

  // ============================================
  // URL BUILDERS (Sync - uses cached patterns or backend)
  // ============================================

  /**
   * Build VOD stream URL
   * If patterns loaded: builds locally (fast)
   * If no patterns: returns backend transcode URL (always works)
   */
  buildVODUrl(vodId, extension = 'mp4', quality = null) {
    if (!this.isAuthenticated) return ''

    const selectedQuality = quality || this.getPreferredQuality()
    const needsTranscode = ['mkv', 'avi', 'flv', 'wmv', 'mov', 'webm']
      .includes(extension.toLowerCase())

    // MKV always goes through our transcoder (safe, no provider exposed)
    if (needsTranscode) {
      return `${this.backendUrl}/api/stream/vod/${vodId}?extension=${extension}&quality=${selectedQuality}`
    }

    // MP4: Use pattern if available, otherwise backend proxy
    if (this.patternsLoaded && this.patterns?.movie) {
      return this.patterns.movie.replace('{id}', vodId).replace('{ext}', extension)
    }

    // Fallback: Ask backend for URL
    // Note: This is async in reality, but we return the transcode URL as fallback
    return `${this.backendUrl}/api/stream/vod/${vodId}?extension=${extension}&quality=${selectedQuality}`
  }

  /**
   * Build series episode URL
   */
  buildSeriesUrl(episodeId, extension = 'mp4', quality = null) {
    if (!this.isAuthenticated) return ''

    const selectedQuality = quality || this.getPreferredQuality()
    const needsTranscode = ['mkv', 'avi', 'flv', 'wmv', 'mov', 'webm']
      .includes(extension.toLowerCase())

    if (needsTranscode) {
      return `${this.backendUrl}/api/stream/episode/${episodeId}?extension=${extension}&quality=${selectedQuality}`
    }

    if (this.patternsLoaded && this.patterns?.series) {
      return this.patterns.series.replace('{id}', episodeId).replace('{ext}', extension)
    }

    return `${this.backendUrl}/api/stream/episode/${episodeId}?extension=${extension}&quality=${selectedQuality}`
  }

  /**
   * Build direct download URL (bypasses transcoder)
   */
  buildDirectVODUrl(vodId, extension = 'mp4') {
    if (!this.isAuthenticated) return ''

    if (this.patternsLoaded && this.patterns?.movie) {
      return this.patterns.movie.replace('{id}', vodId).replace('{ext}', extension)
    }

    // Fallback to transcode URL (will work but not ideal for download)
    return `${this.backendUrl}/api/stream/vod/${vodId}?extension=${extension}`
  }

  buildDirectSeriesUrl(episodeId, extension = 'mp4') {
    if (!this.isAuthenticated) return ''

    if (this.patternsLoaded && this.patterns?.series) {
      return this.patterns.series.replace('{id}', episodeId).replace('{ext}', extension)
    }

    return `${this.backendUrl}/api/stream/episode/${episodeId}?extension=${extension}`
  }

  // ============================================
  // LIVE TV
  // ============================================

  hasNativeHLS() {
    const ua = navigator.userAgent
    const isIOS = /iPad|iPhone|iPod/.test(ua) ||
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
    const isSafariMac = /Safari/.test(ua) && !/Chrome/.test(ua) &&
      !/Chromium/.test(ua) && /Mac/.test(ua)
    return isIOS || isSafariMac
  }

  buildLiveStreamUrl(streamId, extension = 'ts') {
    if (!this.isAuthenticated) return ''

    // Native HLS (Safari/iOS)
    if (this.hasNativeHLS()) {
      if (this.patternsLoaded && this.patterns?.live) {
        const hlsUrl = this.patterns.live
          .replace('{id}', streamId)
          .replace('{ext}', 'm3u8')
        return { url: hlsUrl, type: 'hls-native' }
      }
      // Fallback - use backend live endpoint
      return {
        url: `${this.backendUrl}/api/live/${streamId}`,
        type: 'hls-native'
      }
    }

    // MPEG-TS with proxy (Chrome/Android/Windows)
    let directUrl = ''
    if (this.patternsLoaded && this.patterns?.live) {
      directUrl = this.patterns.live
        .replace('{id}', streamId)
        .replace('{ext}', 'ts')
    } else {
      // No pattern - construct from backend
      directUrl = `${this.backendUrl}/api/live/${streamId}`
    }

    const proxy = this.getProxy()
    const proxyUrl = `${proxy.url}/?${proxy.param}=${encodeURIComponent(directUrl)}`

    return {
      url: proxyUrl,
      type: 'mpegts',
      proxy: proxy.name,
      directUrl
    }
  }

  buildFallbackLiveStreamUrl(streamId) {
    if (!this.isAuthenticated) return null

    const proxy = this.switchProxy()
    const directUrl = this.patternsLoaded && this.patterns?.live
      ? this.patterns.live.replace('{id}', streamId).replace('{ext}', 'ts')
      : `${this.backendUrl}/api/live/${streamId}`

    const proxyUrl = `${proxy.url}/?${proxy.param}=${encodeURIComponent(directUrl)}`
    return { url: proxyUrl, type: 'mpegts', proxy: proxy.name }
  }

  // ============================================
  // UTILITY
  // ============================================

  async testConnection() {
    try {
      const response = await this.secureFetch('/api/secure/health')
      return { success: response.status === 'ok', info: response }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  async getAccountInfo() {
    if (!this.isAuthenticated) return null
    try {
      return await this.secureFetch('/api/secure/health')
    } catch {
      return null
    }
  }

  // Legacy compatibility
  buildPlayerApiUrl(action, params = {}) {
    // Deprecated - use secure endpoints instead
    console.warn('buildPlayerApiUrl is deprecated, use secure endpoints')
    return null
  }

  buildM3UUrl(type = 'm3u_plus', output = 'ts') {
    // Not exposed in secure mode
    return ''
  }
}

// Export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = XtreamClient
}
