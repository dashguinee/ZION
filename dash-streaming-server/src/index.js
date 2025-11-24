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

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'DASH Streaming Server',
    version: '1.0.0',
    description: 'FFmpeg-powered streaming server with HLS support',
    endpoints: {
      vod: '/api/stream/vod/:id?quality=720p&format=mp4',
      series: '/api/stream/series/:id/:season/:episode?quality=720p&format=mp4',
      live: '/api/live/:streamId',
      hls: '/api/hls/:streamId/master.m3u8'
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
      logger.info(`🚀 DASH Streaming Server running on port ${port}`);
      logger.info(`📺 Environment: ${config.env}`);
      logger.info(`🎬 Starshare Provider: ${config.starshare.baseUrl}`);
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
