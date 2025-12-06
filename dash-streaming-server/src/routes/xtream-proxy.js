/**
 * Xtream API Proxy
 * Proxies player_api.php calls to hide provider URL from client
 */
import { Router } from 'express';
import config from '../config.js';
import logger from '../utils/logger.js';

const router = Router();

/**
 * GET /api/xtream
 * Proxy Xtream player API calls
 *
 * Query params:
 * - username: User's Xtream username
 * - password: User's Xtream password
 * - action: player_api action (get_vod_categories, get_series_info, etc.)
 * - Additional params passed through (category_id, series_id, vod_id, etc.)
 */
router.get('/', async (req, res) => {
  try {
    const { username, password, action, ...otherParams } = req.query;

    // Validate credentials
    if (!username || !password) {
      return res.status(400).json({
        error: 'Missing credentials',
        message: 'Username and password are required'
      });
    }

    // Build Xtream API URL
    const baseUrl = config.starshare.baseUrl;
    const url = new URL(`${baseUrl}/player_api.php`);
    url.searchParams.set('username', username);
    url.searchParams.set('password', password);

    if (action) url.searchParams.set('action', action);

    // Pass through additional params
    Object.keys(otherParams).forEach(key => {
      url.searchParams.set(key, otherParams[key]);
    });

    logger.info(`Xtream proxy: ${action || 'auth'} for user ${username}`);

    // Fetch from Xtream API
    const response = await fetch(url.toString());

    if (!response.ok) {
      logger.error(`Xtream API error: ${response.status}`);
      return res.status(response.status).json({
        error: 'Xtream API error',
        status: response.status
      });
    }

    const data = await response.json();

    // Cache series/vod info for 1 hour to reduce provider calls
    if (action === 'get_series_info' || action === 'get_vod_info') {
      res.setHeader('Cache-Control', 'public, max-age=3600');
    }

    res.json(data);

  } catch (error) {
    logger.error('Xtream proxy error:', error);
    res.status(500).json({
      error: 'Proxy failed',
      message: error.message
    });
  }
});

export default router;
