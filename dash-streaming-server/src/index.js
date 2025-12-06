import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import config from './config.js';
import logger from './utils/logger.js';
import cacheService from './services/cache.service.js';
import hlsService from './services/hls.service.js';
import bandwidthOptimizer from './services/bandwidth-optimizer.service.js';
import schedulerService from './services/scheduler.service.js';
import { timeout } from './middleware/timeout.js';

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
import packagesRouter from './routes/packages.js';
import walletRouter from './routes/wallet.js';
import xtreamProxyRouter from './routes/xtream-proxy.js';
import healthRouter from './routes/health.js';
import contentHealthService from './services/content-health.service.js';

const app = express();

// ===== RATE LIMITERS =====

// General API rate limiter (100 requests per 15 minutes)
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: { error: 'Too many requests, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.path === '/health' || req.path === '/api/health' // Don't limit health checks
});

// Streaming endpoints rate limiter (10 requests per minute)
const streamLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10,
  message: { error: 'Stream rate limit exceeded, please wait before requesting another stream' },
  standardHeaders: true,
  legacyHeaders: false
});

// Admin endpoints rate limiter (30 requests per 15 minutes)
const adminLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30,
  message: { error: 'Admin API rate limit exceeded' },
  standardHeaders: true,
  legacyHeaders: false
});

// ===== CORS CONFIGURATION =====

const corsOptions = {
  origin: process.env.NODE_ENV === 'production'
    ? [
        'https://dash-webtv.vercel.app',
        'https://dash-webtv-admin.vercel.app',
        process.env.FRONTEND_URL
      ].filter(Boolean)
    : ['http://localhost:3000', 'http://localhost:5173', 'http://localhost:5174'],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-admin-key'],
  credentials: true
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json());

// Request logging
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.url}`);
  next();
});

// Legacy health check (redirect to /api/health)
app.get('/health', (req, res) => {
  res.redirect('/api/health');
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

// API Routes (with rate limiting and timeouts)

// Health endpoint (no rate limit, short timeout)
app.use('/api/health', timeout('5s'), healthRouter);

// Streaming endpoints (rate limited, longer timeout for streaming operations)
app.use('/api/stream', streamLimiter, timeout('30s'), streamRouter);
app.use('/api/live', streamLimiter, timeout('60s'), liveRouter);
app.use('/api/hls', streamLimiter, timeout('30s'), hlsRouter);

// Admin endpoints (stricter rate limit)
app.use('/api/admin', adminLimiter, timeout('10s'), adminRouter);

// General API endpoints (standard rate limit and timeout)
app.use('/api/secure', apiLimiter, timeout('10s'), secureApiRouter);
app.use('/api/free', apiLimiter, timeout('10s'), freeChannelsRouter);
app.use('/api/curated', apiLimiter, timeout('10s'), curatedChannelsRouter);
app.use('/api/iptv-access', apiLimiter, timeout('5s'), iptvAccessRouter);
app.use('/api/french-vod', apiLimiter, timeout('10s'), frenchVodRouter);
app.use('/api/content-health', apiLimiter, timeout('10s'), contentHealthRouter);
app.use('/api/packages', apiLimiter, timeout('10s'), packagesRouter);
app.use('/api/wallet', apiLimiter, timeout('10s'), walletRouter);
app.use('/api/xtream', apiLimiter, timeout('15s'), xtreamProxyRouter);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'DASH Streaming Server',
    version: '3.1.0',
    description: 'Elite Tier streaming server with health monitoring, rate limiting, and session persistence',
    endpoints: {
      // Health & Monitoring
      health: '/api/health',
      healthDetailed: '/api/health/detailed',
      healthReady: '/api/health/ready',
      healthLive: '/api/health/live',
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
      healthReports: '/api/health/admin/reports',
      // Custom Packages (North Star Feature)
      packageCategories: '/api/packages/categories',
      packageGet: '/api/packages/:username',
      packageCreate: 'POST /api/packages/create',
      packageUpdate: 'PUT /api/packages/:username',
      packageDelete: 'DELETE /api/packages/:username',
      // DASH Wallet (North Star Feature)
      walletGet: '/api/wallet/:username',
      walletHistory: '/api/wallet/:username/history',
      walletTopup: 'POST /api/wallet/:username/topup',
      walletDeduct: 'POST /api/wallet/:username/deduct',
      walletSettings: 'PUT /api/wallet/:username/settings',
      walletAdmin: '/api/wallet/admin/all'
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
      logger.info(`🚀 DASH Streaming Server v3.0 (Elite) running on port ${port}`);
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

    // Start automated content health checks (every 30 minutes)
    contentHealthService.startAutomatedChecks(30);
    logger.info(`🏥 Health checks: Automated checks enabled (every 30 min)`);

    // Start billing scheduler (runs daily at midnight)
    schedulerService.start();
    logger.info(`💰 Billing scheduler: Started (daily at midnight)`);

  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully...');
  contentHealthService.stopAutomatedChecks();
  schedulerService.stop();
  await cacheService.disconnect();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully...');
  contentHealthService.stopAutomatedChecks();
  schedulerService.stop();
  await cacheService.disconnect();
  process.exit(0);
});

// Start the server
start();

export default app;
