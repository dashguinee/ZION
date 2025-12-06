/**
 * IPTV Users Service
 * Manages user accounts, tiers, and package access
 *
 * Created: December 5, 2025
 * Author: ZION SYNAPSE for DASH
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import logger from '../utils/logger.js';
import { withFileLock } from '../utils/file-lock.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_FILE = path.join(__dirname, '../../data/iptv-users.json');

class IPTVUsersService {
  constructor() {
    this.data = null;
    this.initialized = false;
    this.init();
  }

  /**
   * Async initialization
   */
  async init() {
    await this.loadData();
    this.initialized = true;
  }

  /**
   * Load data from JSON file (with file locking)
   */
  async loadData() {
    try {
      await withFileLock(DATA_FILE, async () => {
        const raw = fs.readFileSync(DATA_FILE, 'utf-8');
        this.data = JSON.parse(raw);
      });
      logger.info(`IPTV Users: Loaded ${Object.keys(this.data.users).length} users`);
    } catch (error) {
      logger.error('Failed to load IPTV users data:', error.message);
      // Initialize with empty structure
      this.data = { users: {}, packages: {} };
    }
  }

  /**
   * Save data to JSON file (with file locking)
   */
  async saveData() {
    try {
      await withFileLock(DATA_FILE, async () => {
        fs.writeFileSync(DATA_FILE, JSON.stringify(this.data, null, 2));
      });
      logger.info('IPTV Users: Data saved');
      return true;
    } catch (error) {
      logger.error('Failed to save IPTV users data:', error.message);
      return false;
    }
  }

  // ===== USER METHODS =====

  /**
   * Get user by StarShare username
   */
  getUser(username) {
    return this.data.users[username] || null;
  }

  /**
   * Get user's access tier
   */
  getUserTier(username) {
    const user = this.getUser(username);
    if (!user) return null;
    if (user.status !== 'active') return null;
    return user.tier;
  }

  /**
   * Check if user has StarShare access
   */
  hasStarshareAccess(username) {
    const user = this.getUser(username);
    if (!user) return false;
    if (user.status !== 'active') return false;
    return user.starshareEnabled === true;
  }

  /**
   * Get full user access info (for login response)
   */
  getUserAccess(username) {
    const user = this.getUser(username);
    if (!user) {
      return {
        found: false,
        error: 'User not found in DASH system'
      };
    }

    if (user.status !== 'active') {
      return {
        found: true,
        active: false,
        error: 'Account suspended or inactive'
      };
    }

    const pkg = this.data.packages[user.package];

    return {
      found: true,
      active: true,
      username,
      name: user.name,
      package: user.package,
      packageName: pkg?.name || user.package,
      tier: user.tier,
      starshareEnabled: user.starshareEnabled,
      features: pkg?.features || [],
      endpoints: this.getTierEndpoints(user.tier)
    };
  }

  /**
   * Get API endpoints for a tier
   */
  getTierEndpoints(tier) {
    const base = '/api/curated';

    switch (tier) {
      case 'BASIC':
        return {
          channels: `${base}/basic`,
          maxChannels: 50
        };
      case 'STANDARD':
        return {
          channels: `${base}/standard`,
          maxChannels: 200
        };
      case 'PREMIUM':
        return {
          channels: `${base}/premium`,
          sports: '/api/free/all-sports',
          movies: '/api/free/movies/top',
          ultimate: '/api/free/ultimate',
          maxChannels: 'unlimited'
        };
      default:
        return {
          channels: `${base}/basic`,
          maxChannels: 50
        };
    }
  }

  /**
   * Get all users
   */
  getAllUsers() {
    return Object.entries(this.data.users).map(([username, user]) => ({
      username,
      ...user
    }));
  }

  /**
   * Create new user
   */
  createUser(username, userData) {
    if (this.data.users[username]) {
      return { success: false, error: 'Username already exists' };
    }

    const pkg = this.data.packages[userData.package];
    if (!pkg) {
      return { success: false, error: 'Invalid package' };
    }

    this.data.users[username] = {
      name: userData.name,
      whatsapp: userData.whatsapp,
      package: userData.package,
      tier: pkg.tier,
      starshareEnabled: pkg.starshare,
      status: 'active',
      createdAt: new Date().toISOString()
    };

    this.saveData();

    // Return instructions for employee
    const instructions = {
      ourSystem: {
        status: 'DONE',
        username,
        tier: pkg.tier,
        access: this.getTierEndpoints(pkg.tier)
      }
    };

    if (pkg.starshare) {
      instructions.starshare = {
        status: 'MANUAL',
        todo: 'Create account in StarShare panel',
        username: username,
        suggestedPassword: this.generatePassword(),
        package: 'Full Access',
        maxConnections: 2
      };
    }

    return {
      success: true,
      user: this.data.users[username],
      instructions
    };
  }

  /**
   * Update user
   */
  updateUser(username, updates) {
    if (!this.data.users[username]) {
      return { success: false, error: 'User not found' };
    }

    // If package changed, update tier and starshare
    if (updates.package) {
      const pkg = this.data.packages[updates.package];
      if (pkg) {
        updates.tier = pkg.tier;
        updates.starshareEnabled = pkg.starshare;
      }
    }

    this.data.users[username] = {
      ...this.data.users[username],
      ...updates,
      updatedAt: new Date().toISOString()
    };

    this.saveData();

    return { success: true, user: this.data.users[username] };
  }

  /**
   * Suspend user
   */
  suspendUser(username) {
    return this.updateUser(username, { status: 'suspended' });
  }

  /**
   * Activate user
   */
  activateUser(username) {
    return this.updateUser(username, { status: 'active' });
  }

  /**
   * Delete user
   */
  deleteUser(username) {
    if (!this.data.users[username]) {
      return { success: false, error: 'User not found' };
    }

    delete this.data.users[username];
    this.saveData();

    return { success: true };
  }

  // ===== PACKAGE METHODS =====

  /**
   * Get all packages
   */
  getAllPackages() {
    return Object.entries(this.data.packages).map(([id, pkg]) => ({
      id,
      ...pkg
    }));
  }

  /**
   * Get package by ID
   */
  getPackage(packageId) {
    return this.data.packages[packageId] || null;
  }

  // ===== STATS =====

  /**
   * Get system stats
   */
  getStats() {
    const users = Object.values(this.data.users);

    const stats = {
      totalUsers: users.length,
      activeUsers: users.filter(u => u.status === 'active').length,
      suspendedUsers: users.filter(u => u.status === 'suspended').length,
      byPackage: {},
      byTier: {},
      starshareUsers: users.filter(u => u.starshareEnabled).length
    };

    users.forEach(user => {
      stats.byPackage[user.package] = (stats.byPackage[user.package] || 0) + 1;
      stats.byTier[user.tier] = (stats.byTier[user.tier] || 0) + 1;
    });

    return stats;
  }

  // ===== EXPORT (for Notion sync later) =====

  /**
   * Export all users as array (for Notion sync)
   */
  exportUsers() {
    return this.getAllUsers().map(user => ({
      username: user.username,
      name: user.name,
      whatsapp: user.whatsapp,
      package: user.package,
      tier: user.tier,
      starshare: user.starshareEnabled,
      status: user.status,
      createdAt: user.createdAt
    }));
  }

  // ===== HELPERS =====

  /**
   * Generate random password
   */
  generatePassword(length = 8) {
    const chars = 'abcdefghjkmnpqrstuvwxyz23456789';
    let password = '';
    for (let i = 0; i < length; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  }
}

// Singleton export
const iptvUsersService = new IPTVUsersService();
export default iptvUsersService;
