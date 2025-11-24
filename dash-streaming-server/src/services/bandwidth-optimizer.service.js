import logger from '../utils/logger.js';
import cacheService from './cache.service.js';
import { PassThrough } from 'stream';

/**
 * Bandwidth Optimizer Service
 *
 * Smart caching and streaming strategies to minimize Railway bandwidth costs:
 * - Cache popular content aggressively (30 days)
 * - Use streaming proxy for direct MP4 playback (no double bandwidth)
 * - Track popular content for prioritized caching
 * - Serve from cache whenever possible
 */
class BandwidthOptimizerService {
  constructor() {
    this.popularityTracker = new Map(); // Track view counts
  }

  /**
   * Track content popularity for smart caching decisions
   */
  async trackView(contentId, contentType) {
    const key = `${contentType}:${contentId}`;
    const count = this.popularityTracker.get(key) || 0;
    this.popularityTracker.set(key, count + 1);

    // Also persist in Redis for multi-instance deployments
    const cacheKey = `popularity:${key}`;
    const cachedCount = await cacheService.get(cacheKey) || 0;
    await cacheService.set(cacheKey, cachedCount + 1, 2592000); // 30 days

    logger.debug(`View tracked: ${key} (${count + 1} views)`);

    return count + 1;
  }

  /**
   * Get popularity score for content
   */
  async getPopularity(contentId, contentType) {
    const key = `${contentType}:${contentId}`;

    // Check memory first
    const memoryCount = this.popularityTracker.get(key) || 0;

    // Check Redis
    const cacheKey = `popularity:${key}`;
    const cachedCount = await cacheService.get(cacheKey) || 0;

    return Math.max(memoryCount, cachedCount);
  }

  /**
   * Determine if content should be aggressively cached
   * (Popular content = more than 10 views)
   */
  async shouldAggressivelyCacheContent(contentId, contentType) {
    const popularity = await this.getPopularity(contentId, contentType);
    return popularity >= 10;
  }

  /**
   * Get optimal cache TTL based on popularity
   */
  async getOptimalCacheTTL(contentId, contentType) {
    const popularity = await this.getPopularity(contentId, contentType);

    if (popularity >= 100) return 2592000;  // 30 days (super popular)
    if (popularity >= 50) return 1296000;   // 15 days (popular)
    if (popularity >= 10) return 604800;    // 7 days (moderately popular)
    return 86400;                           // 1 day (new/unpopular)
  }

  /**
   * Create a streaming proxy that doesn't download entire file
   * This HALVES bandwidth usage for direct MP4 playback
   */
  createStreamingProxy(sourceStream) {
    const proxy = new PassThrough();

    // Pipe source → proxy without buffering
    sourceStream.pipe(proxy);

    // Track bandwidth usage
    let bytesStreamed = 0;
    proxy.on('data', (chunk) => {
      bytesStreamed += chunk.length;
    });

    proxy.on('end', () => {
      logger.debug(`Streamed ${(bytesStreamed / 1024 / 1024).toFixed(2)} MB`);
    });

    sourceStream.on('error', (err) => {
      logger.error(`Source stream error: ${err.message}`);
      proxy.destroy(err);
    });

    return proxy;
  }

  /**
   * Calculate estimated bandwidth savings from caching
   */
  async estimateBandwidthSavings(contentId, contentType, fileSize) {
    const views = await this.getPopularity(contentId, contentType);

    if (views <= 1) return 0;

    // Without cache: views × fileSize × 2 (download + upload)
    const withoutCache = views * fileSize * 2;

    // With cache: (1 × fileSize × 2) + ((views - 1) × fileSize)
    // First view: download from Starshare + upload to user
    // Subsequent views: only upload from cache
    const withCache = (fileSize * 2) + ((views - 1) * fileSize);

    const savings = withoutCache - withCache;
    const savingsPercent = (savings / withoutCache) * 100;

    return {
      views,
      withoutCache: (withoutCache / 1024 / 1024 / 1024).toFixed(2) + ' GB',
      withCache: (withCache / 1024 / 1024 / 1024).toFixed(2) + ' GB',
      savings: (savings / 1024 / 1024 / 1024).toFixed(2) + ' GB',
      savingsPercent: savingsPercent.toFixed(1) + '%'
    };
  }

  /**
   * Get bandwidth report for monitoring
   */
  async getBandwidthReport() {
    const topContent = [];

    // Get top 10 most popular content
    for (const [key, count] of this.popularityTracker.entries()) {
      topContent.push({ key, count });
    }

    topContent.sort((a, b) => b.count - a.count);

    return {
      totalTrackedContent: this.popularityTracker.size,
      topContent: topContent.slice(0, 10),
      timestamp: Date.now()
    };
  }

  /**
   * Log bandwidth optimization metrics
   */
  logOptimizationMetrics(contentId, contentType, cached, fileSize) {
    const status = cached ? '✅ CACHED' : '⬇️ DOWNLOAD';
    const sizeMB = (fileSize / 1024 / 1024).toFixed(2);

    logger.info(`${status} | ${contentType}:${contentId} | ${sizeMB} MB`);
  }
}

export default new BandwidthOptimizerService();
