import { createClient } from 'redis';
import config from '../config.js';
import logger from '../utils/logger.js';

class CacheService {
  constructor() {
    this.client = null;
    this.connected = false;
  }

  async connect() {
    // Skip Redis entirely if REDIS_URL is not set or is localhost in production
    const redisUrl = config.redis.url;
    if (!redisUrl || redisUrl === 'redis://localhost:6379') {
      logger.info('⚠️ Redis URL not configured - running without cache');
      this.connected = false;
      return;
    }

    try {
      this.client = createClient({
        url: redisUrl,
        socket: {
          connectTimeout: 5000,  // 5 second timeout
          reconnectStrategy: (retries) => {
            if (retries > 3) {
              logger.warn('Redis: Max reconnection attempts reached, running without cache');
              return false; // Stop reconnecting
            }
            return Math.min(retries * 100, 3000);
          }
        }
      });

      this.client.on('error', (err) => {
        logger.error('Redis Client Error', err.message);
        this.connected = false;
      });
      this.client.on('connect', () => logger.info('Redis Client Connected'));

      // Wrap connect in a timeout promise
      const connectPromise = this.client.connect();
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Redis connection timeout')), 5000)
      );

      await Promise.race([connectPromise, timeoutPromise]);
      this.connected = true;
      logger.info('✅ Redis cache connected');
    } catch (error) {
      logger.warn('⚠️ Redis connection failed, running without cache:', error.message);
      this.connected = false;
      // Don't throw - server continues without cache
    }
  }

  async get(key) {
    if (!this.connected) return null;

    try {
      const value = await this.client.get(key);
      if (value) {
        logger.debug(`Cache HIT: ${key}`);
        return JSON.parse(value);
      }
      logger.debug(`Cache MISS: ${key}`);
      return null;
    } catch (error) {
      logger.error('Cache get error:', error);
      return null;
    }
  }

  async set(key, value, ttl = config.cache.segmentTTL) {
    if (!this.connected) return false;

    try {
      await this.client.setEx(key, ttl, JSON.stringify(value));
      logger.debug(`Cache SET: ${key} (TTL: ${ttl}s)`);
      return true;
    } catch (error) {
      logger.error('Cache set error:', error);
      return false;
    }
  }

  async del(key) {
    if (!this.connected) return false;

    try {
      await this.client.del(key);
      logger.debug(`Cache DEL: ${key}`);
      return true;
    } catch (error) {
      logger.error('Cache del error:', error);
      return false;
    }
  }

  async exists(key) {
    if (!this.connected) return false;

    try {
      const result = await this.client.exists(key);
      return result === 1;
    } catch (error) {
      logger.error('Cache exists error:', error);
      return false;
    }
  }

  async disconnect() {
    if (this.client) {
      await this.client.quit();
      this.connected = false;
      logger.info('Redis disconnected');
    }
  }
}

export default new CacheService();
