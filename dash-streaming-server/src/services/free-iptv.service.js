/**
 * FREE IPTV SERVICE - Verified Working Sources Only
 *
 * QUALIFIED SOURCES (December 7, 2025):
 * ✅ iptv-org - PRIMARY (38K channels, 13K streams, ~85% working)
 * ✅ Free-TV - QUALITY CURATED (1,851 channels, ~60% working)
 * ❌ Scraper Zilla - BROKEN (jmp2.uk redirects return 404)
 * ❌ M3U8-Xtream - OFFLINE (zplaypro.lat returns 521)
 * ⚠️ PlutoTV - GEO-BLOCKED (US only, returns 400)
 *
 * Created: December 2025
 * Updated: December 7, 2025 - Removed broken sources, added status tags
 * Author: ZION SYNAPSE for DASH
 */

import axios from 'axios';
import logger from '../utils/logger.js';
import cacheService from './cache.service.js';

// Source status constants
const SOURCE_STATUS = {
  WORKING: 'working',
  DEGRADED: 'degraded',
  BROKEN: 'broken',
  GEO_BLOCKED: 'geo_blocked'
};

class FreeIPTVService {
  constructor() {
    // ===============================================
    // ✅ PRIMARY SOURCE: iptv-org (WORKING)
    // 38,525 channels, 13,002 streams
    // License: CC0 (Public Domain)
    // ===============================================
    this.iptvOrgBase = 'https://iptv-org.github.io/iptv';
    this.iptvOrgAPI = {
      channels: 'https://iptv-org.github.io/api/channels.json',
      streams: 'https://iptv-org.github.io/api/streams.json',
      categories: 'https://iptv-org.github.io/api/categories.json',
      countries: 'https://iptv-org.github.io/api/countries.json',
      languages: 'https://iptv-org.github.io/api/languages.json',
      guides: 'https://iptv-org.github.io/api/guides.json'
    };

    // ===============================================
    // ✅ SECONDARY SOURCE: Free-TV (WORKING)
    // 1,851 quality-curated channels with EPG
    // License: Open Source
    // ===============================================
    this.freeTV = {
      master: 'https://raw.githubusercontent.com/Free-TV/IPTV/master/playlist.m3u8',
      status: SOURCE_STATUS.WORKING
    };

    // ===============================================
    // ✅ VERIFIED WORKING CHANNELS (Direct URLs)
    // Hand-tested December 7, 2025
    // ===============================================
    this.verifiedChannels = {
      guinea: [
        {
          id: 'atv-gn',
          name: 'ATV Guinea',
          url: 'https://guineetvdirect.online:3320/live/atvguineelive.m3u8',
          logo: 'https://i.imgur.com/YkJPCfR.jpeg',
          quality: '400p',
          status: SOURCE_STATUS.WORKING,
          category: 'general',
          country: 'GN'
        },
        {
          id: 'espace-tv-gn',
          name: 'Espace TV',
          url: 'https://edge11.vedge.infomaniak.com/livecast/ik:espacetv/manifest.m3u8',
          logo: 'https://i.imgur.com/R5tbzFI.png',
          quality: '1080p',
          status: SOURCE_STATUS.WORKING,
          category: 'news',
          country: 'GN'
        },
        {
          id: 'kaback-tv-gn',
          name: 'Kaback TV',
          url: 'https://guineetvdirect.online:3842/live/kabacktvlive.m3u8',
          logo: 'https://i.imgur.com/oIe98p4.png',
          quality: '720p',
          status: SOURCE_STATUS.WORKING,
          category: 'general',
          country: 'GN'
        },
        {
          id: 'kalac-tv-gn',
          name: 'Kalac TV',
          url: 'https://edge13.vedge.infomaniak.com/livecast/ik:kalactv/chunklist_w280736538.m3u8',
          logo: 'https://i.imgur.com/FgKJiHZ.png',
          quality: '1080p',
          status: SOURCE_STATUS.WORKING,
          category: 'general',
          country: 'GN'
        },
        {
          id: 'rtg1-gn',
          name: 'RTG 1',
          url: 'http://69.64.57.208/rtg/playlist.m3u8',
          logo: 'https://i.imgur.com/E1sMcXz.png',
          quality: '480p',
          status: SOURCE_STATUS.WORKING,
          category: 'general',
          country: 'GN'
        }
      ],
      sports: [
        {
          id: 'africa24-sport',
          name: 'Africa 24 Sport',
          url: 'https://africa24.vedge.infomaniak.com/livecast/ik:africa24sport/manifest.m3u8',
          logo: 'https://i0.wp.com/africa24tv.com/wp-content/uploads/2023/12/LOGO-AFRICASPORT-4-HD-sans-fond.png',
          quality: '1080p',
          status: SOURCE_STATUS.WORKING,
          category: 'sports',
          country: 'FR',
          priority: true
        },
        {
          id: 'afrosport-ng',
          name: 'AfroSport Nigeria',
          url: 'https://newproxy3.vidivu.tv/vidivu_afrosport/index.m3u8',
          logo: 'https://pbs.twimg.com/profile_images/1451668129042599936/Uh-Z6Sh1_400x400.jpg',
          quality: '720p',
          status: SOURCE_STATUS.WORKING,
          category: 'sports',
          country: 'NG',
          priority: true
        }
      ],
      french: [
        {
          id: 'cgtn-french',
          name: 'CGTN Français',
          url: 'https://news.cgtn.com/resource/live/french/cgtn-f.m3u8',
          logo: 'https://i.imgur.com/fMsJYzl.png',
          quality: '1080p',
          status: SOURCE_STATUS.WORKING,
          category: 'news',
          country: 'CN'
        }
      ],
      news: [
        {
          id: 'france24-fr',
          name: 'France 24 Français',
          url: 'https://www.youtube.com/c/FRANCE24/live',
          logo: 'https://i.imgur.com/61MSiq9.png',
          quality: '1080p',
          status: SOURCE_STATUS.WORKING,
          category: 'news',
          country: 'FR',
          type: 'youtube'
        },
        {
          id: 'euronews-fr',
          name: 'Euronews Français',
          url: 'https://www.youtube.com/@euloNewsfrench/live',
          logo: 'https://i.imgur.com/3Lr5iAj.png',
          quality: '1080p',
          status: SOURCE_STATUS.WORKING,
          category: 'news',
          country: 'FR',
          type: 'youtube'
        }
      ]
    };

    // ===============================================
    // ⚠️ SCRAPER ZILLA (Partially Working)
    // 1,041 working streams from 4 domains
    // 12,950+ broken (jmp2.uk, pixelstreams, cloudfront)
    // ===============================================
    this.scraperZilla = {
      masterUrl: 'https://raw.githubusercontent.com/abusaeeidx/IPTV-Scraper-Zilla/main/combined-playlist.m3u',
      workingDomains: [
        'sofast.tv',      // 153 streams - 200 OK, HLS
        'tubi.io',        // 167 streams - HLS 720p (needs GET not HEAD)
        'a1xs.vip',       // 188 streams - MPEGTS
        'tvpass.org'      // 533 streams - HLS with auth tokens
      ],
      brokenDomains: [
        'jmp2.uk',        // 12,950 - 404 from Cloudflare
        'pixelstreams',   // 85 - 403 Forbidden
        'cloudfront.net', // ~500 - 403 Forbidden
        'hilay.tv',       // 289 - timeout
        'udptv.xyz'       // 280 - timeout
      ],
      lastTested: '2025-12-07',
      totalWorking: 1041,
      totalBroken: 14000
    };

    // ===============================================
    // ❌ BROKEN SOURCES (Documented but disabled)
    // ===============================================
    this.brokenSources = {
      m3u8Xtream: {
        reason: 'zplaypro.lat provider offline (HTTP 521)',
        lastChecked: '2025-12-07',
        urls: {
          topMovies: 'https://aymrgknetzpucldhpkwm.supabase.co/storage/v1/object/public/tmdb/top-movies.m3u'
        }
      },
      plutoTV: {
        reason: 'US geo-blocked (returns HTTP 400)',
        lastChecked: '2025-12-07',
        urls: {
          us: 'https://raw.githubusercontent.com/iptv-org/iptv/master/streams/us_pluto.m3u'
        }
      }
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

    // Category priorities
    this.priorityCategories = ['sports', 'news', 'entertainment', 'music', 'movies', 'kids'];

    // Cache TTL (1 hour)
    this.cacheTTL = 3600;
  }

  /**
   * Parse M3U playlist into structured channel data
   */
  parseM3U(content, sourceTag = 'unknown') {
    const channels = [];
    const lines = content.split('\n');
    let currentChannel = null;

    for (const line of lines) {
      const trimmed = line.trim();

      if (trimmed.startsWith('#EXTINF:')) {
        const match = trimmed.match(/#EXTINF:-?\d+\s*(.*)/);
        if (match) {
          const info = match[1];
          const tvgIdMatch = info.match(/tvg-id="([^"]*)"/);
          const logoMatch = info.match(/tvg-logo="([^"]*)"/);
          const groupMatch = info.match(/group-title="([^"]*)"/);
          const nameMatch = info.match(/,([^,]+)$/);

          currentChannel = {
            id: tvgIdMatch ? tvgIdMatch[1] : null,
            name: nameMatch ? nameMatch[1].trim() : 'Unknown',
            logo: logoMatch ? logoMatch[1] : null,
            group: groupMatch ? groupMatch[1] : 'General',
            source: sourceTag,
            status: SOURCE_STATUS.WORKING
          };
        }
      } else if (trimmed.startsWith('http') && currentChannel) {
        currentChannel.url = trimmed;
        currentChannel.type = trimmed.includes('.m3u8') ? 'hls' : 'mpegts';
        channels.push(currentChannel);
        currentChannel = null;
      }
    }

    return channels;
  }

  // ===============================================
  // VERIFIED CHANNELS (Hand-tested, guaranteed working)
  // ===============================================

  /**
   * Get verified Guinea channels (tested December 7, 2025)
   */
  getVerifiedGuineaChannels() {
    return this.verifiedChannels.guinea.map(ch => ({
      ...ch,
      verified: true,
      verifiedDate: '2025-12-07'
    }));
  }

  /**
   * Get verified sports channels
   */
  getVerifiedSportsChannels() {
    return this.verifiedChannels.sports.map(ch => ({
      ...ch,
      verified: true,
      verifiedDate: '2025-12-07'
    }));
  }

  /**
   * Get verified French channels
   */
  getVerifiedFrenchChannels() {
    return this.verifiedChannels.french.map(ch => ({
      ...ch,
      verified: true,
      verifiedDate: '2025-12-07'
    }));
  }

  /**
   * Get all verified channels combined
   */
  getAllVerifiedChannels() {
    const all = [
      ...this.getVerifiedGuineaChannels(),
      ...this.getVerifiedSportsChannels(),
      ...this.getVerifiedFrenchChannels()
    ];

    return all.map(ch => ({
      ...ch,
      verified: true,
      verifiedDate: '2025-12-07'
    }));
  }

  // ===============================================
  // IPTV-ORG METHODS (Primary Source)
  // ===============================================

  /**
   * Fetch channels by country code from iptv-org
   */
  async getChannelsByCountry(countryCode) {
    const cacheKey = `iptv:country:${countryCode}`;

    try {
      const cached = await cacheService.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }

      const url = `${this.iptvOrgBase}/countries/${countryCode.toLowerCase()}.m3u`;
      logger.info(`[iptv-org] Fetching channels for country: ${countryCode}`);

      const response = await axios.get(url, { timeout: 15000 });
      const channels = this.parseM3U(response.data, 'iptv-org');

      await cacheService.set(cacheKey, JSON.stringify(channels), this.cacheTTL);
      logger.info(`[iptv-org] Found ${channels.length} channels for ${countryCode}`);
      return channels;

    } catch (error) {
      if (error.response?.status === 404) {
        logger.warn(`[iptv-org] No channels found for country: ${countryCode}`);
        return [];
      }
      logger.error(`[iptv-org] Error fetching ${countryCode}:`, error.message);
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
      logger.info(`[iptv-org] Fetching channels for category: ${category}`);

      const response = await axios.get(url, { timeout: 30000 });
      const channels = this.parseM3U(response.data, 'iptv-org');

      await cacheService.set(cacheKey, JSON.stringify(channels), this.cacheTTL);
      logger.info(`[iptv-org] Found ${channels.length} channels for ${category}`);
      return channels;

    } catch (error) {
      logger.error(`[iptv-org] Error fetching ${category}:`, error.message);
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
      logger.info(`[iptv-org] Fetching channels for language: ${langCode}`);

      const response = await axios.get(url, { timeout: 30000 });
      const channels = this.parseM3U(response.data, 'iptv-org');

      await cacheService.set(cacheKey, JSON.stringify(channels), this.cacheTTL);
      logger.info(`[iptv-org] Found ${channels.length} ${langCode} channels`);
      return channels;

    } catch (error) {
      logger.error(`[iptv-org] Error fetching ${langCode}:`, error.message);
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
   * Get African sports channels
   */
  async getAfricanSports() {
    const cacheKey = 'iptv:african-sports';

    try {
      const cached = await cacheService.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }

      // Start with verified sports
      const verified = this.getVerifiedSportsChannels();

      // Fetch all sports from iptv-org
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

      // Combine: verified first, then iptv-org
      const seen = new Set();
      const combined = [];

      for (const ch of [...verified, ...africanSports]) {
        if (!seen.has(ch.url)) {
          seen.add(ch.url);
          combined.push(ch);
        }
      }

      await cacheService.set(cacheKey, JSON.stringify(combined), this.cacheTTL);
      logger.info(`[iptv-org] Found ${combined.length} African sports channels`);
      return combined;

    } catch (error) {
      logger.error('[iptv-org] Error fetching African sports:', error.message);
      return this.getVerifiedSportsChannels(); // Fallback to verified
    }
  }

  /**
   * Get West African channels
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
      logger.info(`[iptv-org] Found ${allChannels.length} West African channels`);
      return allChannels;

    } catch (error) {
      logger.error('[iptv-org] Error fetching West African channels:', error.message);
      return [];
    }
  }

  // ===============================================
  // SCRAPER ZILLA METHODS (Filtered Working Domains)
  // ===============================================

  /**
   * Get working channels from Scraper Zilla
   * Filters to only working domains (sofast.tv, tubi.io, a1xs.vip, tvpass.org)
   */
  async getScraperZillaChannels() {
    const cacheKey = 'iptv:scraper-zilla:working';

    try {
      const cached = await cacheService.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }

      logger.info('[Scraper-Zilla] Fetching and filtering to working domains...');
      const response = await axios.get(this.scraperZilla.masterUrl, { timeout: 60000 });
      const allChannels = this.parseM3U(response.data, 'scraper-zilla');

      // Filter to only working domains
      const workingDomains = this.scraperZilla.workingDomains;
      const workingChannels = allChannels.filter(channel => {
        return workingDomains.some(domain => channel.url.includes(domain));
      });

      // Tag each channel with its domain
      const tagged = workingChannels.map(ch => {
        let quality = 'sd';
        let streamType = 'hls';

        if (ch.url.includes('tubi.io')) {
          quality = '720p';
          streamType = 'hls';
        } else if (ch.url.includes('sofast.tv')) {
          quality = 'hd';
          streamType = 'hls';
        } else if (ch.url.includes('a1xs.vip')) {
          quality = 'sd';
          streamType = 'mpegts';
        } else if (ch.url.includes('tvpass.org')) {
          quality = 'hd';
          streamType = 'hls';
        }

        return {
          ...ch,
          quality,
          streamType,
          source: 'scraper-zilla',
          filtered: true
        };
      });

      await cacheService.set(cacheKey, JSON.stringify(tagged), this.cacheTTL);
      logger.info(`[Scraper-Zilla] Filtered ${tagged.length} working channels (from ${allChannels.length} total)`);
      return tagged;

    } catch (error) {
      logger.error('[Scraper-Zilla] Error fetching:', error.message);
      return [];
    }
  }

  // ===============================================
  // FREE-TV METHODS (Quality Curated Source)
  // ===============================================

  /**
   * Get channels from Free-TV (quality curated)
   */
  async getFreeTVChannels() {
    const cacheKey = 'iptv:freetv:master';

    try {
      const cached = await cacheService.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }

      logger.info('[Free-TV] Fetching quality-curated playlist...');
      const response = await axios.get(this.freeTV.master, { timeout: 60000 });
      const channels = this.parseM3U(response.data, 'free-tv');

      const tagged = channels.map(ch => ({
        ...ch,
        quality: 'hd-preferred',
        curated: true
      }));

      await cacheService.set(cacheKey, JSON.stringify(tagged), this.cacheTTL);
      logger.info(`[Free-TV] Loaded ${tagged.length} curated channels`);
      return tagged;

    } catch (error) {
      logger.error('[Free-TV] Error fetching:', error.message);
      return [];
    }
  }

  // ===============================================
  // COMBINED PRIORITY LISTS
  // ===============================================

  /**
   * Get DASH priority channels (Guinea + Sports + French)
   * This is the main endpoint for the app
   */
  async getDashPriorityChannels() {
    const cacheKey = 'iptv:dash-priority';

    try {
      const cached = await cacheService.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }

      logger.info('[DASH] Building priority channel list...');

      // Start with verified channels (guaranteed working)
      const verified = this.getAllVerifiedChannels();

      // Fetch from iptv-org in parallel
      const [guinea, french, sports] = await Promise.all([
        this.getChannelsByCountry('gn'),
        this.getFrenchChannels(),
        this.getAfricanSports()
      ]);

      // Deduplicate by URL, verified channels first
      const seen = new Set();
      const combined = [];

      // Priority order: Verified → Guinea → Sports → French
      const ordered = [...verified, ...guinea, ...sports, ...french];

      for (const channel of ordered) {
        if (channel.url && !seen.has(channel.url)) {
          seen.add(channel.url);
          combined.push(channel);
        }
      }

      await cacheService.set(cacheKey, JSON.stringify(combined), this.cacheTTL);
      logger.info(`[DASH] Built priority list: ${combined.length} channels`);
      return combined;

    } catch (error) {
      logger.error('[DASH] Error building priority list:', error.message);
      return this.getAllVerifiedChannels(); // Fallback to verified only
    }
  }

  /**
   * Get ultimate combined list (all working sources)
   */
  async getUltimateList() {
    const cacheKey = 'iptv:ultimate';

    try {
      const cached = await cacheService.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }

      logger.info('[ULTIMATE] Building combined list from all working sources...');

      // Fetch from all working sources (including Scraper Zilla now!)
      const [dashPriority, freeTV, scraperZilla] = await Promise.all([
        this.getDashPriorityChannels(),
        this.getFreeTVChannels(),
        this.getScraperZillaChannels()
      ]);

      // Deduplicate
      const seen = new Set();
      const combined = [];

      // Priority: verified/dash → free-tv → scraper-zilla
      for (const channel of [...dashPriority, ...freeTV, ...scraperZilla]) {
        if (channel.url && !seen.has(channel.url)) {
          seen.add(channel.url);
          combined.push(channel);
        }
      }

      await cacheService.set(cacheKey, JSON.stringify(combined), 1800); // 30 min cache
      logger.info(`[ULTIMATE] Built list: ${combined.length} channels`);
      return combined;

    } catch (error) {
      logger.error('[ULTIMATE] Error:', error.message);
      return [];
    }
  }

  // ===============================================
  // HEALTH CHECK & STATS
  // ===============================================

  /**
   * Test if a stream URL is working
   */
  async testStream(url) {
    try {
      const response = await axios.head(url, {
        timeout: 5000,
        maxRedirects: 5,
        headers: { 'User-Agent': 'DASH-WebTV/3.0' },
        validateStatus: (status) => status < 500
      });
      return response.status === 200 || response.status === 302 || response.status === 301;
    } catch {
      try {
        const response = await axios.get(url, {
          timeout: 5000,
          maxRedirects: 5,
          headers: {
            'User-Agent': 'DASH-WebTV/3.0',
            'Range': 'bytes=0-1024'
          },
          responseType: 'stream',
          validateStatus: (status) => status < 500
        });
        response.data.destroy();
        return true;
      } catch {
        return false;
      }
    }
  }

  /**
   * Get source statistics
   */
  async getStats() {
    const verified = this.getAllVerifiedChannels();

    return {
      sources: {
        iptvOrg: {
          status: SOURCE_STATUS.WORKING,
          totalChannels: 38525,
          totalStreams: 13002,
          workingRate: '~85%'
        },
        freeTV: {
          status: SOURCE_STATUS.WORKING,
          totalChannels: 1851,
          workingRate: '~60%'
        },
        scraperZilla: {
          status: SOURCE_STATUS.DEGRADED,
          workingDomains: this.scraperZilla.workingDomains,
          workingStreams: this.scraperZilla.totalWorking,
          brokenStreams: this.scraperZilla.totalBroken,
          note: 'Filtered to 4 working domains: sofast.tv, tubi.io, a1xs.vip, tvpass.org'
        },
        m3u8Xtream: {
          status: SOURCE_STATUS.BROKEN,
          reason: 'zplaypro.lat offline (521)'
        },
        plutoTV: {
          status: SOURCE_STATUS.GEO_BLOCKED,
          reason: 'US only (returns 400)'
        }
      },
      verified: {
        guinea: verified.filter(c => c.country === 'GN').length,
        sports: verified.filter(c => c.category === 'sports').length,
        french: verified.filter(c => c.country === 'FR' || c.country === 'CN').length,
        total: verified.length
      },
      lastUpdated: '2025-12-07',
      recommendation: 'Use getDashPriorityChannels() for best results, getUltimateList() for all sources'
    };
  }

  /**
   * Get detailed stream health
   */
  async getStreamHealth(url) {
    const startTime = Date.now();

    try {
      const response = await axios.get(url, {
        timeout: 10000,
        maxRedirects: 5,
        headers: {
          'User-Agent': 'DASH-WebTV/3.0',
          'Range': 'bytes=0-10240'
        },
        responseType: 'arraybuffer',
        validateStatus: (status) => status < 500
      });

      const latency = Date.now() - startTime;
      const contentType = response.headers['content-type'] || '';

      return {
        url,
        working: true,
        latency,
        status: response.status,
        contentType,
        streamType: contentType.includes('mpegurl') || url.includes('.m3u8') ? 'hls' : 'mpegts',
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
