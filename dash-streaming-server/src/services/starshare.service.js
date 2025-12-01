import axios from 'axios';
import config from '../config.js';
import logger from '../utils/logger.js';
import cacheService from './cache.service.js';

class StarshareService {
  constructor() {
    this.baseUrl = config.starshare.baseUrl;
    this.username = config.starshare.username;
    this.password = config.starshare.password;
  }

  /**
   * Build stream URL for VOD (Movies/Series)
   */
  buildVODUrl(streamId, extension = 'mp4') {
    return `${this.baseUrl}/movie/${this.username}/${this.password}/${streamId}.${extension}`;
  }

  /**
   * Build stream URL for Series episode (with season/episode path)
   */
  buildSeriesUrl(seriesId, season, episode, extension = 'mp4') {
    return `${this.baseUrl}/series/${this.username}/${this.password}/${seriesId}/${season}/${episode}.${extension}`;
  }

  /**
   * Build stream URL for Series episode by episode ID only
   * Xtream Codes API uses direct episode IDs on /series/ path
   */
  buildSeriesUrlByEpisodeId(episodeId, extension = 'mp4') {
    return `${this.baseUrl}/series/${this.username}/${this.password}/${episodeId}.${extension}`;
  }

  /**
   * Build initial URL for Live TV (will redirect with token)
   */
  buildLiveUrl(streamId) {
    // NO extension - server redirects with token
    return `${this.baseUrl}/${this.username}/${this.password}/${streamId}`;
  }

  /**
   * Resolve Live TV redirect and get final URL with token
   */
  async resolveLiveUrl(streamId) {
    const cacheKey = `live:token:${streamId}`;

    // Check cache first
    const cached = await cacheService.get(cacheKey);
    if (cached) {
      logger.info(`Live TV token cache HIT: ${streamId}`);
      return cached;
    }

    try {
      const initialUrl = this.buildLiveUrl(streamId);
      logger.info(`Resolving Live TV redirect: ${streamId}`);

      // Follow redirect manually
      const response = await axios.get(initialUrl, {
        maxRedirects: 0,
        validateStatus: (status) => status === 302
      });

      const finalUrl = response.headers.location;

      if (!finalUrl) {
        throw new Error('No redirect location found');
      }

      logger.info(`Live TV resolved: ${streamId} → ${finalUrl.substring(0, 100)}...`);

      // Cache for 5 minutes (tokens expire)
      // Use raw URL for backend proxying (no .m3u8 appenditure)
      const result = {
        url: finalUrl,
        streamId,
        cached: false,
        timestamp: Date.now()
      };

      await cacheService.set(cacheKey, result, config.cache.liveTokenTTL);

      return { ...result, cached: false };
    } catch (error) {
      logger.error(`Live TV resolve error (${streamId}):`, error.message);
      throw new Error(`Failed to resolve live stream: ${error.message}`);
    }
  }

  /**
   * Get stream info from API
   */
  async getStreamInfo(type, id) {
    const cacheKey = `info:${type}:${id}`;

    // Check cache
    const cached = await cacheService.get(cacheKey);
    if (cached) return cached;

    try {
      const apiUrl = `${this.baseUrl}/player_api.php`;
      const params = {
        username: this.username,
        password: this.password
      };

      if (type === 'vod') {
        params.action = 'get_vod_info';
        params.vod_id = id;
      } else if (type === 'series') {
        params.action = 'get_series_info';
        params.series_id = id;
      }

      const response = await axios.get(apiUrl, { params });
      const data = response.data;

      // Cache for 1 hour
      await cacheService.set(cacheKey, data, 3600);

      return data;
    } catch (error) {
      logger.error(`Get stream info error (${type}:${id}):`, error.message);
      return null;
    }
  }

  /**
   * Fetch stream content
   */
  async fetchStream(url) {
    try {
      const response = await axios.get(url, {
        responseType: 'stream',
        timeout: 30000
      });

      return response.data;
    } catch (error) {
      logger.error(`Fetch stream error (${url}):`, error.message);
      throw error;
    }
  }
}

export default new StarshareService();
