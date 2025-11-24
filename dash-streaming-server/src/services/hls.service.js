import fs from 'fs/promises';
import path from 'path';
import logger from '../utils/logger.js';
import cacheService from './cache.service.js';

class HLSService {
  constructor() {
    this.baseDir = '/tmp/hls';
  }

  /**
   * Initialize HLS storage directory
   */
  async init() {
    try {
      await fs.mkdir(this.baseDir, { recursive: true });
      logger.info('HLS storage initialized');
    } catch (error) {
      logger.error('HLS init error:', error);
    }
  }

  /**
   * Get master playlist for a stream
   */
  async getMasterPlaylist(streamId) {
    const playlistPath = path.join(this.baseDir, streamId, 'master.m3u8');

    try {
      const content = await fs.readFile(playlistPath, 'utf-8');
      return content;
    } catch (error) {
      logger.error(`Master playlist not found: ${streamId}`);
      throw new Error('Playlist not found');
    }
  }

  /**
   * Get variant playlist (specific quality level)
   */
  async getVariantPlaylist(streamId, variant) {
    const playlistPath = path.join(this.baseDir, streamId, `playlist_${variant}.m3u8`);

    try {
      const content = await fs.readFile(playlistPath, 'utf-8');
      return content;
    } catch (error) {
      logger.error(`Variant playlist not found: ${streamId}/${variant}`);
      throw new Error('Variant playlist not found');
    }
  }

  /**
   * Get HLS segment file
   */
  async getSegment(streamId, segmentName) {
    const cacheKey = `segment:${streamId}:${segmentName}`;

    // Check cache first
    const cached = await cacheService.get(cacheKey);
    if (cached) {
      logger.debug(`Segment cache HIT: ${segmentName}`);
      return Buffer.from(cached, 'base64');
    }

    const segmentPath = path.join(this.baseDir, streamId, segmentName);

    try {
      const data = await fs.readFile(segmentPath);

      // Cache segment for 24 hours (in base64 for Redis)
      await cacheService.set(cacheKey, data.toString('base64'), 86400);

      return data;
    } catch (error) {
      logger.error(`Segment not found: ${streamId}/${segmentName}`);
      throw new Error('Segment not found');
    }
  }

  /**
   * Generate simple HLS master playlist manually
   * (Alternative to FFmpeg's multi-variant)
   */
  generateMasterPlaylist(qualities = ['1080p', '720p', '480p', '360p']) {
    const bandwidths = {
      '1080p': 4000000,
      '720p': 2500000,
      '480p': 1000000,
      '360p': 600000
    };

    const resolutions = {
      '1080p': '1920x1080',
      '720p': '1280x720',
      '480p': '854x480',
      '360p': '640x360'
    };

    let playlist = '#EXTM3U\n#EXT-X-VERSION:3\n\n';

    qualities.forEach(quality => {
      playlist += `#EXT-X-STREAM-INF:BANDWIDTH=${bandwidths[quality]},RESOLUTION=${resolutions[quality]}\n`;
      playlist += `${quality}.m3u8\n\n`;
    });

    return playlist;
  }

  /**
   * Clean up old HLS files (for disk space management)
   */
  async cleanupOldStreams(maxAgeHours = 24) {
    try {
      const now = Date.now();
      const maxAge = maxAgeHours * 60 * 60 * 1000;

      const streams = await fs.readdir(this.baseDir);

      for (const streamId of streams) {
        const streamPath = path.join(this.baseDir, streamId);
        const stats = await fs.stat(streamPath);

        if (now - stats.mtimeMs > maxAge) {
          await fs.rm(streamPath, { recursive: true, force: true });
          logger.info(`Cleaned up old stream: ${streamId}`);
        }
      }
    } catch (error) {
      logger.error('Cleanup error:', error);
    }
  }
}

export default new HLSService();
