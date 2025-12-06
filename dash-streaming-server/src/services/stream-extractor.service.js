/**
 * Stream Extractor Service
 * Extracts direct video streams from embed providers
 * No ads, no redirects - just raw HLS/MP4 URLs
 *
 * WORKING: Vixsrc (primary), with fallbacks to other providers
 */

import logger from '../utils/logger.js';
import { extractFromVixsrc } from './vixsrc-provider.js';

// Use native fetch (Node 18+)

class StreamExtractorService {
  constructor() {
    this.userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
    this.cache = new Map(); // Simple in-memory cache
    this.cacheTTL = 3600000; // 1 hour

    // Updated provider domains (Dec 2025)
    this.providers = {
      embedSu: 'https://embed.su',
      vidsrcMe: 'https://vidsrc.me', // Primary
      vidsrcStream: 'https://vidsrc.stream',
      multiEmbed: 'https://multiembed.mov',
      autoembed: 'https://player.autoembed.cc',
      smashystream: 'https://player.smashy.stream',
    };

    // VidSrc.me RCP domain for source resolution
    this.rcpUrl = 'https://vidsrc.stream/rcp';
  }

  /**
   * Hunter decryption - decodes obfuscated JS from multiembed/superembed
   * This is the key to extracting HLS URLs from their player
   */
  hunterDecode(h, u, n, t, e, r) {
    const hunterDef = (d, e, f) => {
      const charset = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ+/';
      const sourceBase = charset.substring(0, e);
      const targetBase = charset.substring(0, f);

      const reversedInput = d.split('').reverse();
      let result = 0;

      for (let power = 0; power < reversedInput.length; power++) {
        const digit = reversedInput[power];
        if (sourceBase.includes(digit)) {
          result += sourceBase.indexOf(digit) * Math.pow(e, power);
        }
      }

      let convertedResult = '';
      while (result > 0) {
        convertedResult = targetBase[result % f] + convertedResult;
        result = Math.floor((result - (result % f)) / f);
      }

      return parseInt(convertedResult) || 0;
    };

    let i = 0;
    let resultStr = '';

    while (i < h.length) {
      let j = 0;
      let s = '';

      while (h[i] !== n[e]) {
        s += h[i];
        i++;
      }

      while (j < n.length) {
        s = s.split(n[j]).join(j.toString());
        j++;
      }

      resultStr += String.fromCharCode(hunterDef(s, e, 10) - t);
      i++;
    }

    return resultStr;
  }

  /**
   * Process hunter function arguments from eval()
   */
  processHunterArgs(argsStr) {
    const match = argsStr.match(/^"(.*?)",(.*?),"(.*?)",(.*?),(.*?),(.*?)$/);
    if (!match) return null;

    return [
      match[1],              // h (encoded string)
      parseInt(match[2]),    // u (number)
      match[3],              // n (charset)
      parseInt(match[4]),    // t (offset)
      parseInt(match[5]),    // e (base)
      parseInt(match[6])     // r (number)
    ];
  }

  /**
   * XOR decode for vidsrc.me source URLs
   */
  decodeSource(encoded, seed) {
    const encodedBuffer = Buffer.from(encoded, 'hex');
    let decoded = '';
    for (let i = 0; i < encodedBuffer.length; i++) {
      decoded += String.fromCharCode(encodedBuffer[i] ^ seed.charCodeAt(i % seed.length));
    }
    return decoded;
  }

  /**
   * Decode VidSrc PRO HLS URL (base64 with /@#@/ markers)
   */
  decodeVidsrcProHls(encodedUrl) {
    const formatHlsB64 = (data) => {
      const cleaned = data.replace(/\/@#@\/[^=\/]+==/, '');
      if (/\/@#@\/[^=\/]+==/.test(cleaned)) {
        return formatHlsB64(cleaned);
      }
      return cleaned;
    };

    const formatted = formatHlsB64(encodedUrl.substring(2));
    // URL-safe base64 decode
    const standardized = formatted.replace(/_/g, '/').replace(/-/g, '+');
    const decoded = Buffer.from(standardized, 'base64').toString('utf-8');
    return decoded;
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

    // Try providers in order of reliability - VIXSRC WORKS!
    const providers = [
      () => extractFromVixsrc(tmdbId, type, season, episode), // WORKING - direct HLS!
      () => this.extractFromVidSrcMe(tmdbId, type, season, episode),
      () => this.extractFromMultiEmbed(tmdbId, type, season, episode),
      () => this.extractFromEmbedSu(tmdbId, type, season, episode),
      () => this.extractFromVidSrcRip(tmdbId, type, season, episode),
      () => this.extractFromAutoEmbed(tmdbId, type, season, episode),
      () => this.extractFromSmashy(tmdbId, type, season, episode),
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
   * Extract from VidSrc.me using RCP flow
   * This is the proven method from vidsrc-me-resolver
   */
  async extractFromVidSrcMe(tmdbId, type, season, episode) {
    // Step 1: Get available sources from the embed page
    let embedUrl = type === 'movie'
      ? `${this.providers.vidsrcMe}/embed/${tmdbId}`
      : `${this.providers.vidsrcMe}/embed/${tmdbId}/${season}-${episode}/`;

    logger.info(`[VidSrcMe] Step 1 - Fetching sources: ${embedUrl}`);

    const embedRes = await fetch(embedUrl, {
      headers: {
        'User-Agent': this.userAgent,
        'Accept': 'text/html',
      },
    });

    if (!embedRes.ok) {
      throw new Error(`VidSrc.me returned ${embedRes.status}`);
    }

    const embedHtml = await embedRes.text();
    const embedHostname = new URL(embedRes.url).hostname;
    const sourcesReferrer = `https://${embedHostname}/`;

    // Extract sources (server name -> hash)
    const sourceMatches = embedHtml.matchAll(/<div[^>]*class="server"[^>]*data-hash="([^"]+)"[^>]*>([^<]*)<\/div>/gi);
    const sources = {};
    for (const match of sourceMatches) {
      sources[match[2].trim()] = match[1];
    }

    // Also try simpler pattern
    if (Object.keys(sources).length === 0) {
      const simpleMatches = embedHtml.matchAll(/data-hash="([^"]+)"[^>]*>([^<]+)</gi);
      for (const match of simpleMatches) {
        sources[match[2].trim()] = match[1];
      }
    }

    logger.info(`[VidSrcMe] Found ${Object.keys(sources).length} sources: ${Object.keys(sources).join(', ')}`);

    if (Object.keys(sources).length === 0) {
      throw new Error('No sources found');
    }

    // Step 2: Try sources in order (prefer VidSrc PRO, then Superembed)
    const preferredOrder = ['VidSrc PRO', 'Superembed', 'Vidplay'];
    const sortedSources = Object.keys(sources).sort((a, b) => {
      const aIndex = preferredOrder.findIndex(p => a.toLowerCase().includes(p.toLowerCase()));
      const bIndex = preferredOrder.findIndex(p => b.toLowerCase().includes(p.toLowerCase()));
      return (aIndex === -1 ? 99 : aIndex) - (bIndex === -1 ? 99 : bIndex);
    });

    for (const sourceName of sortedSources) {
      const sourceHash = sources[sourceName];
      logger.info(`[VidSrcMe] Trying source: ${sourceName}`);

      try {
        // Step 3: Get source URL from RCP
        const rcpUrl = `${this.rcpUrl}/${sourceHash}`;
        const rcpRes = await fetch(rcpUrl, {
          headers: {
            'User-Agent': this.userAgent,
            'Referer': sourcesReferrer,
          },
        });

        if (!rcpRes.ok) continue;

        const rcpHtml = await rcpRes.text();

        // Extract encoded data and seed (IMDb ID)
        const hiddenMatch = rcpHtml.match(/id="hidden"[^>]*data-h="([^"]+)"/);
        const seedMatch = rcpHtml.match(/data-i="([^"]+)"/);

        if (!hiddenMatch || !seedMatch) {
          logger.warn(`[VidSrcMe] Could not extract hidden data from RCP`);
          continue;
        }

        const encoded = hiddenMatch[1];
        const seed = seedMatch[1];

        // Decode the source URL
        let sourceUrl = this.decodeSource(encoded, seed);
        if (sourceUrl.startsWith('//')) {
          sourceUrl = 'https:' + sourceUrl;
        }

        logger.info(`[VidSrcMe] Decoded source URL: ${sourceUrl.substring(0, 60)}...`);

        // Step 4: Get redirect to final player
        const redirectRes = await fetch(sourceUrl, {
          headers: {
            'User-Agent': this.userAgent,
            'Referer': rcpUrl,
          },
          redirect: 'manual',
        });

        const finalUrl = redirectRes.headers.get('location') || sourceUrl;
        logger.info(`[VidSrcMe] Final URL: ${finalUrl.substring(0, 60)}...`);

        // Step 5: Extract stream based on final destination
        if (finalUrl.includes('vidsrc.stream')) {
          // VidSrc PRO path
          const stream = await this.extractVidsrcProStream(sourceUrl, rcpUrl);
          if (stream) {
            return {
              ...stream,
              provider: 'vidsrc.me/pro',
              server: sourceName,
            };
          }
        } else if (finalUrl.includes('multiembed.mov')) {
          // SuperEmbed path - use hunter decoder
          const stream = await this.extractMultiembedStream(sourceUrl, rcpUrl);
          if (stream) {
            return {
              ...stream,
              provider: 'vidsrc.me/superembed',
              server: sourceName,
            };
          }
        }
      } catch (e) {
        logger.warn(`[VidSrcMe] Source ${sourceName} failed: ${e.message}`);
      }
    }

    throw new Error('All VidSrc.me sources failed');
  }

  /**
   * Extract stream from VidSrc PRO player
   */
  async extractVidsrcProStream(url, referrer) {
    const res = await fetch(url, {
      headers: {
        'User-Agent': this.userAgent,
        'Referer': referrer,
      },
    });

    if (!res.ok) return null;
    const html = await res.text();

    // Look for encoded HLS URL
    const fileMatch = html.match(/file:"([^"]+)"/);
    if (!fileMatch) return null;

    const hlsUrl = this.decodeVidsrcProHls(fileMatch[1]);
    logger.info(`[VidSrcPro] Decoded HLS: ${hlsUrl.substring(0, 60)}...`);

    return {
      url: hlsUrl,
      format: 'hls',
    };
  }

  /**
   * Extract stream from MultiEmbed player using hunter decode
   */
  async extractMultiembedStream(url, referrer) {
    const res = await fetch(url, {
      headers: {
        'User-Agent': this.userAgent,
        'Referer': referrer,
      },
    });

    if (!res.ok) return null;
    const html = await res.text();

    // Look for hunter obfuscation
    const hunterMatch = html.match(/eval\(function\(h,u,n,t,e,r\).*?\}\((".*?")\)\)/s);
    if (!hunterMatch) return null;

    const args = this.processHunterArgs(hunterMatch[1]);
    if (!args) return null;

    const unpacked = this.hunterDecode(...args);

    // Extract HLS from decoded JS
    const hlsMatch = unpacked.match(/file:"([^"]+)"/);
    if (!hlsMatch) return null;

    logger.info(`[MultiEmbed] Decoded HLS: ${hlsMatch[1].substring(0, 60)}...`);

    // Extract subtitles
    let subtitles = [];
    const subtitleMatch = unpacked.match(/subtitle:"([^"]+)"/);
    if (subtitleMatch) {
      subtitles = subtitleMatch[1].split(',').map(sub => {
        const m = sub.match(/^\[(.*?)\](.*)$/);
        return m ? { label: m[1], url: m[2] } : null;
      }).filter(Boolean);
    }

    return {
      url: hlsMatch[1],
      format: 'hls',
      subtitles,
    };
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
   * Extract from MultiEmbed/SuperEmbed using hunter decryption
   * This decodes their obfuscated player JS to get direct HLS URLs
   */
  async extractFromMultiEmbed(tmdbId, type, season, episode) {
    let url = type === 'movie'
      ? `https://multiembed.mov/directstream.php?video_id=${tmdbId}&tmdb=1`
      : `https://multiembed.mov/directstream.php?video_id=${tmdbId}&tmdb=1&s=${season}&e=${episode}`;

    logger.info(`[MultiEmbed] Fetching: ${url}`);

    const response = await fetch(url, {
      headers: {
        'User-Agent': this.userAgent,
        'Accept': 'text/html,application/xhtml+xml',
        'Referer': 'https://multiembed.mov/',
      },
    });

    if (!response.ok) {
      throw new Error(`MultiEmbed returned ${response.status}`);
    }

    const html = await response.text();

    // Look for eval(function(h,u,n,t,e,r) obfuscated code
    const hunterMatch = html.match(/eval\(function\(h,u,n,t,e,r\).*?\}\((".*?")\)\)/s);
    if (hunterMatch) {
      logger.info(`[MultiEmbed] Found hunter obfuscation, decoding...`);
      const args = this.processHunterArgs(hunterMatch[1]);
      if (args) {
        const unpacked = this.hunterDecode(...args);
        logger.info(`[MultiEmbed] Decoded JS length: ${unpacked.length}`);

        // Extract HLS URLs from decoded JS
        const hlsUrls = unpacked.match(/file:"([^"]*)"/g);
        if (hlsUrls && hlsUrls.length > 0) {
          const streamUrl = hlsUrls[0].replace('file:"', '').replace('"', '');
          logger.info(`[MultiEmbed] Extracted stream: ${streamUrl.substring(0, 80)}...`);

          // Also extract subtitles
          const subtitleMatch = unpacked.match(/subtitle:"([^"]*)"/);
          let subtitles = [];
          if (subtitleMatch) {
            subtitles = subtitleMatch[1].split(',').map(sub => {
              const m = sub.match(/^\[(.*?)\](.*)$/);
              return m ? { label: m[1], url: m[2] } : null;
            }).filter(Boolean);
          }

          return {
            url: streamUrl,
            provider: 'multiembed',
            format: 'hls',
            subtitles,
          };
        }
      }
    }

    // Fallback: Direct m3u8 match
    const m3u8Match = html.match(/https?:\/\/[^\s"'<>]+\.m3u8[^\s"'<>]*/gi);
    if (m3u8Match && m3u8Match.length > 0) {
      return {
        url: m3u8Match[0],
        provider: 'multiembed',
        format: 'hls',
      };
    }

    // Fallback: file: pattern
    const fileMatch = html.match(/["']?file["']?\s*[:=]\s*["']([^"']+\.m3u8[^"']*)/i);
    if (fileMatch) {
      return {
        url: fileMatch[1],
        provider: 'multiembed',
        format: 'hls',
      };
    }

    throw new Error('Could not extract stream from MultiEmbed');
  }

  /**
   * Extract from AutoEmbed - simpler API
   */
  async extractFromAutoEmbed(tmdbId, type, season, episode) {
    const baseUrl = this.providers.autoembed;
    let url = type === 'movie'
      ? `${baseUrl}/embed/movie/${tmdbId}`
      : `${baseUrl}/embed/tv/${tmdbId}/${season}/${episode}`;

    logger.info(`[AutoEmbed] Fetching: ${url}`);

    const response = await fetch(url, {
      headers: {
        'User-Agent': this.userAgent,
        'Accept': 'text/html',
        'Referer': 'https://www.google.com/',
      },
    });

    if (!response.ok) {
      throw new Error(`AutoEmbed returned ${response.status}`);
    }

    const html = await response.text();

    // AutoEmbed usually has the stream in a player config
    const m3u8Match = html.match(/(?:file|source|src)["'\s:]+["']?(https?:\/\/[^"'\s]+\.m3u8[^"'\s]*)/i);
    if (m3u8Match) {
      return {
        url: m3u8Match[1],
        provider: 'autoembed',
        format: 'hls',
      };
    }

    // Try iframe src for nested player
    const iframeMatch = html.match(/iframe[^>]+src=["']([^"']+)/i);
    if (iframeMatch) {
      // Follow the iframe
      const iframeRes = await fetch(iframeMatch[1], {
        headers: { 'User-Agent': this.userAgent, 'Referer': url },
      });
      const iframeHtml = await iframeRes.text();
      const nestedM3u8 = iframeHtml.match(/(?:file|source|src)["'\s:]+["']?(https?:\/\/[^"'\s]+\.m3u8[^"'\s]*)/i);
      if (nestedM3u8) {
        return {
          url: nestedM3u8[1],
          provider: 'autoembed',
          format: 'hls',
        };
      }
    }

    throw new Error('Stream not found in AutoEmbed');
  }

  /**
   * Extract from Smashy Stream
   */
  async extractFromSmashy(tmdbId, type, season, episode) {
    const baseUrl = this.providers.smashystream;
    let url = type === 'movie'
      ? `${baseUrl}/movie/${tmdbId}`
      : `${baseUrl}/tv/${tmdbId}/${season}/${episode}`;

    logger.info(`[Smashy] Fetching: ${url}`);

    const response = await fetch(url, {
      headers: {
        'User-Agent': this.userAgent,
        'Accept': 'text/html',
      },
    });

    if (!response.ok) {
      throw new Error(`Smashy returned ${response.status}`);
    }

    const html = await response.text();

    // Smashy embeds stream URLs in their player
    const streamMatch = html.match(/["']?(https?:\/\/[^"'\s]+\.m3u8[^"'\s]*)["']?/i);
    if (streamMatch) {
      return {
        url: streamMatch[1],
        provider: 'smashystream',
        format: 'hls',
      };
    }

    throw new Error('Stream not found in Smashy');
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
