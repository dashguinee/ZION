/**
 * MP4Hydra Provider - Direct MP4 Downloads
 *
 * API: mp4hydra.org/info2?v=8
 * Format: FormData with slug/type/season/episode
 * Returns: Direct MP4 URLs with subtitles
 *
 * Servers: Beta, Beta#3
 */

import logger from '../utils/logger.js';

const USER_AGENT = 'Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36';
const TMDB_API_KEY = process.env.TMDB_API_KEY || '632e644be9521013bdac3661ae65494e';

/**
 * Generate URL slug from title
 */
function generateSlug(title) {
  return title.toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

/**
 * Get movie/TV details from TMDB
 */
async function getTMDBDetails(tmdbId, type) {
  try {
    const endpoint = type === 'movie'
      ? `https://api.themoviedb.org/3/movie/${tmdbId}?api_key=${TMDB_API_KEY}`
      : `https://api.themoviedb.org/3/tv/${tmdbId}?api_key=${TMDB_API_KEY}`;

    const response = await fetch(endpoint);
    if (!response.ok) return null;

    const data = await response.json();

    if (type === 'movie') {
      return {
        title: data.title,
        original_title: data.original_title,
        year: data.release_date ? data.release_date.split('-')[0] : null,
        slug: generateSlug(data.title)
      };
    } else {
      return {
        title: data.name,
        original_title: data.original_name,
        year: data.first_air_date ? data.first_air_date.split('-')[0] : null,
        slug: generateSlug(data.name)
      };
    }
  } catch (e) {
    logger.error(`[MP4Hydra] TMDB fetch error: ${e.message}`);
    return null;
  }
}

/**
 * Query MP4Hydra API with a specific slug
 */
async function queryMP4Hydra(slug, type, season, episode) {
  const formData = new URLSearchParams();
  formData.append('v', '8');
  formData.append('z', JSON.stringify([{
    s: slug,
    t: type,
    se: season,
    ep: episode
  }]));

  const response = await fetch('https://mp4hydra.org/info2?v=8', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': USER_AGENT,
      'Accept': '*/*',
      'Origin': 'https://mp4hydra.org',
      'Referer': `https://mp4hydra.org/${type}/${slug}`
    },
    body: formData.toString(),
    timeout: 10000
  });

  if (!response.ok) return null;
  return response.json();
}

/**
 * Process playlist items into streams
 */
function processPlaylist(playlist, servers, details, type, season, episode) {
  const streams = [];
  const serverConfig = [
    { name: 'Beta', number: '#1' },
    { name: 'Beta#3', number: '#2' }
  ];

  // For TV shows, find specific episode
  let items = playlist;
  if (type === 'tv' && season && episode) {
    const paddedSeason = String(season).padStart(2, '0');
    const paddedEpisode = String(episode).padStart(2, '0');
    const seasonEpisode = `S${paddedSeason}E${paddedEpisode}`;

    const targetEpisode = playlist.find(item =>
      item.title && item.title.toUpperCase() === seasonEpisode.toUpperCase()
    );

    if (!targetEpisode) {
      logger.debug(`[MP4Hydra] Episode ${seasonEpisode} not found`);
      return [];
    }

    items = [targetEpisode];
  }

  // Process each server
  for (const server of serverConfig) {
    const baseServer = servers[server.name];
    if (!baseServer) continue;

    for (const item of items) {
      const videoUrl = `${baseServer}${item.src}`;
      const quality = item.quality || item.label || '720p';

      // Build stream object
      const stream = {
        url: videoUrl,
        provider: 'mp4hydra',
        server: `MP4Hydra ${server.number}`,
        quality,
        format: 'mp4',
        headers: {
          'Referer': 'https://mp4hydra.org/'
        }
      };

      // Add subtitles if available
      if (item.subs && item.subs.length > 0) {
        stream.subtitles = item.subs.map(sub => ({
          label: sub.label,
          url: `${baseServer}${sub.src}`
        }));
      }

      streams.push(stream);
    }
  }

  return streams;
}

/**
 * Extract streams from MP4Hydra
 * @param {string} tmdbId - TMDB ID
 * @param {string} type - 'movie' or 'tv'
 * @param {number} season - Season number (for TV)
 * @param {number} episode - Episode number (for TV)
 * @returns {Promise<Array>} Array of stream objects
 */
async function extractFromMP4Hydra(tmdbId, type = 'movie', season = null, episode = null) {
  logger.info(`[MP4Hydra] Extracting streams for ${type} ${tmdbId}`);

  // Get TMDB details for slug generation
  const details = await getTMDBDetails(tmdbId, type);
  if (!details) {
    logger.warn(`[MP4Hydra] Could not get TMDB details for ${tmdbId}`);
    return [];
  }

  logger.info(`[MP4Hydra] Title: ${details.title} (${details.year})`);

  // Try different slug formats
  const slugFormats = [];

  // movie-name-year format (most common)
  if (type === 'movie' && details.year) {
    slugFormats.push(`${details.slug}-${details.year}`);
  }

  // movie-name only
  slugFormats.push(details.slug);

  // Original title variations
  if (details.original_title && details.original_title !== details.title) {
    const originalSlug = generateSlug(details.original_title);
    if (type === 'movie' && details.year) {
      slugFormats.push(`${originalSlug}-${details.year}`);
    }
    slugFormats.push(originalSlug);
  }

  // Try each slug format
  for (const slug of slugFormats) {
    logger.debug(`[MP4Hydra] Trying slug: ${slug}`);

    try {
      const data = await queryMP4Hydra(slug, type, season, episode);

      if (data && data.playlist && data.playlist.length > 0 && data.servers) {
        logger.info(`[MP4Hydra] Found ${data.playlist.length} items with slug: ${slug}`);

        const streams = processPlaylist(data.playlist, data.servers, details, type, season, episode);

        if (streams.length > 0) {
          logger.info(`[MP4Hydra] Extracted ${streams.length} streams`);
          return streams;
        }
      }
    } catch (e) {
      logger.debug(`[MP4Hydra] Slug ${slug} failed: ${e.message}`);
    }
  }

  logger.warn(`[MP4Hydra] No streams found for ${details.title}`);
  return [];
}

export { extractFromMP4Hydra, generateSlug };
export default { extractFromMP4Hydra };
