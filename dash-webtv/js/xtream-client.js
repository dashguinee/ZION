/**
 * DASH⚡ Xtream Codes API Client
 * Handles all communication with Xtream Codes IPTV API
 */

class XtreamClient {
  constructor(config) {
    this.baseUrl = config.baseUrl || 'http://starshare.cx:80'
    this.username = config.username || 'Aziz - Test 1'
    this.password = config.password || 'Test1'
  }

  /**
   * Build player API URL with authentication
   */
  buildPlayerApiUrl(action, params = {}) {
    const url = new URL(`${this.baseUrl}/player_api.php`)
    url.searchParams.set('username', this.username)
    url.searchParams.set('password', this.password)
    url.searchParams.set('action', action)

    // Add additional parameters
    Object.keys(params).forEach(key => {
      url.searchParams.set(key, params[key])
    })

    return url.toString()
  }

  /**
   * Generic fetch method with error handling
   */
  async fetch(url) {
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

  /**
   * Get all VOD (Movies) categories
   */
  async getVODCategories() {
    const url = this.buildPlayerApiUrl('get_vod_categories')
    return this.fetch(url)
  }

  /**
   * Get all Series categories
   */
  async getSeriesCategories() {
    const url = this.buildPlayerApiUrl('get_series_categories')
    return this.fetch(url)
  }

  /**
   * Get all Live TV categories
   */
  async getLiveCategories() {
    const url = this.buildPlayerApiUrl('get_live_categories')
    return this.fetch(url)
  }

  // ============================================
  // STREAMS
  // ============================================

  /**
   * Get VOD streams (all or by category)
   * @param {string|null} categoryId - Optional category filter
   */
  async getVODStreams(categoryId = null) {
    const params = categoryId ? { category_id: categoryId } : {}
    const url = this.buildPlayerApiUrl('get_vod_streams', params)
    return this.fetch(url)
  }

  /**
   * Get Series (all or by category)
   * @param {string|null} categoryId - Optional category filter
   */
  async getSeries(categoryId = null) {
    const params = categoryId ? { category_id: categoryId } : {}
    const url = this.buildPlayerApiUrl('get_series', params)
    return this.fetch(url)
  }

  /**
   * Get Live TV streams (all or by category)
   * @param {string|null} categoryId - Optional category filter
   */
  async getLiveStreams(categoryId = null) {
    const params = categoryId ? { category_id: categoryId } : {}
    const url = this.buildPlayerApiUrl('get_live_streams', params)
    return this.fetch(url)
  }

  // ============================================
  // DETAILED INFO
  // ============================================

  /**
   * Get detailed info for a specific VOD item
   * @param {string} vodId - VOD stream ID
   */
  async getVODInfo(vodId) {
    const url = this.buildPlayerApiUrl('get_vod_info', { vod_id: vodId })
    return this.fetch(url)
  }

  /**
   * Get detailed info for a specific Series
   * @param {string} seriesId - Series ID
   */
  async getSeriesInfo(seriesId) {
    const url = this.buildPlayerApiUrl('get_series_info', { series_id: seriesId })
    return this.fetch(url)
  }

  /**
   * Get short EPG for a live stream
   * @param {string} streamId - Live stream ID
   * @param {number} limit - Number of EPG entries to return
   */
  async getShortEPG(streamId, limit = 10) {
    const url = this.buildPlayerApiUrl('get_short_epg', {
      stream_id: streamId,
      limit: limit.toString()
    })
    return this.fetch(url)
  }

  // ============================================
  // PLAYBACK URLs
  // ============================================

  /**
   * Build playable URL for VOD content
   * @param {string} vodId - VOD stream ID
   * @param {string} extension - File extension (mp4, mkv, avi, etc.)
   */
  buildVODUrl(vodId, extension = 'mp4') {
    return `${this.baseUrl}/movie/${this.username}/${this.password}/${vodId}.${extension}`
  }

  /**
   * Build playable URL for Series episode
   * @param {string} seriesId - Series ID
   * @param {string} season - Season number
   * @param {string} episode - Episode number
   * @param {string} extension - File extension
   */
  buildSeriesUrl(seriesId, season, episode, extension = 'mp4') {
    return `${this.baseUrl}/series/${this.username}/${this.password}/${seriesId}/${season}/${episode}.${extension}`
  }

  /**
   * Build playable URL for Live TV stream
   * @param {string} streamId - Live stream ID
   * @param {string} extension - Stream format (ts, m3u8)
   */
  buildLiveStreamUrl(streamId, extension = 'ts') {
    return `${this.baseUrl}/live/${this.username}/${this.password}/${streamId}.${extension}`
  }

  // ============================================
  // UTILITY METHODS
  // ============================================

  /**
   * Get server info and account details
   */
  async getAccountInfo() {
    const url = `${this.baseUrl}/player_api.php?username=${this.username}&password=${this.password}`
    return this.fetch(url)
  }

  /**
   * Test connection to the server
   */
  async testConnection() {
    try {
      const info = await this.getAccountInfo()
      return {
        success: true,
        info: info
      }
    } catch (error) {
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * Build M3U playlist URL
   * @param {string} type - Playlist type (m3u, m3u_plus)
   * @param {string} output - Output format (ts, m3u8, hls)
   */
  buildM3UUrl(type = 'm3u_plus', output = 'ts') {
    return `${this.baseUrl}/get.php?username=${this.username}&password=${this.password}&type=${type}&output=${output}`
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = XtreamClient
}
