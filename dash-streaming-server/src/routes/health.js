/**
 * Health Check API Routes
 * Comprehensive health monitoring for DASH WebTV backend
 *
 * Created: December 7, 2025
 * Author: ZION SYNAPSE for DASH
 */

import express from 'express';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { exec } from 'child_process';
import { promisify } from 'util';
import logger from '../utils/logger.js';
import cacheService from '../services/cache.service.js';
import { getLockStats } from '../utils/file-lock.js';

const execAsync = promisify(exec);
const router = express.Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * GET /api/health
 * Main health check endpoint
 */
router.get('/', async (req, res) => {
  const startTime = Date.now();

  try {
    const [dataCheck, redisCheck, ffmpegCheck] = await Promise.all([
      checkDataFiles(),
      checkRedis(),
      checkFfmpeg()
    ]);

    const health = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      responseTime: Date.now() - startTime,
      server: {
        environment: process.env.NODE_ENV || 'development',
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch
      },
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
        rss: Math.round(process.memoryUsage().rss / 1024 / 1024),
        unit: 'MB'
      },
      checks: {
        dataFiles: dataCheck,
        redis: redisCheck,
        ffmpeg: ffmpegCheck
      },
      fileLocks: getLockStats()
    };

    // Determine overall status
    const allHealthy = Object.values(health.checks).every(c => c.status === 'ok');
    health.status = allHealthy ? 'ok' : 'degraded';

    const statusCode = allHealthy ? 200 : 503;
    res.status(statusCode).json(health);
  } catch (error) {
    logger.error('Health check error:', error);
    res.status(500).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
});

/**
 * GET /api/health/detailed
 * Detailed health check with more diagnostics
 */
router.get('/detailed', async (req, res) => {
  try {
    const [dataCheck, redisCheck, ffmpegCheck, diskCheck] = await Promise.all([
      checkDataFiles(),
      checkRedis(),
      checkFfmpeg(),
      checkDiskSpace()
    ]);

    const health = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: {
        seconds: Math.floor(process.uptime()),
        formatted: formatUptime(process.uptime())
      },
      server: {
        environment: process.env.NODE_ENV || 'development',
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch,
        pid: process.pid
      },
      memory: {
        heapUsed: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        heapTotal: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
        rss: Math.round(process.memoryUsage().rss / 1024 / 1024),
        external: Math.round(process.memoryUsage().external / 1024 / 1024),
        unit: 'MB'
      },
      checks: {
        dataFiles: dataCheck,
        redis: redisCheck,
        ffmpeg: ffmpegCheck,
        disk: diskCheck
      },
      fileLocks: getLockStats(),
      cpu: process.cpuUsage()
    };

    const allHealthy = Object.values(health.checks).every(c => c.status === 'ok');
    health.status = allHealthy ? 'ok' : 'degraded';

    const statusCode = allHealthy ? 200 : 503;
    res.status(statusCode).json(health);
  } catch (error) {
    logger.error('Detailed health check error:', error);
    res.status(500).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
});

/**
 * GET /api/health/ready
 * Readiness probe (for k8s/docker)
 */
router.get('/ready', async (req, res) => {
  try {
    const dataCheck = await checkDataFiles();
    const ready = dataCheck.status === 'ok';

    if (ready) {
      res.status(200).json({ status: 'ready' });
    } else {
      res.status(503).json({ status: 'not ready', reason: dataCheck.message });
    }
  } catch (error) {
    res.status(503).json({ status: 'not ready', error: error.message });
  }
});

/**
 * GET /api/health/live
 * Liveness probe (for k8s/docker)
 */
router.get('/live', (req, res) => {
  res.status(200).json({ status: 'alive' });
});

// ===== HEALTH CHECK FUNCTIONS =====

/**
 * Check if data files are accessible
 */
async function checkDataFiles() {
  try {
    const dataDir = path.join(__dirname, '../../data');
    const requiredFiles = ['iptv-users.json', 'sessions.json'];

    const checks = await Promise.all(
      requiredFiles.map(async (file) => {
        try {
          await fs.access(path.join(dataDir, file));
          return { file, accessible: true };
        } catch {
          return { file, accessible: false };
        }
      })
    );

    const allAccessible = checks.every(c => c.accessible);
    const missing = checks.filter(c => !c.accessible).map(c => c.file);

    return {
      status: allAccessible ? 'ok' : 'error',
      message: allAccessible ? 'All data files accessible' : `Missing files: ${missing.join(', ')}`,
      files: checks
    };
  } catch (error) {
    return {
      status: 'error',
      message: error.message
    };
  }
}

/**
 * Check Redis connection
 */
async function checkRedis() {
  try {
    const connected = cacheService.connected;
    return {
      status: connected ? 'ok' : 'warning',
      message: connected ? 'Redis connected' : 'Redis disconnected (using fallback)',
      connected
    };
  } catch (error) {
    return {
      status: 'warning',
      message: 'Redis check failed (non-critical)',
      error: error.message
    };
  }
}

/**
 * Check FFmpeg availability
 */
async function checkFfmpeg() {
  try {
    const { stdout } = await execAsync('ffmpeg -version');
    const version = stdout.split('\n')[0];
    return {
      status: 'ok',
      message: 'FFmpeg available',
      version: version.replace('ffmpeg version ', '').split(' ')[0]
    };
  } catch (error) {
    return {
      status: 'error',
      message: 'FFmpeg not available',
      error: error.message
    };
  }
}

/**
 * Check disk space
 */
async function checkDiskSpace() {
  try {
    const { stdout } = await execAsync('df -h . | tail -1');
    const parts = stdout.trim().split(/\s+/);
    const usedPercent = parseInt(parts[4]);

    return {
      status: usedPercent < 90 ? 'ok' : 'warning',
      message: `Disk ${usedPercent}% used`,
      size: parts[1],
      used: parts[2],
      available: parts[3],
      usedPercent: `${usedPercent}%`
    };
  } catch (error) {
    return {
      status: 'warning',
      message: 'Could not check disk space',
      error: error.message
    };
  }
}

/**
 * Format uptime in human-readable format
 */
function formatUptime(seconds) {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  const parts = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  if (secs > 0 || parts.length === 0) parts.push(`${secs}s`);

  return parts.join(' ');
}

export default router;
