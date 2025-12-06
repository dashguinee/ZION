import express from 'express';
import cors from 'cors';
import config from './config.js';
import logger from './utils/logger.js';
import cacheService from './services/cache.service.js';
import hlsService from './services/hls.service.js';
import bandwidthOptimizer from './services/bandwidth-optimizer.service.js';

// Import routes
import streamRouter from './routes/stream.js';
import liveRouter from './routes/live.js';
import hlsRouter from './routes/hls.js';
import secureApiRouter from './routes/secure-api.js';
import freeChannelsRouter from './routes/free-channels.js';
import curatedChannelsRouter from './routes/curated-channels.js';
import adminRouter from './routes/admin.js';
import iptvAccessRouter from './routes/iptv-access.js';
import frenchVodRouter from './routes/french-vod.js';
import contentHealthRouter from './routes/content-health.js';

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Request logging
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.url}`);
  next();
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'DASH Streaming Server',
    version: '1.0.0',
    redis: cacheService.connected,
    timestamp: new Date().toISOString()
  });
});

// Bandwidth optimization stats
app.get('/api/stats/bandwidth', async (req, res) => {
  try {
    const report = await bandwidthOptimizer.getBandwidthReport();
    res.json({
      success: true,
      ...report,
      cachingStrategy: {
        segmentTTL: config.cache.segmentTTL + 's (30 days)',
        popularityThreshold: '10 views = aggressive caching',
        estimatedSavings: '50-70% bandwidth reduction'
      }
    });
  } catch (error) {
    logger.error('Bandwidth stats error:', error);
    res.status(500).json({ error: error.message });
  }
});

// API Routes
app.use('/api/stream', streamRouter);
app.use('/api/live', liveRouter);
app.use('/api/hls', hlsRouter);
app.use('/api/secure', secureApiRouter);  // Secure API - hides provider details
app.use('/api/free', freeChannelsRouter);  // Free IPTV channels (iptv-org + direct)
app.use('/api/curated', curatedChannelsRouter);  // Curated channels with tier-based access
app.use('/api/admin', adminRouter);  // Admin panel API
app.use('/api/iptv-access', iptvAccessRouter);  // User access check (for customer app)
app.use('/api/french-vod', frenchVodRouter);  // French VOD (Frembed, VidSrc embeds)
app.use('/api/health', contentHealthRouter);  // Content health, user reports, duplicates (Elite Tier)

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'DASH Streaming Server',
    version: '3.0.0',
    description: 'Elite Tier streaming server with health monitoring, user reports, and fallback system',
    endpoints: {
      // Secure API (recommended - hides provider)
      categories: '/api/secure/categories/:type',
      content: '/api/secure/content/:type',
      info: '/api/secure/info/:type/:id',
      playMovie: '/api/secure/play/movie/:id',
      playEpisode: '/api/secure/play/episode/:id',
      playLive: '/api/secure/play/live/:id',
      // Curated Channels (TIERED ACCESS)
      curatedBasic: '/api/curated/basic',
      curatedStandard: '/api/curated/standard',
      curatedPremium: '/api/curated/premium',
      curatedTiers: '/api/curated/tiers',
      curatedStats: '/api/curated/stats',
      curatedCategory: '/api/curated/category/:name?tier=PREMIUM',
      curatedSearch: '/api/curated/search?q=:query&tier=PREMIUM',
      // Free IPTV (raw sources)
      freeChannels: '/api/free/channels',
      freeMega: '/api/free/mega',
      freeAllSports: '/api/free/all-sports',
      freeZillaCombined: '/api/free/zilla/combined',
      freeApiChannels: '/api/free/api/channels',
      freeApiStreams: '/api/free/api/streams',
      // Legacy (direct FFmpeg)
      vod: '/api/stream/vod/:id?quality=720p',
      series: '/api/stream/episode/:episodeId',
      live: '/api/live/:streamId',
      hls: '/api/hls/:streamId/master.m3u8',
      // Admin & Access Control
      adminStats: '/api/admin/stats',
      adminUsers: '/api/admin/users',
      adminPackages: '/api/admin/packages',
      iptvAccess: '/api/iptv-access/:username',
      // French VOD (NEW - 24K+ French movies)
      frenchVodStats: '/api/french-vod/stats',
      frenchMovies: '/api/french-vod/movies',
      frenchSeries: '/api/french-vod/series',
      frenchSearch: '/api/french-vod/search?q=:query',
      frenchMovieDetail: '/api/french-vod/movie/:id',
      frenchEmbed: '/api/french-vod/embed/movie/:id',
      // Content Health & Reporting (Elite Tier)
      healthReport: '/api/health/report',
      healthStatus: '/api/health/status/:type/:id',
      healthFallback: '/api/health/fallback/:type/:id',
      healthOffline: '/api/health/offline',
      healthDashboard: '/api/health/admin/dashboard',
      healthReports: '/api/health/admin/reports'
    },
    qualities: Object.keys(config.qualities),
    formats: ['mp4', 'hls']
  });
});

// Error handling
app.use((err, req, res, next) => {
  logger.error('Server error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: config.env === 'development' ? err.message : undefined
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Start server
async function start() {
  try {
    // Connect to Redis
    logger.info('Connecting to Redis...');
    await cacheService.connect();

    // Initialize HLS storage
    logger.info('Initializing HLS storage...');
    await hlsService.init();

    // Start Express server
    const port = config.port;
    app.listen(port, () => {
      logger.info(`🚀 DASH Streaming Server v2.3 running on port ${port}`);
      logger.info(`📺 Environment: ${config.env}`);
      logger.info(`🔒 Secure API: /api/secure/* (provider hidden)`);
      logger.info(`📺 Free IPTV: /api/free/* (iptv-org + direct)`);
      logger.info(`👤 Admin API: /api/admin/* (user management)`);
      logger.info(`🎫 Access API: /api/iptv-access/* (tier check)`);
      logger.info(`🔴 Redis: ${cacheService.connected ? 'Connected' : 'Disconnected'}`);
      logger.info(`\n✨ Ready to stream! Try: http://localhost:${port}/health\n`);
    });

    // Cleanup old HLS files every 6 hours
    setInterval(() => {
      hlsService.cleanupOldStreams(24);
    }, 6 * 60 * 60 * 1000);

  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully...');
  await cacheService.disconnect();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully...');
  await cacheService.disconnect();
  process.exit(0);
});

// Start the server
start();

export default app;
