/**
 * Vixsrc streaming provider - WORKING SOLUTION
 * Extracts direct HLS streams from vixsrc.to
 * No ads, no fake buttons - just direct m3u8 URLs
 */

import logger from '../utils/logger.js';

const BASE_URL = 'https://vixsrc.to';
const USER_AGENT = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

/**
 * Extract stream from Vixsrc
 */
async function extractFromVixsrc(tmdbId, type = 'movie', season = null, episode = null) {
  let vixsrcUrl;
  let subtitleApiUrl;

  if (type === 'movie') {
    vixsrcUrl = `${BASE_URL}/movie/${tmdbId}`;
    subtitleApiUrl = `https://sub.wyzie.ru/search?id=${tmdbId}`;
  } else {
    vixsrcUrl = `${BASE_URL}/tv/${tmdbId}/${season}/${episode}`;
    subtitleApiUrl = `https://sub.wyzie.ru/search?id=${tmdbId}&season=${season}&episode=${episode}`;
  }

  logger.info(`[Vixsrc] Fetching: ${vixsrcUrl}`);

  const response = await fetch(vixsrcUrl, {
    headers: {
      'User-Agent': USER_AGENT,
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9',
    },
  });

  if (!response.ok) {
    throw new Error(`Vixsrc returned ${response.status}`);
  }

  const html = await response.text();
  logger.info(`[Vixsrc] HTML length: ${html.length}`);

  let masterPlaylistUrl = null;

  // Method 1: Extract window.masterPlaylist with tokens
  if (html.includes('window.masterPlaylist')) {
    logger.info('[Vixsrc] Found window.masterPlaylist');

    const urlMatch = html.match(/url:\s*['"]([^'"]+)['"]/);
    const tokenMatch = html.match(/['"]?token['"]?\s*:\s*['"]([^'"]+)['"]/);
    const expiresMatch = html.match(/['"]?expires['"]?\s*:\s*['"]([^'"]+)['"]/);

    if (urlMatch && tokenMatch && expiresMatch) {
      const baseUrl = urlMatch[1];
      const token = tokenMatch[1];
      const expires = expiresMatch[1];

      // Construct the master playlist URL
      if (baseUrl.includes('?b=1')) {
        masterPlaylistUrl = `${baseUrl}&token=${token}&expires=${expires}&h=1&lang=en`;
      } else {
        masterPlaylistUrl = `${baseUrl}?token=${token}&expires=${expires}&h=1&lang=en`;
      }

      logger.info(`[Vixsrc] Constructed stream URL: ${masterPlaylistUrl.substring(0, 80)}...`);
    }
  }

  // Method 2: Direct m3u8 URL
  if (!masterPlaylistUrl) {
    const m3u8Match = html.match(/(https?:\/\/[^'"\s]+\.m3u8[^'"\s]*)/);
    if (m3u8Match) {
      masterPlaylistUrl = m3u8Match[1];
      logger.info(`[Vixsrc] Found direct m3u8: ${masterPlaylistUrl.substring(0, 80)}...`);
    }
  }

  // Method 3: Look in scripts
  if (!masterPlaylistUrl) {
    const scriptMatches = html.match(/<script[^>]*>(.*?)<\/script>/gs);
    if (scriptMatches) {
      for (const script of scriptMatches) {
        const streamMatch = script.match(/['"]?(https?:\/\/[^'"\s]+(?:\.m3u8|playlist)[^'"\s]*)/);
        if (streamMatch) {
          masterPlaylistUrl = streamMatch[1];
          logger.info(`[Vixsrc] Found in script: ${masterPlaylistUrl.substring(0, 80)}...`);
          break;
        }
      }
    }
  }

  if (!masterPlaylistUrl) {
    throw new Error('No stream URL found');
  }

  // Fetch subtitles
  let subtitles = [];
  try {
    const subRes = await fetch(subtitleApiUrl, {
      headers: { 'User-Agent': USER_AGENT },
    });
    if (subRes.ok) {
      const subData = await subRes.json();
      // Get English subtitles with good encoding
      const englishSub = subData.find(t =>
        t.display && t.display.includes('English') &&
        ['UTF-8', 'ASCII', 'CP1252'].includes(t.encoding)
      );
      if (englishSub) {
        subtitles.push({ label: 'English', url: englishSub.url });
      }
      // Get French subtitles too
      const frenchSub = subData.find(t =>
        t.display && (t.display.includes('French') || t.display.includes('Français'))
      );
      if (frenchSub) {
        subtitles.push({ label: 'Français', url: frenchSub.url });
      }
    }
  } catch (e) {
    logger.warn(`[Vixsrc] Subtitle fetch failed: ${e.message}`);
  }

  return {
    url: masterPlaylistUrl,
    provider: 'vixsrc',
    format: 'hls',
    quality: '1080p',
    referer: vixsrcUrl,
    subtitles,
    headers: {
      'Referer': vixsrcUrl,
      'User-Agent': USER_AGENT,
    },
  };
}

export { extractFromVixsrc };
export default { extractFromVixsrc };
