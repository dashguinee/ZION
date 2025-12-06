/**
 * Stream Extractor Service
 * Extracts direct video streams from embed providers
 * No ads, no redirects - just raw HLS/MP4 URLs
 */

import logger from '../utils/logger.js';

// Use native fetch (Node 18+)

class StreamExtractorService {
  constructor() {
    this.userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
    this.cache = new Map(); // Simple in-memory cache
    this.cacheTTL = 3600000; // 1 hour
  }

  /**
   * Main entry - try multiple providers until one works
   */
  async extractStream(tmdbId, type = 'movie', season = null, episode = null) {
    const cacheKey = `${type}_${tmdbId}_${season}_${episode}`;

    // Check cache first
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.cacheTTL) {
      logger.info(`[Extractor] Cache hit for ${cacheKey}`);
      return cached.data;
    }

    logger.info(`[Extractor] Extracting stream for ${type}/${tmdbId}`);

    // Try providers in order of reliability
    const providers = [
      () => this.extractFromEmbedSu(tmdbId, type, season, episode),
      () => this.extractFromVidSrcRip(tmdbId, type, season, episode),
      () => this.extractFromVidLink(tmdbId, type, season, episode),
    ];

    for (const provider of providers) {
      try {
        const result = await provider();
        if (result && result.url) {
          // Cache successful result
          this.cache.set(cacheKey, { data: result, timestamp: Date.now() });
          return result;
        }
      } catch (error) {
        logger.warn(`[Extractor] Provider failed: ${error.message}`);
      }
    }

    return null;
  }

  /**
   * Extract from embed.su
   * Decodes their obfuscated config to get direct stream
   */
  async extractFromEmbedSu(tmdbId, type, season, episode) {
    const baseUrl = 'https://embed.su';
    let url = type === 'movie'
      ? `${baseUrl}/embed/movie/${tmdbId}`
      : `${baseUrl}/embed/tv/${tmdbId}/${season}/${episode}`;

    logger.info(`[EmbedSu] Fetching: ${url}`);

    const response = await fetch(url, {
      headers: {
        'User-Agent': this.userAgent,
        'Accept': 'text/html,application/xhtml+xml',
        'Accept-Language': 'en-US,en;q=0.9',
        'Referer': 'https://www.google.com/',
      },
      timeout: 15000,
    });

    if (!response.ok) {
      throw new Error(`EmbedSu returned ${response.status}`);
    }

    const html = await response.text();

    // Extract obfuscated config
    const configMatch = html.match(/window\.vConfig\s*=\s*JSON\.parse\(atob\(`([^`]+)`\)\)/);
    if (!configMatch) {
      throw new Error('Config not found in page');
    }

    // Decode base64 config
    const configData = JSON.parse(Buffer.from(configMatch[1], 'base64').toString());
    logger.info(`[EmbedSu] Found config for: ${configData.title}`);

    // Decode the hash to get servers
    const servers = this.decodeEmbedSuHash(configData.hash);
    if (!servers || servers.length === 0) {
      throw new Error('No servers found');
    }

    // Try each server until we get a stream
    for (const server of servers) {
      try {
        const streamUrl = await this.getEmbedSuStream(server.hash);
        if (streamUrl) {
          return {
            url: streamUrl.source,
            provider: 'embed.su',
            server: server.name,
            subtitles: streamUrl.subtitles || [],
            format: streamUrl.format || 'hls',
          };
        }
      } catch (e) {
        logger.warn(`[EmbedSu] Server ${server.name} failed: ${e.message}`);
      }
    }

    throw new Error('All servers failed');
  }

  /**
   * Decode embed.su hash (reverse engineered from their obfuscation)
   */
  decodeEmbedSuHash(hash) {
    try {
      // First decode: base64 -> split by . -> reverse each part
      const firstDecode = Buffer.from(hash, 'base64')
        .toString()
        .split('.')
        .map(item => item.split('').reverse().join(''));

      // Second decode: join -> reverse -> base64 decode -> parse JSON
      const joined = firstDecode.join('').split('').reverse().join('');
      const servers = JSON.parse(Buffer.from(joined, 'base64').toString());

      return servers.map(s => ({ name: s.name, hash: s.hash }));
    } catch (e) {
      logger.error(`[EmbedSu] Hash decode failed: ${e.message}`);
      return [];
    }
  }

  /**
   * Get actual stream URL from embed.su API
   */
  async getEmbedSuStream(hash) {
    const url = `https://embed.su/api/e/${hash}`;

    const response = await fetch(url, {
      headers: {
        'User-Agent': this.userAgent,
        'Accept': 'application/json',
        'Referer': 'https://embed.su/',
      },
      timeout: 10000,
    });

    if (!response.ok) {
      throw new Error(`Stream API returned ${response.status}`);
    }

    const data = await response.json();
    return data;
  }

  /**
   * Extract from vidsrc.rip using their VRF system
   */
  async extractFromVidSrcRip(tmdbId, type, season, episode) {
    const baseUrl = 'https://vidsrc.rip';
    let url = type === 'movie'
      ? `${baseUrl}/embed/movie/${tmdbId}`
      : `${baseUrl}/embed/tv/${tmdbId}/${season}/${episode}`;

    logger.info(`[VidSrcRip] Fetching: ${url}`);

    const response = await fetch(url, {
      headers: {
        'User-Agent': this.userAgent,
        'Accept': 'text/html',
      },
      timeout: 15000,
    });

    if (!response.ok) {
      throw new Error(`VidSrcRip returned ${response.status}`);
    }

    const html = await response.text();

    // Extract config
    const configMatch = html.match(/window\.config\s*=\s*(\{[^;]+\});/s);
    if (!configMatch) {
      throw new Error('Config not found');
    }

    const config = this.parseVidSrcConfig(configMatch[1]);
    if (!config.servers || config.servers.length === 0) {
      throw new Error('No servers in config');
    }

    // Get the encryption key
    const key = await this.getVidSrcKey(baseUrl);

    // Try each server
    for (const server of config.servers) {
      try {
        const streamData = await this.getVidSrcStream(baseUrl, server, config.tmdbId, key, season, episode);
        if (streamData && streamData.sources) {
          const bestSource = streamData.sources[0];
          return {
            url: bestSource.file,
            provider: 'vidsrc.rip',
            server: server,
            quality: bestSource.label || 'auto',
            format: 'hls',
          };
        }
      } catch (e) {
        logger.warn(`[VidSrcRip] Server ${server} failed: ${e.message}`);
      }
    }

    throw new Error('All servers failed');
  }

  /**
   * Parse vidsrc config string to object
   */
  parseVidSrcConfig(configStr) {
    const config = {};
    const content = configStr.slice(1, -1).trim();
    const regex = /(\w+):\s*(?:'([^']*)'|"([^"]*)"|(\[[^\]]*\])|([^,}]+))/g;
    let match;

    while ((match = regex.exec(content)) !== null) {
      const [, key, sq, dq, arr, uq] = match;
      let value = sq || dq || uq;

      if (arr) {
        try { value = JSON.parse(arr); } catch { value = []; }
      }

      if (key === 'servers' && typeof value === 'string') {
        value = [value];
      }

      config[key] = value;
    }

    return config;
  }

  /**
   * Get VidSrc encryption key
   */
  async getVidSrcKey(baseUrl) {
    const response = await fetch(`${baseUrl}/images/skip-button.png`, {
      headers: { 'User-Agent': this.userAgent },
      timeout: 10000,
    });
    return response.text();
  }

  /**
   * XOR encrypt/decrypt for VidSrc VRF
   */
  xorCrypt(key, message) {
    const keyCodes = Array.from(key, c => c.charCodeAt(0));
    const msgCodes = Array.from(message, c => c.charCodeAt(0));
    const result = msgCodes.map((c, i) => c ^ keyCodes[i % keyCodes.length]);
    return String.fromCharCode(...result);
  }

  /**
   * Generate VRF token for VidSrc
   */
  generateVRF(key, path) {
    const decoded = decodeURIComponent(path);
    const xored = this.xorCrypt(key, decoded);
    return encodeURIComponent(Buffer.from(xored).toString('base64'));
  }

  /**
   * Get stream from VidSrc API
   */
  async getVidSrcStream(baseUrl, server, tmdbId, key, season, episode) {
    const path = `/api/source/${server}/${tmdbId}`;
    const vrf = this.generateVRF(key, path);

    let url = `${baseUrl}${path}?vrf=${vrf}`;
    if (season && episode) {
      url += `&s=${season}&e=${episode}`;
    }

    const response = await fetch(url, {
      headers: {
        'User-Agent': this.userAgent,
        'Accept': 'application/json',
        'Referer': `${baseUrl}/`,
      },
      timeout: 10000,
    });

    if (!response.ok) {
      throw new Error(`API returned ${response.status}`);
    }

    return response.json();
  }

  /**
   * Extract from VidLink.pro
   */
  async extractFromVidLink(tmdbId, type, season, episode) {
    const baseUrl = 'https://vidlink.pro';
    let url = type === 'movie'
      ? `${baseUrl}/movie/${tmdbId}`
      : `${baseUrl}/tv/${tmdbId}/${season}/${episode}`;

    logger.info(`[VidLink] Fetching: ${url}`);

    const response = await fetch(url, {
      headers: {
        'User-Agent': this.userAgent,
        'Accept': 'text/html',
      },
      timeout: 15000,
    });

    if (!response.ok) {
      throw new Error(`VidLink returned ${response.status}`);
    }

    const html = await response.text();

    // VidLink stores stream data in a script tag
    const dataMatch = html.match(/const\s+data\s*=\s*(\{[\s\S]*?\});/);
    if (!dataMatch) {
      throw new Error('Data not found');
    }

    // Try to extract direct URL from their player config
    const urlMatch = html.match(/file:\s*["']([^"']+\.m3u8[^"']*)/);
    if (urlMatch) {
      return {
        url: urlMatch[1],
        provider: 'vidlink.pro',
        format: 'hls',
      };
    }

    throw new Error('Stream URL not found');
  }

  /**
   * Proxy a stream through our server (for CORS)
   */
  async proxyStream(streamUrl, referer) {
    const response = await fetch(streamUrl, {
      headers: {
        'User-Agent': this.userAgent,
        'Referer': referer || 'https://embed.su/',
        'Origin': referer ? new URL(referer).origin : 'https://embed.su',
      },
    });

    return response;
  }

  /**
   * Clear expired cache entries
   */
  cleanCache() {
    const now = Date.now();
    for (const [key, value] of this.cache.entries()) {
      if (now - value.timestamp > this.cacheTTL) {
        this.cache.delete(key);
      }
    }
  }
}

export default new StreamExtractorService();
