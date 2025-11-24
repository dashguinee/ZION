import { createClient } from 'redis';
import config from '../config.js';
import logger from '../utils/logger.js';

class CacheService {
  constructor() {
    this.client = null;
    this.connected = false;
  }

  async connect() {
    try {
      this.client = createClient({
        url: config.redis.url
      });

      this.client.on('error', (err) => logger.error('Redis Client Error', err));
      this.client.on('connect', () => logger.info('Redis Client Connected'));

      await this.client.connect();
      this.connected = true;
      logger.info('✅ Redis cache connected');
    } catch (error) {
      logger.error('❌ Redis connection failed:', error);
      this.connected = false;
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
