/**
 * French Live TV Service
 *
 * Fetches and parses FREE French TV channels from verified sources:
 * - iptv-org France playlist (100+ channels)
 * - IPTV-Scraper-Zilla combined playlist
 *
 * Created: December 6, 2025
 * Author: ZION SYNAPSE for DASH
 */

import logger from '../utils/logger.js';

class FrenchLiveTVService {
  constructor() {
    // Verified working sources (Dec 6, 2025)
    // Using languages/fra.m3u for global French-language channels (not geo-restricted)
    this.sources = {
      iptvOrgFrench: {
        name: 'IPTV-Org French Language',
        url: 'https://iptv-org.github.io/iptv/languages/fra.m3u',
        priority: 1
      },
      scraperZilla: {
        name: 'IPTV-Scraper-Zilla',
        url: 'https://raw.githubusercontent.com/abusaeeidx/IPTV-Scraper-Zilla/main/combined-playlist.m3u',
        priority: 2
      },
      ipstreet: {
        name: 'IPStreet312',
        url: 'https://raw.githubusercontent.com/ipstreet312/freeiptv/master/all.m3u',
        priority: 3
      }
    };

    // Domains that are geo-blocked (Swiss ISP streams, etc.)
    this.geoBlockedDomains = [
      'netplus.ch',      // Swiss ISP - geo-blocked
      'rts.ch',          // Swiss Radio TV - geo-blocked
      'srgssr.ch',       // Swiss Broadcasting - geo-blocked
      'wilmaa.com',      // Swiss streaming - geo-blocked
    ];

    // Domains with CORS issues (manifest loads but segments blocked)
    this.corsBlockedDomains = [
      'nextradiotv.com', // BFM channels - CORS blocks segments
      'bfmb.bct',        // BFM Business origin
    ];

    // Cache
    this.cache = new Map();
    this.cacheExpiry = 30 * 60 * 1000; // 30 minutes (playlists change)
  }

  /**
   * Parse M3U playlist into channel objects
   */
  parseM3U(content) {
    const channels = [];
    const lines = content.split('\n');

    let currentChannel = null;

    for (const line of lines) {
      const trimmed = line.trim();

      // Skip empty lines and comments (except EXTINF)
      if (!trimmed || (trimmed.startsWith('#') && !trimmed.startsWith('#EXTINF'))) {
        continue;
      }

      // Parse EXTINF line
      if (trimmed.startsWith('#EXTINF')) {
        currentChannel = this.parseExtInf(trimmed);
        continue;
      }

      // This should be the URL line
      if (currentChannel && (trimmed.startsWith('http') || trimmed.startsWith('//'))) {
        currentChannel.url = trimmed.startsWith('//') ? `https:${trimmed}` : trimmed;

        // Only add valid channels with URLs
        if (currentChannel.url && currentChannel.name) {
          channels.push(currentChannel);
        }
        currentChannel = null;
      }
    }

    return channels;
  }

  /**
   * Parse EXTINF line for metadata
   * Format: #EXTINF:-1 tvg-id="..." tvg-name="..." tvg-logo="..." group-title="...",Channel Name
   */
  parseExtInf(line) {
    const channel = {
      id: null,
      name: '',
      logo: null,
      group: 'Uncategorized',
      country: 'FR'
    };

    // Extract channel name (after the last comma)
    const nameMatch = line.match(/,([^,]+)$/);
    if (nameMatch) {
      channel.name = nameMatch[1].trim();
    }

    // Extract tvg-id
    const idMatch = line.match(/tvg-id="([^"]*)"/);
    if (idMatch) {
      channel.id = idMatch[1];
    }

    // Extract tvg-logo
    const logoMatch = line.match(/tvg-logo="([^"]*)"/);
    if (logoMatch && logoMatch[1]) {
      channel.logo = logoMatch[1];
    }

    // Extract group-title
    const groupMatch = line.match(/group-title="([^"]*)"/);
    if (groupMatch) {
      channel.group = groupMatch[1] || 'Uncategorized';
    }

    // Generate ID if not present
    if (!channel.id) {
      channel.id = `fr_${channel.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
    }

    return channel;
  }

  /**
   * Fetch French channels from iptv-org
   */
  async getFrenchChannels() {
    const cacheKey = 'french_channels';

    // Check cache
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.cacheExpiry) {
        logger.info(`[FrenchLiveTV] Returning ${cached.data.length} cached channels`);
        return cached.data;
      }
    }

    try {
      logger.info('[FrenchLiveTV] Fetching French channels from iptv-org (languages/fra.m3u)...');

      const response = await fetch(this.sources.iptvOrgFrench.url, {
        headers: {
          'User-Agent': 'DASH-WebTV/1.0'
        },
        timeout: 10000
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const content = await response.text();
      let channels = this.parseM3U(content);

      // Filter out problematic streams
      channels = channels.filter(ch => {
        if (!ch.url) return false;
        const urlLower = ch.url.toLowerCase();

        // Block geo-restricted domains
        if (this.geoBlockedDomains.some(domain => urlLower.includes(domain))) return false;

        // Block CORS-problematic domains
        if (this.corsBlockedDomains.some(domain => urlLower.includes(domain))) return false;

        // Block HTTP streams (mixed content blocked by browsers)
        if (urlLower.startsWith('http://')) return false;

        return true;
      });

      // Filter for quality - remove [Not 24/7] and [Geo-blocked] markers
      const qualityChannels = channels.filter(ch => {
        const name = ch.name.toLowerCase();
        return !name.includes('[not 24/7]') && !name.includes('[geo-blocked]');
      });

      // Use quality channels if we have enough, otherwise use all
      channels = qualityChannels.length >= 30 ? qualityChannels : channels;

      // Deduplicate by name
      const seen = new Set();
      channels = channels.filter(ch => {
        const key = ch.name.toLowerCase();
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });

      // Sort by group, then name
      channels.sort((a, b) => {
        if (a.group !== b.group) return a.group.localeCompare(b.group);
        return a.name.localeCompare(b.name);
      });

      // Add streaming format hints
      channels = channels.map(ch => ({
        ...ch,
        format: this.detectFormat(ch.url),
        source: 'iptv-org'
      }));

      logger.info(`[FrenchLiveTV] Loaded ${channels.length} French channels`);

      // Cache
      this.cache.set(cacheKey, {
        data: channels,
        timestamp: Date.now()
      });

      return channels;

    } catch (error) {
      logger.error(`[FrenchLiveTV] Failed to fetch channels: ${error.message}`);

      // Return cached data if available (even if expired)
      if (this.cache.has(cacheKey)) {
        return this.cache.get(cacheKey).data;
      }

      return [];
    }
  }

  /**
   * Get channels by category/group
   */
  async getChannelsByGroup(group) {
    const channels = await this.getFrenchChannels();

    if (!group || group === 'all') {
      return channels;
    }

    return channels.filter(ch =>
      ch.group.toLowerCase().includes(group.toLowerCase())
    );
  }

  /**
   * Get unique groups/categories
   */
  async getGroups() {
    const channels = await this.getFrenchChannels();
    const groups = [...new Set(channels.map(ch => ch.group))];
    return groups.sort();
  }

  /**
   * Search channels by name
   */
  async searchChannels(query) {
    const channels = await this.getFrenchChannels();
    const q = query.toLowerCase();

    return channels.filter(ch =>
      ch.name.toLowerCase().includes(q) ||
      ch.group.toLowerCase().includes(q)
    );
  }

  /**
   * Get a single channel by ID
   */
  async getChannel(id) {
    const channels = await this.getFrenchChannels();
    return channels.find(ch => ch.id === id);
  }

  /**
   * Detect stream format from URL
   */
  detectFormat(url) {
    if (!url) return 'unknown';
    const lower = url.toLowerCase();

    if (lower.includes('.m3u8') || lower.includes('/hls/')) return 'hls';
    if (lower.includes('.mpd') || lower.includes('/dash/')) return 'dash';
    if (lower.includes('.ts') || lower.includes(':8080') || lower.includes(':8000')) return 'ts';
    if (lower.includes('.mp4')) return 'mp4';

    // Default to HLS for most IPTV streams
    return 'hls';
  }

  /**
   * Get popular/featured French channels
   */
  async getFeaturedChannels() {
    const channels = await this.getFrenchChannels();

    // Priority channels (major French networks)
    const priorityNames = [
      'tf1', 'france 2', 'france 3', 'france 5', 'm6', 'arte',
      'canal+', 'bfm', 'cnews', 'lci', 'france 24', 'tv5monde',
      'nrj', 'w9', 'tmc', 'c8', 'cstar', 'gulli'
    ];

    const featured = [];
    const rest = [];

    for (const ch of channels) {
      const nameLower = ch.name.toLowerCase();
      const isPriority = priorityNames.some(p => nameLower.includes(p));

      if (isPriority && featured.length < 20) {
        featured.push(ch);
      } else {
        rest.push(ch);
      }
    }

    return { featured, rest };
  }

  /**
   * Health check for channel URL
   */
  async checkChannelHealth(channel) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(channel.url, {
        method: 'HEAD',
        signal: controller.signal,
        headers: {
          'User-Agent': 'DASH-WebTV/1.0'
        }
      });

      clearTimeout(timeout);

      return {
        ...channel,
        healthy: response.ok,
        status: response.status
      };
    } catch (error) {
      return {
        ...channel,
        healthy: false,
        error: error.message
      };
    }
  }
}

// Export singleton
const frenchLiveTVService = new FrenchLiveTVService();
export default frenchLiveTVService;
export { FrenchLiveTVService };
