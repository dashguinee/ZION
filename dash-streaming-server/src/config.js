import dotenv from 'dotenv';

dotenv.config();

// Validate required environment variables
const requiredEnvVars = [
  'STARSHARE_BASE_URL',
  'STARSHARE_USERNAME',
  'STARSHARE_PASSWORD'
];

const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  console.error('\n❌ CRITICAL: Missing required environment variables:');
  missingVars.forEach(varName => console.error(`   - ${varName}`));
  console.error('\nPlease set these variables in your .env file before starting the server.\n');
  process.exit(1);
}

export default {
  // Server
  port: process.env.PORT || 3000,
  env: process.env.NODE_ENV || 'development',

  // Starshare Provider (Shared credentials for all users)
  starshare: {
    baseUrl: process.env.STARSHARE_BASE_URL,
    username: process.env.STARSHARE_USERNAME,
    password: process.env.STARSHARE_PASSWORD
  },

  // Redis
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379'
  },

  // FFmpeg
  ffmpeg: {
    threads: parseInt(process.env.FFMPEG_THREADS) || 4,
    maxQuality: process.env.MAX_QUALITY || '1080p',
    defaultQuality: process.env.DEFAULT_QUALITY || '720p'
  },

  // Cache TTLs (Aggressive caching for bandwidth optimization)
  cache: {
    segmentTTL: parseInt(process.env.SEGMENT_CACHE_TTL) || 2592000, // 30 days (popular content stays cached)
    metadataTTL: parseInt(process.env.METADATA_CACHE_TTL) || 86400, // 24 hours
    liveTokenTTL: parseInt(process.env.LIVE_TOKEN_TTL) || 300, // 5 minutes
    hlsPlaylistTTL: parseInt(process.env.HLS_PLAYLIST_TTL) || 3600 // 1 hour
  },

  // Rate limiting
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW) || 15 * 60 * 1000,
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100
  },

  // Quality presets for transcoding
  qualities: {
    '360p': { width: 640, height: 360, bitrate: '600k' },
    '480p': { width: 854, height: 480, bitrate: '1000k' },
    '720p': { width: 1280, height: 720, bitrate: '2500k' },
    '1080p': { width: 1920, height: 1080, bitrate: '4000k' }
  }
};
