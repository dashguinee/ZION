/**
 * DASH WebTV - Fetch ALL Content Script
 *
 * Fetches content from ALL sources and merges into data files:
 * - StarShare (existing) - 74K+ items
 * - FREE IPTV channels (iptv-org) - 8K+ channels
 * - Scraper Zilla - hourly updated content
 * - French VOD (Frembed, VidSrc) - 90K+ movies
 * - PlutoTV, Free-TV, M3U8-Xtream
 *
 * Run: node scripts/fetch-all-content.js
 */

const fs = require('fs');
const path = require('path');

// Backend URL
const BACKEND_URL = process.env.BACKEND_URL || 'https://zion-production-39d8.up.railway.app';

// Data directory
const DATA_DIR = path.join(__dirname, '../data');

// Helper to fetch with timeout
async function fetchWithTimeout(url, timeout = 60000) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);
    return await response.json();
  } catch (error) {
    clearTimeout(timeoutId);
    console.error(`Failed to fetch ${url}:`, error.message);
    return null;
  }
}

// Load existing data file
function loadExistingData(filename) {
  const filepath = path.join(DATA_DIR, filename);
  try {
    const data = fs.readFileSync(filepath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.log(`No existing ${filename}, starting fresh`);
    return [];
  }
}

// Save data file
function saveData(filename, data) {
  const filepath = path.join(DATA_DIR, filename);
  fs.writeFileSync(filepath, JSON.stringify(data, null, 2));
  console.log(`✅ Saved ${filename}: ${Array.isArray(data) ? data.length : Object.keys(data).length} items`);
}

// Deduplicate by URL or stream_id
function deduplicateByKey(items, key = 'stream_id') {
  const seen = new Set();
  return items.filter(item => {
    const value = item[key];
    if (!value || seen.has(value)) return false;
    seen.add(value);
    return true;
  });
}

// Convert FREE channel to StarShare format
function convertFreeChannelToStarshareFormat(channel, categoryId, categoryName) {
  return {
    stream_id: `free_${channel.id || channel.name?.replace(/\s+/g, '_').toLowerCase() || Math.random().toString(36).substr(2, 9)}`,
    name: channel.name,
    stream_icon: channel.logo || '',
    epg_channel_id: channel.id || null,
    added: Math.floor(Date.now() / 1000).toString(),
    category_id: categoryId,
    category_name: categoryName,
    // FREE channel specific
    url: channel.url,
    stream_type: channel.type || 'hls',
    source: channel.source || 'iptv-org',
    is_free: true,
    legal: channel.legal !== false
  };
}

// Convert French VOD movie to StarShare format
function convertFrenchMovieToStarshareFormat(movie, categoryId, categoryName) {
  return {
    stream_id: `french_${movie.id}`,
    name: movie.title,
    stream_icon: movie.poster || '',
    rating: movie.rating?.toString() || '',
    rating_5based: movie.rating ? movie.rating / 2 : 0,
    year: movie.year || '',
    added: Math.floor(Date.now() / 1000).toString(),
    category_id: categoryId,
    category_name: categoryName,
    container_extension: 'embed',
    is_adult: false,
    tmdb_id: movie.id?.toString() || '',
    // Embed specific
    embed_url: movie.embed_url,
    embeds: movie.embeds,
    source: 'frembed+vidsrc',
    is_free: true,
    overview: movie.overview
  };
}

async function main() {
  console.log('🚀 DASH WebTV - Fetching ALL Content\n');
  console.log(`Backend: ${BACKEND_URL}\n`);

  // Load existing data
  console.log('📂 Loading existing StarShare data...');
  let existingMovies = loadExistingData('movies.json');
  let existingSeries = loadExistingData('series.json');
  let existingLive = loadExistingData('live.json');
  let collections = loadExistingData('collections.json');

  console.log(`  Movies: ${existingMovies.length}`);
  console.log(`  Series: ${existingSeries.length}`);
  console.log(`  Live: ${existingLive.length}`);
  console.log();

  // ============================================
  // FETCH FREE LIVE CHANNELS
  // ============================================
  console.log('📡 Fetching FREE IPTV channels...');

  // Fetch from multiple sources
  const freeChannelSources = [
    { name: 'DASH Priority', endpoint: '/api/free/channels' },
    { name: 'All Sports', endpoint: '/api/free/all-sports' },
    { name: 'French Channels', endpoint: '/api/free/french' },
    { name: 'West Africa', endpoint: '/api/free/west-africa' },
    { name: 'Scraper Zilla', endpoint: '/api/free/zilla/combined' },
    { name: 'Free-TV', endpoint: '/api/free/freetv' },
    { name: 'PlutoTV', endpoint: '/api/free/plutotv' }
  ];

  let allFreeChannels = [];

  for (const source of freeChannelSources) {
    console.log(`  Fetching ${source.name}...`);
    const data = await fetchWithTimeout(`${BACKEND_URL}${source.endpoint}`);
    if (data?.channels) {
      console.log(`    ✅ ${data.channels.length} channels`);
      allFreeChannels.push(...data.channels.map(ch => ({
        ...ch,
        _source: source.name
      })));
    } else {
      console.log(`    ⚠️ Failed or empty`);
    }
  }

  // Deduplicate free channels by URL
  const seenUrls = new Set();
  const uniqueFreeChannels = allFreeChannels.filter(ch => {
    if (!ch.url || seenUrls.has(ch.url)) return false;
    seenUrls.add(ch.url);
    return true;
  });

  console.log(`\n  Total unique FREE channels: ${uniqueFreeChannels.length}`);

  // Convert to StarShare format and add new categories
  const freeChannelsConverted = uniqueFreeChannels.map((ch, idx) => {
    // Determine category based on group or source
    let categoryName = 'FREE: ' + (ch.group || ch._source || 'General');
    let categoryId = `free_${categoryName.replace(/[^a-z0-9]/gi, '_').toLowerCase()}`;

    return convertFreeChannelToStarshareFormat(ch, categoryId, categoryName);
  });

  // Merge with existing live channels
  const allLiveChannels = [...existingLive, ...freeChannelsConverted];
  console.log(`  Combined live channels: ${allLiveChannels.length}`);

  // ============================================
  // FETCH FRENCH VOD CONTENT
  // ============================================
  console.log('\n🇫🇷 Fetching French VOD content...');

  let allFrenchMovies = [];

  // Fetch multiple pages of French movies
  for (let page = 1; page <= 50; page++) {
    console.log(`  Fetching French movies page ${page}...`);
    const data = await fetchWithTimeout(`${BACKEND_URL}/api/french-vod/movies?page=${page}`);
    if (data?.movies && data.movies.length > 0) {
      allFrenchMovies.push(...data.movies);
      console.log(`    ✅ ${data.movies.length} movies (total: ${allFrenchMovies.length})`);
    } else {
      console.log(`    Done at page ${page}`);
      break;
    }

    // Small delay to avoid rate limiting
    await new Promise(r => setTimeout(r, 200));
  }

  console.log(`\n  Total French movies: ${allFrenchMovies.length}`);

  // Convert French movies to StarShare format
  const frenchMoviesConverted = allFrenchMovies.map(movie =>
    convertFrenchMovieToStarshareFormat(movie, 'french_cinema', 'FRENCH CINEMA')
  );

  // Merge with existing movies
  const allMovies = [...existingMovies, ...frenchMoviesConverted];
  console.log(`  Combined movies: ${allMovies.length}`);

  // ============================================
  // FETCH FREE MOVIES (M3U8-Xtream)
  // ============================================
  console.log('\n🎬 Fetching FREE movies from M3U8-Xtream...');

  const freeMovieData = await fetchWithTimeout(`${BACKEND_URL}/api/free/movies/all`);
  let freeMovies = [];

  if (freeMovieData?.channels) {
    console.log(`  ✅ ${freeMovieData.channels.length} free movies`);
    freeMovies = freeMovieData.channels.map(movie => ({
      stream_id: `xtream_${movie.id || movie.name?.replace(/\s+/g, '_').toLowerCase() || Math.random().toString(36).substr(2, 9)}`,
      name: movie.name,
      stream_icon: movie.logo || '',
      rating: '',
      rating_5based: 0,
      year: '',
      added: Math.floor(Date.now() / 1000).toString(),
      category_id: 'free_movies_xtream',
      category_name: 'FREE: Movies (TMDB)',
      container_extension: 'hls',
      url: movie.url,
      source: 'm3u8-xtream',
      is_free: true,
      genre: movie.genre || null
    }));
  }

  const allMoviesWithFree = [...allMovies, ...freeMovies];
  console.log(`  Combined movies with free: ${allMoviesWithFree.length}`);

  // ============================================
  // UPDATE COLLECTIONS FOR FRENCH
  // ============================================
  console.log('\n📚 Updating collections...');

  // Add French collection if not exists
  if (!collections.french_cinema) {
    collections.french_cinema = {
      title: "French Cinema",
      description: "Films français - French movies and series",
      icon: "france",
      type: "mixed",
      featured: true,
      priority: 4,
      dynamic: true,
      filter: {
        categories: ["FRENCH", "FRANCE", "FRENCH CINEMA"]
      },
      movies: frenchMoviesConverted.slice(0, 50).map(m => m.stream_id),
      series: []
    };
  }

  // Add FREE content collection
  if (!collections.free_content) {
    collections.free_content = {
      title: "FREE Content",
      description: "Legal free streams - No subscription needed",
      icon: "free",
      type: "mixed",
      featured: true,
      priority: 5,
      movies: freeMovies.slice(0, 30).map(m => m.stream_id),
      series: []
    };
  }

  // ============================================
  // SAVE ALL DATA
  // ============================================
  console.log('\n💾 Saving all data...');

  saveData('live.json', allLiveChannels);
  saveData('movies.json', allMoviesWithFree);
  saveData('collections.json', collections);
  // Series stays the same for now (would need French series API)

  // ============================================
  // SUMMARY
  // ============================================
  console.log('\n========================================');
  console.log('📊 CONTENT SUMMARY');
  console.log('========================================');
  console.log(`Live Channels: ${allLiveChannels.length}`);
  console.log(`  - StarShare: ${existingLive.length}`);
  console.log(`  - FREE IPTV: ${freeChannelsConverted.length}`);
  console.log();
  console.log(`Movies: ${allMoviesWithFree.length}`);
  console.log(`  - StarShare: ${existingMovies.length}`);
  console.log(`  - French VOD: ${frenchMoviesConverted.length}`);
  console.log(`  - FREE Movies: ${freeMovies.length}`);
  console.log();
  console.log(`Series: ${existingSeries.length} (unchanged)`);
  console.log(`Collections: ${Object.keys(collections).length}`);
  console.log('========================================');
  console.log('✅ Done! Deploy to see changes.');
}

main().catch(console.error);
