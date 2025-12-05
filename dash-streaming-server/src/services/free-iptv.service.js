/**
 * FREE IPTV SERVICE - Legal Free Stream Aggregator
 *
 * Sources:
 * - iptv-org/iptv (community-maintained, 8000+ channels)
 * - FIFA+ (official free football streams)
 * - France24, DW, etc. (official broadcaster streams)
 *
 * LEGAL NOTICE:
 * All streams in this service are from:
 * 1. Official broadcaster free tiers
 * 2. Community-curated legal streams
 * 3. Public service broadcasters
 *
 * Created: December 2025
 * Author: ZION SYNAPSE for DASH
 */

import axios from 'axios';
import logger from '../utils/logger.js';
import cacheService from './cache.service.js';

class FreeIPTVService {
  constructor() {
    // iptv-org base URLs (GitHub Pages hosted)
    this.iptvOrgBase = 'https://iptv-org.github.io/iptv';

    // Regional focus for DASH audience
    this.priorityRegions = {
      guinea: 'gn',
      sierraLeone: 'sl',
      senegal: 'sn',
      ivoryCoast: 'ci',
      mali: 'ml',
      nigeria: 'ng',
      ghana: 'gh'
    };

    // Category priorities for our audience
    this.priorityCategories = [
      'sports',
      'news',
      'entertainment',
      'music',
      'movies',
      'kids'
    ];

    // Official free sports sources
    this.officialSports = {
      fifaPlus: {
        name: 'FIFA+',
        description: 'Official FIFA streaming - African leagues, World Cup, CAF',
        baseUrl: 'https://www.fifa.com/fifaplus',
        legal: true,
        note: 'Requires API integration or web scraping'
      },
      africaSport24: {
        name: 'Africa 24 Sport',
        url: 'https://africa24.vedge.infomaniak.com/livecast/ik:africa24sport/manifest.m3u8',
        legal: true,
        logo: 'https://i0.wp.com/africa24tv.com/wp-content/uploads/2023/12/LOGO-AFRICASPORT-4-HD-sans-fond.png'
      }
    };

    // Channel cache TTL (1 hour)
    this.cacheTTL = 3600;
  }

  /**
   * Parse M3U playlist into structured channel data
   */
  parseM3U(content) {
    const channels = [];
    const lines = content.split('\n');

    let currentChannel = null;

    for (const line of lines) {
      const trimmed = line.trim();

      if (trimmed.startsWith('#EXTINF:')) {
        // Parse channel info
        const match = trimmed.match(/#EXTINF:-?\d+\s*(.*)/);
        if (match) {
          const info = match[1];

          // Extract tvg-id
          const tvgIdMatch = info.match(/tvg-id="([^"]*)"/);
          // Extract logo
          const logoMatch = info.match(/tvg-logo="([^"]*)"/);
          // Extract group
          const groupMatch = info.match(/group-title="([^"]*)"/);
          // Extract name (after last comma)
          const nameMatch = info.match(/,([^,]+)$/);

          currentChannel = {
            id: tvgIdMatch ? tvgIdMatch[1] : null,
            name: nameMatch ? nameMatch[1].trim() : 'Unknown',
            logo: logoMatch ? logoMatch[1] : null,
            group: groupMatch ? groupMatch[1] : 'General',
            source: 'iptv-org',
            legal: true
          };
        }
      } else if (trimmed.startsWith('http') && currentChannel) {
        // This is the stream URL
        currentChannel.url = trimmed;
        currentChannel.type = trimmed.includes('.m3u8') ? 'hls' : 'mpegts';
        channels.push(currentChannel);
        currentChannel = null;
      }
    }

    return channels;
  }

  /**
   * Fetch channels by country code
   */
  async getChannelsByCountry(countryCode) {
    const cacheKey = `iptv:country:${countryCode}`;

    try {
      // Check cache first
      const cached = await cacheService.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }

      const url = `${this.iptvOrgBase}/countries/${countryCode.toLowerCase()}.m3u`;
      logger.info(`Fetching channels for country: ${countryCode}`);

      const response = await axios.get(url, { timeout: 15000 });
      const channels = this.parseM3U(response.data);

      // Cache for 1 hour
      await cacheService.set(cacheKey, JSON.stringify(channels), this.cacheTTL);

      logger.info(`Found ${channels.length} channels for ${countryCode}`);
      return channels;

    } catch (error) {
      if (error.response?.status === 404) {
        logger.warn(`No channels found for country: ${countryCode}`);
        return [];
      }
      logger.error(`Error fetching ${countryCode} channels:`, error.message);
      return [];
    }
  }

  /**
   * Fetch channels by category
   */
  async getChannelsByCategory(category) {
    const cacheKey = `iptv:category:${category}`;

    try {
      const cached = await cacheService.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }

      const url = `${this.iptvOrgBase}/categories/${category.toLowerCase()}.m3u`;
      logger.info(`Fetching channels for category: ${category}`);

      const response = await axios.get(url, { timeout: 30000 });
      const channels = this.parseM3U(response.data);

      // Cache for 1 hour
      await cacheService.set(cacheKey, JSON.stringify(channels), this.cacheTTL);

      logger.info(`Found ${channels.length} channels for ${category}`);
      return channels;

    } catch (error) {
      logger.error(`Error fetching ${category} channels:`, error.message);
      return [];
    }
  }

  /**
   * Fetch channels by language
   */
  async getChannelsByLanguage(langCode) {
    const cacheKey = `iptv:language:${langCode}`;

    try {
      const cached = await cacheService.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }

      const url = `${this.iptvOrgBase}/languages/${langCode.toLowerCase()}.m3u`;
      logger.info(`Fetching channels for language: ${langCode}`);

      const response = await axios.get(url, { timeout: 30000 });
      const channels = this.parseM3U(response.data);

      await cacheService.set(cacheKey, JSON.stringify(channels), this.cacheTTL);

      logger.info(`Found ${channels.length} ${langCode} channels`);
      return channels;

    } catch (error) {
      logger.error(`Error fetching ${langCode} channels:`, error.message);
      return [];
    }
  }

  /**
   * Get African sports channels (priority for DASH audience)
   */
  async getAfricanSports() {
    const cacheKey = 'iptv:african-sports';

    try {
      const cached = await cacheService.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }

      // Fetch all sports
      const allSports = await this.getChannelsByCategory('sports');

      // Filter for African-focused channels
      const africanKeywords = [
        'africa', 'africable', 'afro',
        'supersport', 'dstv',
        'canal', 'bein',
        'caf', 'afcon',
        'nigeria', 'ghana', 'senegal', 'guinea', 'ivory coast',
        'arab', 'alkass', 'abu dhabi'
      ];

      const africanSports = allSports.filter(channel => {
        const nameLower = channel.name.toLowerCase();
        const groupLower = (channel.group || '').toLowerCase();
        return africanKeywords.some(keyword =>
          nameLower.includes(keyword) || groupLower.includes(keyword)
        );
      });

      // Add our known good African sports
      const knownGood = [
        {
          id: 'africa24sport',
          name: 'Africa 24 Sport',
          url: 'https://africa24.vedge.infomaniak.com/livecast/ik:africa24sport/manifest.m3u8',
          logo: 'https://i0.wp.com/africa24tv.com/wp-content/uploads/2023/12/LOGO-AFRICASPORT-4-HD-sans-fond.png',
          group: 'Sports',
          type: 'hls',
          source: 'direct',
          legal: true,
          priority: true
        },
        {
          id: 'afrosport-ng',
          name: 'AfroSport Nigeria',
          url: 'https://newproxy3.vidivu.tv/vidivu_afrosport/index.m3u8',
          logo: 'https://pbs.twimg.com/profile_images/1451668129042599936/Uh-Z6Sh1_400x400.jpg',
          group: 'Sports',
          type: 'hls',
          source: 'iptv-org',
          legal: true,
          priority: true
        }
      ];

      const combined = [...knownGood, ...africanSports];
      await cacheService.set(cacheKey, JSON.stringify(combined), this.cacheTTL);

      logger.info(`Found ${combined.length} African sports channels`);
      return combined;

    } catch (error) {
      logger.error('Error fetching African sports:', error.message);
      return [];
    }
  }

  /**
   * Get West African channels (Guinea, Sierra Leone, Senegal, etc.)
   */
  async getWestAfricanChannels() {
    const cacheKey = 'iptv:west-africa';

    try {
      const cached = await cacheService.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }

      const countries = ['gn', 'sn', 'ci', 'ml', 'ng', 'gh', 'bf', 'tg', 'bj'];
      const allChannels = [];

      for (const country of countries) {
        const channels = await this.getChannelsByCountry(country);
        allChannels.push(...channels);
      }

      await cacheService.set(cacheKey, JSON.stringify(allChannels), this.cacheTTL);

      logger.info(`Found ${allChannels.length} West African channels`);
      return allChannels;

    } catch (error) {
      logger.error('Error fetching West African channels:', error.message);
      return [];
    }
  }

  /**
   * Get French language channels
   */
  async getFrenchChannels() {
    return this.getChannelsByLanguage('fra');
  }

  /**
   * Get all priority channels for DASH audience
   * Combines: West Africa + French + Sports
   */
  async getDashPriorityChannels() {
    const cacheKey = 'iptv:dash-priority';

    try {
      const cached = await cacheService.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }

      logger.info('Building DASH priority channel list...');

      // Fetch all sources in parallel
      const [westAfrica, french, sports, guinea] = await Promise.all([
        this.getWestAfricanChannels(),
        this.getFrenchChannels(),
        this.getAfricanSports(),
        this.getChannelsByCountry('gn')
      ]);

      // Deduplicate by URL
      const seen = new Set();
      const combined = [];

      // Priority order: Guinea first, then sports, then French, then rest of West Africa
      const ordered = [...guinea, ...sports, ...french, ...westAfrica];

      for (const channel of ordered) {
        if (!seen.has(channel.url)) {
          seen.add(channel.url);
          combined.push(channel);
        }
      }

      // Cache for 1 hour
      await cacheService.set(cacheKey, JSON.stringify(combined), this.cacheTTL);

      logger.info(`Built DASH priority list: ${combined.length} channels`);
      return combined;

    } catch (error) {
      logger.error('Error building DASH priority list:', error.message);
      return [];
    }
  }

  /**
   * Test if a stream URL is working
   */
  async testStream(url) {
    try {
      const response = await axios.head(url, {
        timeout: 5000,
        headers: {
          'User-Agent': 'DASH-WebTV/2.0'
        }
      });
      return response.status === 200;
    } catch {
      return false;
    }
  }

  /**
   * Get stream with working status check
   */
  async getWorkingStreams(channels, limit = 50) {
    const results = [];

    for (const channel of channels.slice(0, limit)) {
      const working = await this.testStream(channel.url);
      if (working) {
        results.push({
          ...channel,
          status: 'working',
          testedAt: new Date().toISOString()
        });
      }
    }

    return results;
  }
}

// Singleton export
const freeIPTVService = new FreeIPTVService();
export default freeIPTVService;
