/**
 * VidZee Provider - AES-256-CBC Encrypted Streams
 *
 * API: player.vidzee.wtf/api/server
 * Decryption: AES-256-CBC with key "qrincywincyspider" (padded to 32 bytes)
 * Format: Base64(iv:cipher) -> URL
 *
 * 10 servers available (sr=1-10)
 */

import logger from '../utils/logger.js';
import CryptoJS from 'crypto-js';

const VIDZEE_KEY = 'qrincywincyspider';
const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36';

/**
 * Decrypt VidZee token to get actual URL
 */
function decryptVidZeeToken(token) {
  try {
    if (!token || typeof token !== 'string') return null;
    if (/^https?:\/\//i.test(token)) return token; // Already a URL

    // Decode outer Base64 to get iv:cipher format
    const raw = Buffer.from(token, 'base64').toString('utf8');
    if (!raw.includes(':')) return null;

    const [ivB64, cipherB64] = raw.split(':');
    if (!ivB64 || !cipherB64) return null;

    // Parse IV from Base64
    const iv = CryptoJS.enc.Base64.parse(ivB64.trim());

    // Pad key to 32 bytes for AES-256
    const keyUtf8 = CryptoJS.enc.Utf8.parse(VIDZEE_KEY.padEnd(32, '\0'));

    // Decrypt
    const decrypted = CryptoJS.AES.decrypt(cipherB64.trim(), keyUtf8, {
      iv,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7
    }).toString(CryptoJS.enc.Utf8);

    if (!decrypted || !/^https?:\/\//i.test(decrypted)) {
      return null;
    }

    return decrypted.trim();
  } catch (e) {
    logger.debug(`[VidZee] Decrypt error: ${e.message}`);
    return null;
  }
}

/**
 * Extract streams from VidZee
 * @param {string} tmdbId - TMDB ID
 * @param {string} type - 'movie' or 'tv'
 * @param {number} season - Season number (for TV)
 * @param {number} episode - Episode number (for TV)
 * @returns {Promise<Array>} Array of stream objects
 */
async function extractFromVidZee(tmdbId, type = 'movie', season = null, episode = null) {
  const servers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  const streams = [];

  logger.info(`[VidZee] Extracting streams for ${type} ${tmdbId}`);

  // Query all servers in parallel
  const serverPromises = servers.map(async (sr) => {
    try {
      let url = `https://player.vidzee.wtf/api/server?id=${tmdbId}&sr=${sr}`;

      if (type === 'tv' && season && episode) {
        url += `&ss=${season}&ep=${episode}`;
      }

      const response = await fetch(url, {
        headers: {
          'User-Agent': USER_AGENT,
          'Referer': `https://player.vidzee.wtf/embed/${type}/${tmdbId}`,
          'Accept': 'application/json'
        },
        timeout: 7000
      });

      if (!response.ok) return [];

      const data = await response.json();
      if (!data) return [];

      // Parse sources
      let sources = [];
      if (data.url && Array.isArray(data.url)) {
        sources = data.url;
      } else if (data.link) {
        sources = [data];
      }

      if (sources.length === 0) return [];

      // Process each source
      return sources.map(source => {
        let streamUrl = source.link;

        // Try to decrypt if needed
        const decrypted = decryptVidZeeToken(streamUrl);
        if (decrypted) {
          streamUrl = decrypted;
        }

        if (!streamUrl || !/^https?:\/\//i.test(streamUrl)) {
          return null;
        }

        // Parse quality
        const label = source.name || source.type || '720p';
        let quality = String(label).match(/^\d+$/) ? `${label}p` : label;
        if (!/\d{3,4}p/i.test(quality)) {
          quality = '720p';
        }

        return {
          url: streamUrl,
          provider: 'vidzee',
          server: `Server ${sr}`,
          quality,
          format: streamUrl.includes('.m3u8') ? 'hls' : 'mp4',
          headers: {
            'Referer': 'https://core.vidzee.wtf/'
          }
        };
      }).filter(Boolean);

    } catch (e) {
      logger.debug(`[VidZee] Server ${sr} error: ${e.message}`);
      return [];
    }
  });

  const results = await Promise.all(serverPromises);

  // Flatten and deduplicate by URL
  const seen = new Set();
  for (const serverStreams of results) {
    for (const stream of serverStreams) {
      if (!seen.has(stream.url)) {
        seen.add(stream.url);
        streams.push(stream);
      }
    }
  }

  logger.info(`[VidZee] Found ${streams.length} unique streams`);
  return streams;
}

export { extractFromVidZee, decryptVidZeeToken };
export default { extractFromVidZee };
