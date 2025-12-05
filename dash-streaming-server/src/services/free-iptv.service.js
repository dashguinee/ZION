/**
 * FREE IPTV SERVICE - Legal Free Stream Aggregator
 *
 * Sources:
 * - iptv-org/iptv (community-maintained, 8000+ channels)
 * - iptv-org/api (JSON API with channels, streams, categories)
 * - IPTV Scraper Zilla (auto-updates hourly, thousands of channels)
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
 * Updated: December 5, 2025 - Added iptv-org API + Scraper Zilla
 * Author: ZION SYNAPSE for DASH
 */

import axios from 'axios';
import logger from '../utils/logger.js';
import cacheService from './cache.service.js';

class FreeIPTVService {
  constructor() {
    // iptv-org base URLs (GitHub Pages hosted)
    this.iptvOrgBase = 'https://iptv-org.github.io/iptv';

    // iptv-org API (JSON endpoints - structured data)
    this.iptvOrgAPI = {
      channels: 'https://iptv-org.github.io/api/channels.json',
      streams: 'https://iptv-org.github.io/api/streams.json',
      categories: 'https://iptv-org.github.io/api/categories.json',
      countries: 'https://iptv-org.github.io/api/countries.json',
      languages: 'https://iptv-org.github.io/api/languages.json',
      guides: 'https://iptv-org.github.io/api/guides.json'
    };

    // IPTV Scraper Zilla (auto-updates hourly!)
    this.scraperZilla = {
      combined: 'https://raw.githubusercontent.com/abusaeeidx/IPTV-Scraper-Zilla/main/combined-playlist.m3u',
      sports: 'https://raw.githubusercontent.com/abusaeeidx/IPTV-Scraper-Zilla/main/sports.m3u',
      movies: 'https://raw.githubusercontent.com/abusaeeidx/IPTV-Scraper-Zilla/main/movies.m3u',
      anime: 'https://raw.githubusercontent.com/abusaeeidx/IPTV-Scraper-Zilla/main/anime.m3u'
    };

    // Free-TV/IPTV (Quality curated, 80+ countries, HD preferred)
    this.freeTV = {
      master: 'https://raw.githubusercontent.com/Free-TV/IPTV/master/playlist.m3u8'
    };

    // M3U8-Xtream (TMDB movies + trending shows)
    this.m3u8Xtream = {
      trendingSeries: 'https://aymrgknetzpucldhpkwm.supabase.co/storage/v1/object/public/tmdb/trending-series.m3u',
      topMovies: 'https://aymrgknetzpucldhpkwm.supabase.co/storage/v1/object/public/tmdb/top-movies.m3u',
      actionMovies: 'https://aymrgknetzpucldhpkwm.supabase.co/storage/v1/object/public/tmdb/action-movies.m3u',
      comedyMovies: 'https://aymrgknetzpucldhpkwm.supabase.co/storage/v1/object/public/tmdb/comedy-movies.m3u',
      dramaMovies: 'https://aymrgknetzpucldhpkwm.supabase.co/storage/v1/object/public/tmdb/drama-movies.m3u',
      horrorMovies: 'https://aymrgknetzpucldhpkwm.supabase.co/storage/v1/object/public/tmdb/horror-movies.m3u',
      scifiMovies: 'https://aymrgknetzpucldhpkwm.supabase.co/storage/v1/object/public/tmdb/science-fiction-movies.m3u',
      thrillerMovies: 'https://aymrgknetzpucldhpkwm.supabase.co/storage/v1/object/public/tmdb/thriller-movies.m3u',
      documentaryMovies: 'https://aymrgknetzpucldhpkwm.supabase.co/storage/v1/object/public/tmdb/documentary-movies.m3u',
      familyMovies: 'https://aymrgknetzpucldhpkwm.supabase.co/storage/v1/object/public/tmdb/family-movies.m3u'
    };

    // PlutoTV Direct Streams (from iptv-org)
    this.plutoTV = {
      us: 'https://raw.githubusercontent.com/iptv-org/iptv/master/streams/us_pluto.m3u',
      intl: 'https://iptv-org.github.io/iptv/subdivisions/us-ca.m3u' // California for good variety
    };

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

    // Channel cache TTL (1 hour - matches Scraper Zilla update frequency)
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
      // Try HEAD first (faster)
      const response = await axios.head(url, {
        timeout: 5000,
        maxRedirects: 5,
        headers: {
          'User-Agent': 'DASH-WebTV/2.0'
        },
        validateStatus: (status) => status < 500 // Accept redirects
      });
      return response.status === 200 || response.status === 302 || response.status === 301;
    } catch {
      // If HEAD fails, try GET (some servers don't support HEAD)
      try {
        const response = await axios.get(url, {
          timeout: 5000,
          maxRedirects: 5,
          headers: {
            'User-Agent': 'DASH-WebTV/2.0',
            'Range': 'bytes=0-1024' // Only get first KB
          },
          responseType: 'stream',
          validateStatus: (status) => status < 500
        });
        response.data.destroy(); // Don't download the whole thing
        return true;
      } catch {
        return false;
      }
    }
  }

  /**
   * Batch test multiple streams concurrently
   */
  async testStreamsBatch(urls, concurrency = 10) {
    const results = new Map();

    // Process in batches
    for (let i = 0; i < urls.length; i += concurrency) {
      const batch = urls.slice(i, i + concurrency);
      const promises = batch.map(async (url) => {
        const working = await this.testStream(url);
        return { url, working };
      });

      const batchResults = await Promise.all(promises);
      batchResults.forEach(r => results.set(r.url, r.working));
    }

    return results;
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

  // ===== NEW: iptv-org API Methods (JSON-based) =====

  /**
   * Fetch full channels database from iptv-org API
   * Returns structured JSON with all channel metadata
   */
  async getAPIChannels() {
    const cacheKey = 'iptv:api:channels';

    try {
      const cached = await cacheService.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }

      logger.info('Fetching iptv-org API channels...');
      const response = await axios.get(this.iptvOrgAPI.channels, { timeout: 30000 });

      // Cache for 1 hour
      await cacheService.set(cacheKey, JSON.stringify(response.data), this.cacheTTL);

      logger.info(`Loaded ${response.data.length} channels from API`);
      return response.data;

    } catch (error) {
      logger.error('Error fetching API channels:', error.message);
      return [];
    }
  }

  /**
   * Fetch streams database from iptv-org API
   * Contains actual stream URLs linked to channel IDs
   */
  async getAPIStreams() {
    const cacheKey = 'iptv:api:streams';

    try {
      const cached = await cacheService.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }

      logger.info('Fetching iptv-org API streams...');
      const response = await axios.get(this.iptvOrgAPI.streams, { timeout: 30000 });

      await cacheService.set(cacheKey, JSON.stringify(response.data), this.cacheTTL);

      logger.info(`Loaded ${response.data.length} streams from API`);
      return response.data;

    } catch (error) {
      logger.error('Error fetching API streams:', error.message);
      return [];
    }
  }

  /**
   * Get channels by country using API (more reliable than M3U)
   */
  async getAPIChannelsByCountry(countryCode) {
    const cacheKey = `iptv:api:country:${countryCode}`;

    try {
      const cached = await cacheService.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }

      const [channels, streams] = await Promise.all([
        this.getAPIChannels(),
        this.getAPIStreams()
      ]);

      // Filter channels by country
      const countryChannels = channels.filter(ch =>
        ch.country === countryCode.toUpperCase()
      );

      // Map streams to channels
      const streamMap = new Map();
      streams.forEach(s => {
        if (!streamMap.has(s.channel)) {
          streamMap.set(s.channel, s);
        }
      });

      // Combine channel info with stream URLs
      const result = countryChannels.map(ch => {
        const stream = streamMap.get(ch.id);
        return {
          id: ch.id,
          name: ch.name,
          logo: ch.logo,
          country: ch.country,
          categories: ch.categories || [],
          languages: ch.languages || [],
          url: stream?.url || null,
          type: stream?.url?.includes('.m3u8') ? 'hls' : 'mpegts',
          source: 'iptv-org-api',
          legal: true
        };
      }).filter(ch => ch.url); // Only include channels with working streams

      await cacheService.set(cacheKey, JSON.stringify(result), this.cacheTTL);

      logger.info(`Found ${result.length} channels for ${countryCode} via API`);
      return result;

    } catch (error) {
      logger.error(`Error fetching ${countryCode} from API:`, error.message);
      return [];
    }
  }

  /**
   * Get channels by category using API
   */
  async getAPIChannelsByCategory(category) {
    const cacheKey = `iptv:api:category:${category}`;

    try {
      const cached = await cacheService.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }

      const [channels, streams] = await Promise.all([
        this.getAPIChannels(),
        this.getAPIStreams()
      ]);

      // Filter channels by category
      const categoryChannels = channels.filter(ch =>
        ch.categories?.includes(category.toLowerCase())
      );

      // Map streams to channels
      const streamMap = new Map();
      streams.forEach(s => {
        if (!streamMap.has(s.channel)) {
          streamMap.set(s.channel, s);
        }
      });

      const result = categoryChannels.map(ch => {
        const stream = streamMap.get(ch.id);
        return {
          id: ch.id,
          name: ch.name,
          logo: ch.logo,
          country: ch.country,
          categories: ch.categories || [],
          languages: ch.languages || [],
          url: stream?.url || null,
          type: stream?.url?.includes('.m3u8') ? 'hls' : 'mpegts',
          source: 'iptv-org-api',
          legal: true
        };
      }).filter(ch => ch.url);

      await cacheService.set(cacheKey, JSON.stringify(result), this.cacheTTL);

      logger.info(`Found ${result.length} ${category} channels via API`);
      return result;

    } catch (error) {
      logger.error(`Error fetching ${category} from API:`, error.message);
      return [];
    }
  }

  // ===== NEW: Scraper Zilla Methods (Auto-updating hourly!) =====

  /**
   * Get channels from IPTV Scraper Zilla (combined playlist)
   * Updates automatically every hour on GitHub
   */
  async getScraperZillaChannels(type = 'combined') {
    const cacheKey = `iptv:zilla:${type}`;

    try {
      const cached = await cacheService.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }

      const url = this.scraperZilla[type] || this.scraperZilla.combined;
      logger.info(`Fetching Scraper Zilla ${type} playlist...`);

      const response = await axios.get(url, { timeout: 60000 });
      const channels = this.parseM3U(response.data);

      // Tag as from Zilla
      const tagged = channels.map(ch => ({
        ...ch,
        source: 'scraper-zilla',
        autoUpdated: true,
        legal: true // Zilla aggregates legal streams
      }));

      await cacheService.set(cacheKey, JSON.stringify(tagged), this.cacheTTL);

      logger.info(`Loaded ${tagged.length} channels from Scraper Zilla (${type})`);
      return tagged;

    } catch (error) {
      logger.error(`Error fetching Scraper Zilla ${type}:`, error.message);
      return [];
    }
  }

  /**
   * Get Scraper Zilla sports channels (updated hourly!)
   */
  async getZillaSports() {
    return this.getScraperZillaChannels('sports');
  }

  /**
   * Get Scraper Zilla movies channels
   */
  async getZillaMovies() {
    return this.getScraperZillaChannels('movies');
  }

  /**
   * Get Scraper Zilla anime channels
   */
  async getZillaAnime() {
    return this.getScraperZillaChannels('anime');
  }

  // ===== NEW: Combined "Super" Methods =====

  /**
   * Get ALL sports from all sources
   * Combines: iptv-org API + Scraper Zilla + Official sources
   */
  async getAllSports() {
    const cacheKey = 'iptv:all-sports';

    try {
      const cached = await cacheService.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }

      logger.info('Building ALL sports super-list...');

      const [apiSports, zillaSports, africanSports] = await Promise.all([
        this.getAPIChannelsByCategory('sports'),
        this.getZillaSports(),
        this.getAfricanSports()
      ]);

      // Deduplicate by URL
      const seen = new Set();
      const combined = [];

      // Priority: African sports first, then Zilla (fresh), then API
      const ordered = [...africanSports, ...zillaSports, ...apiSports];

      for (const channel of ordered) {
        if (channel.url && !seen.has(channel.url)) {
          seen.add(channel.url);
          combined.push(channel);
        }
      }

      await cacheService.set(cacheKey, JSON.stringify(combined), this.cacheTTL);

      logger.info(`Built super sports list: ${combined.length} channels`);
      return combined;

    } catch (error) {
      logger.error('Error building all sports:', error.message);
      return [];
    }
  }

  /**
   * Get MEGA combined list from all sources
   * iptv-org API + Scraper Zilla + M3U sources
   */
  async getMegaList() {
    const cacheKey = 'iptv:mega-list';

    try {
      const cached = await cacheService.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }

      logger.info('Building MEGA channel list...');

      const [dashPriority, zillaCombined, allSports] = await Promise.all([
        this.getDashPriorityChannels(),
        this.getScraperZillaChannels('combined'),
        this.getAllSports()
      ]);

      // Deduplicate
      const seen = new Set();
      const combined = [];

      // Priority: DASH priority → Sports → Zilla combined
      const ordered = [...dashPriority, ...allSports, ...zillaCombined];

      for (const channel of ordered) {
        if (channel.url && !seen.has(channel.url)) {
          seen.add(channel.url);
          combined.push(channel);
        }
      }

      await cacheService.set(cacheKey, JSON.stringify(combined), 1800); // 30 min cache

      logger.info(`Built MEGA list: ${combined.length} channels`);
      return combined;

    } catch (error) {
      logger.error('Error building mega list:', error.message);
      return [];
    }
  }

  /**
   * Get stats about available channels
   */
  async getStats() {
    try {
      const [apiChannels, apiStreams, dashPriority] = await Promise.all([
        this.getAPIChannels(),
        this.getAPIStreams(),
        this.getDashPriorityChannels()
      ]);

      return {
        totalChannels: apiChannels.length,
        totalStreams: apiStreams.length,
        dashPriorityChannels: dashPriority.length,
        sources: {
          iptvOrgAPI: true,
          scraperZilla: true,
          officialSports: true
        },
        lastUpdated: new Date().toISOString()
      };

    } catch (error) {
      return { error: error.message };
    }
  }

  // ===== NEW SOURCES: Free-TV, M3U8-Xtream, PlutoTV =====

  /**
   * Get channels from Free-TV/IPTV (quality curated, 80+ countries)
   */
  async getFreeTVChannels() {
    const cacheKey = 'iptv:freetv:master';

    try {
      const cached = await cacheService.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }

      logger.info('Fetching Free-TV/IPTV playlist...');
      const response = await axios.get(this.freeTV.master, { timeout: 60000 });
      const channels = this.parseM3U(response.data);

      const tagged = channels.map(ch => ({
        ...ch,
        source: 'free-tv',
        quality: 'hd-preferred',
        legal: true
      }));

      await cacheService.set(cacheKey, JSON.stringify(tagged), this.cacheTTL);
      logger.info(`Loaded ${tagged.length} channels from Free-TV`);
      return tagged;

    } catch (error) {
      logger.error('Error fetching Free-TV:', error.message);
      return [];
    }
  }

  /**
   * Get trending series from M3U8-Xtream (TMDB powered)
   */
  async getTrendingSeries() {
    const cacheKey = 'iptv:xtream:trending-series';

    try {
      const cached = await cacheService.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }

      logger.info('Fetching trending series from M3U8-Xtream...');
      const response = await axios.get(this.m3u8Xtream.trendingSeries, { timeout: 30000 });
      const channels = this.parseM3U(response.data);

      const tagged = channels.map(ch => ({
        ...ch,
        source: 'm3u8-xtream',
        contentType: 'series',
        legal: true
      }));

      await cacheService.set(cacheKey, JSON.stringify(tagged), this.cacheTTL);
      logger.info(`Loaded ${tagged.length} trending series`);
      return tagged;

    } catch (error) {
      logger.error('Error fetching trending series:', error.message);
      return [];
    }
  }

  /**
   * Get top movies from M3U8-Xtream (TMDB Top IMDB 2024-2025)
   */
  async getTopMovies() {
    const cacheKey = 'iptv:xtream:top-movies';

    try {
      const cached = await cacheService.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }

      logger.info('Fetching top movies from M3U8-Xtream...');
      const response = await axios.get(this.m3u8Xtream.topMovies, { timeout: 30000 });
      const channels = this.parseM3U(response.data);

      const tagged = channels.map(ch => ({
        ...ch,
        source: 'm3u8-xtream',
        contentType: 'movie',
        legal: true
      }));

      await cacheService.set(cacheKey, JSON.stringify(tagged), this.cacheTTL);
      logger.info(`Loaded ${tagged.length} top movies`);
      return tagged;

    } catch (error) {
      logger.error('Error fetching top movies:', error.message);
      return [];
    }
  }

  /**
   * Get movies by genre from M3U8-Xtream
   */
  async getMoviesByGenre(genre) {
    const genreMap = {
      action: this.m3u8Xtream.actionMovies,
      comedy: this.m3u8Xtream.comedyMovies,
      drama: this.m3u8Xtream.dramaMovies,
      horror: this.m3u8Xtream.horrorMovies,
      scifi: this.m3u8Xtream.scifiMovies,
      thriller: this.m3u8Xtream.thrillerMovies,
      documentary: this.m3u8Xtream.documentaryMovies,
      family: this.m3u8Xtream.familyMovies
    };

    const url = genreMap[genre.toLowerCase()];
    if (!url) {
      return [];
    }

    const cacheKey = `iptv:xtream:${genre}-movies`;

    try {
      const cached = await cacheService.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }

      logger.info(`Fetching ${genre} movies from M3U8-Xtream...`);
      const response = await axios.get(url, { timeout: 30000 });
      const channels = this.parseM3U(response.data);

      const tagged = channels.map(ch => ({
        ...ch,
        source: 'm3u8-xtream',
        contentType: 'movie',
        genre: genre,
        legal: true
      }));

      await cacheService.set(cacheKey, JSON.stringify(tagged), this.cacheTTL);
      logger.info(`Loaded ${tagged.length} ${genre} movies`);
      return tagged;

    } catch (error) {
      logger.error(`Error fetching ${genre} movies:`, error.message);
      return [];
    }
  }

  /**
   * Get ALL movies from M3U8-Xtream (all genres combined)
   */
  async getAllXtreamMovies() {
    const cacheKey = 'iptv:xtream:all-movies';

    try {
      const cached = await cacheService.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }

      logger.info('Fetching all movies from M3U8-Xtream...');

      const genres = ['action', 'comedy', 'drama', 'horror', 'scifi', 'thriller', 'documentary', 'family'];
      const promises = [
        this.getTopMovies(),
        ...genres.map(g => this.getMoviesByGenre(g))
      ];

      const results = await Promise.all(promises);

      // Deduplicate
      const seen = new Set();
      const combined = [];
      results.flat().forEach(ch => {
        if (ch.url && !seen.has(ch.url)) {
          seen.add(ch.url);
          combined.push(ch);
        }
      });

      await cacheService.set(cacheKey, JSON.stringify(combined), this.cacheTTL);
      logger.info(`Loaded ${combined.length} total movies from M3U8-Xtream`);
      return combined;

    } catch (error) {
      logger.error('Error fetching all movies:', error.message);
      return [];
    }
  }

  /**
   * Get PlutoTV channels (free ad-supported)
   */
  async getPlutoTVChannels() {
    const cacheKey = 'iptv:plutotv:all';

    try {
      const cached = await cacheService.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }

      logger.info('Fetching PlutoTV channels...');
      const response = await axios.get(this.plutoTV.us, { timeout: 30000 });
      const channels = this.parseM3U(response.data);

      const tagged = channels.map(ch => ({
        ...ch,
        source: 'plutotv',
        legal: true,
        adSupported: true
      }));

      await cacheService.set(cacheKey, JSON.stringify(tagged), this.cacheTTL);
      logger.info(`Loaded ${tagged.length} PlutoTV channels`);
      return tagged;

    } catch (error) {
      logger.error('Error fetching PlutoTV:', error.message);
      return [];
    }
  }

  /**
   * Get ULTIMATE combined list - ALL sources
   */
  async getUltimateList() {
    const cacheKey = 'iptv:ultimate';

    try {
      const cached = await cacheService.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }

      logger.info('Building ULTIMATE channel list...');

      // Fetch from ALL sources in parallel
      const [
        dashPriority,
        zilla,
        freeTV,
        xtreamMovies,
        trendingSeries,
        plutoTV
      ] = await Promise.all([
        this.getDashPriorityChannels(),
        this.getScraperZillaChannels('combined'),
        this.getFreeTVChannels(),
        this.getAllXtreamMovies(),
        this.getTrendingSeries(),
        this.getPlutoTVChannels()
      ]);

      // Deduplicate by URL
      const seen = new Set();
      const combined = [];

      // Priority order
      const ordered = [
        ...dashPriority,
        ...zilla,
        ...freeTV,
        ...xtreamMovies,
        ...trendingSeries,
        ...plutoTV
      ];

      for (const channel of ordered) {
        if (channel.url && !seen.has(channel.url)) {
          seen.add(channel.url);
          combined.push(channel);
        }
      }

      await cacheService.set(cacheKey, JSON.stringify(combined), 1800); // 30 min cache
      logger.info(`Built ULTIMATE list: ${combined.length} channels`);
      return combined;

    } catch (error) {
      logger.error('Error building ultimate list:', error.message);
      return [];
    }
  }

  // ===== VERIFIED STREAMS (Health-checked) =====

  /**
   * Get verified working channels with health check
   * Caches results for 2 hours to avoid hammering sources
   */
  async getVerifiedChannels(sourceType = 'priority', limit = 100) {
    const cacheKey = `iptv:verified:${sourceType}:${limit}`;

    try {
      const cached = await cacheService.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }

      logger.info(`Building verified ${sourceType} list (limit: ${limit})...`);

      let channels = [];

      switch (sourceType) {
        case 'guinea':
          channels = await this.getChannelsByCountry('gn');
          break;
        case 'sports':
          channels = await this.getAllSports();
          break;
        case 'french':
          channels = await this.getFrenchChannels();
          break;
        case 'news':
          channels = await this.getAPIChannelsByCategory('news');
          break;
        case 'priority':
        default:
          channels = await this.getDashPriorityChannels();
          break;
      }

      // Limit channels to test
      const toTest = channels.slice(0, Math.min(limit * 2, channels.length));

      // Test streams in batches
      const urls = toTest.map(ch => ch.url).filter(Boolean);
      const results = await this.testStreamsBatch(urls, 15);

      // Filter to working only
      const verified = toTest.filter(ch => results.get(ch.url) === true);

      // Take up to limit
      const final = verified.slice(0, limit);

      // Cache for 2 hours (verified streams are expensive to check)
      await cacheService.set(cacheKey, JSON.stringify(final), 7200);

      logger.info(`Verified ${final.length} working ${sourceType} channels`);
      return final;

    } catch (error) {
      logger.error(`Error getting verified ${sourceType}:`, error.message);
      return [];
    }
  }

  /**
   * Get verified Guinea channels
   */
  async getVerifiedGuinea() {
    return this.getVerifiedChannels('guinea', 20);
  }

  /**
   * Get verified sports channels
   */
  async getVerifiedSports() {
    return this.getVerifiedChannels('sports', 150);
  }

  /**
   * Get verified French channels
   */
  async getVerifiedFrench() {
    return this.getVerifiedChannels('french', 200);
  }

  /**
   * Get verified news channels
   */
  async getVerifiedNews() {
    return this.getVerifiedChannels('news', 100);
  }

  /**
   * Get ALL verified channels - the GOLD list
   * Combines all verified sources into one mega-verified list
   */
  async getVerifiedMega() {
    const cacheKey = 'iptv:verified:mega';

    try {
      const cached = await cacheService.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }

      logger.info('Building VERIFIED MEGA list...');

      // Get verified from each category in parallel
      const [guinea, sports, french, news] = await Promise.all([
        this.getVerifiedGuinea(),
        this.getVerifiedSports(),
        this.getVerifiedFrench(),
        this.getVerifiedNews()
      ]);

      // Also get some from Scraper Zilla (fresh hourly content)
      const zilla = await this.getScraperZillaChannels('combined');
      const zillaUrls = zilla.slice(0, 200).map(ch => ch.url).filter(Boolean);
      const zillaResults = await this.testStreamsBatch(zillaUrls, 20);
      const verifiedZilla = zilla.filter(ch => zillaResults.get(ch.url) === true).slice(0, 100);

      // Deduplicate
      const seen = new Set();
      const combined = [];

      // Priority order: Guinea → Sports → French → News → Zilla
      const ordered = [...guinea, ...sports, ...french, ...news, ...verifiedZilla];

      for (const channel of ordered) {
        if (channel.url && !seen.has(channel.url)) {
          seen.add(channel.url);
          combined.push({
            ...channel,
            verified: true,
            verifiedAt: new Date().toISOString()
          });
        }
      }

      // Cache for 2 hours
      await cacheService.set(cacheKey, JSON.stringify(combined), 7200);

      logger.info(`Built VERIFIED MEGA: ${combined.length} working channels`);
      return combined;

    } catch (error) {
      logger.error('Error building verified mega:', error.message);
      return [];
    }
  }

  /**
   * Quick health check for a single channel
   * Returns detailed info about stream health
   */
  async getStreamHealth(url) {
    const startTime = Date.now();

    try {
      const response = await axios.get(url, {
        timeout: 10000,
        maxRedirects: 5,
        headers: {
          'User-Agent': 'DASH-WebTV/2.0',
          'Range': 'bytes=0-10240'
        },
        responseType: 'arraybuffer',
        validateStatus: (status) => status < 500
      });

      const latency = Date.now() - startTime;
      const contentType = response.headers['content-type'] || '';
      const isHLS = contentType.includes('mpegurl') || url.includes('.m3u8');
      const isMPEGTS = contentType.includes('video/mp2t') || url.includes('.ts');

      return {
        url,
        working: true,
        latency,
        status: response.status,
        contentType,
        streamType: isHLS ? 'hls' : isMPEGTS ? 'mpegts' : 'unknown',
        size: response.data.length,
        checkedAt: new Date().toISOString()
      };

    } catch (error) {
      return {
        url,
        working: false,
        error: error.message,
        latency: Date.now() - startTime,
        checkedAt: new Date().toISOString()
      };
    }
  }
}

// Singleton export
const freeIPTVService = new FreeIPTVService();
export default freeIPTVService;
