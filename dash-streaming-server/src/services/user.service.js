/**
 * Unified User Service
 * Single source of truth for all user data
 * Merges IPTV users, packages, wallets, and billing
 *
 * Created: December 7, 2025
 * Author: ZION SYNAPSE for DASH WebTV
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import logger from '../utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const USERS_FILE = path.join(__dirname, '../../data/users.json');
const TRANSACTIONS_FILE = path.join(__dirname, '../../data/transactions.json');

// Tier thresholds for package mapping
const TIER_THRESHOLDS = {
  BASIC: { maxCategories: 2, maxPrice: 30000 },
  STANDARD: { maxCategories: 5, maxPrice: 60000 },
  PREMIUM: { maxCategories: Infinity, maxPrice: Infinity }
};

// User schema
const DEFAULT_USER = {
  username: '',
  name: '',
  whatsapp: '',
  tier: 'BASIC',
  package: {
    selectedCategories: [],
    monthlyPrice: 0,
    createdAt: null,
    billingDate: null, // Day of month (1-31)
    nextBillingDate: null
  },
  wallet: {
    balance: 0,
    autoRenew: true,
    lastTopup: null,
    lastDeduction: null
  },
  status: 'active', // active, suspended, inactive
  starshareEnabled: false,
  createdAt: null,
  updatedAt: null
};

class UserService {
  constructor() {
    this.users = [];
    this.transactions = [];
    this.initialized = false;
  }

  /**
   * Initialize data files
   */
  async init() {
    if (this.initialized) return;

    try {
      // Create users file if not exists
      try {
        await fs.access(USERS_FILE);
        const data = await fs.readFile(USERS_FILE, 'utf8');
        this.users = JSON.parse(data);
      } catch {
        await fs.writeFile(USERS_FILE, JSON.stringify([], null, 2));
        this.users = [];
        logger.info('Created users.json file');
      }

      // Create transactions file if not exists
      try {
        await fs.access(TRANSACTIONS_FILE);
        const data = await fs.readFile(TRANSACTIONS_FILE, 'utf8');
        this.transactions = JSON.parse(data);
      } catch {
        await fs.writeFile(TRANSACTIONS_FILE, JSON.stringify([], null, 2));
        this.transactions = [];
        logger.info('Created transactions.json file');
      }

      this.initialized = true;
      logger.info(`User service initialized: ${this.users.length} users, ${this.transactions.length} transactions`);
    } catch (error) {
      logger.error('User service init error:', error);
      throw error;
    }
  }

  /**
   * Save users to file
   */
  async saveUsers() {
    try {
      await fs.writeFile(USERS_FILE, JSON.stringify(this.users, null, 2));
      return true;
    } catch (error) {
      logger.error('Error saving users:', error);
      return false;
    }
  }

  /**
   * Save transactions to file
   */
  async saveTransactions() {
    try {
      await fs.writeFile(TRANSACTIONS_FILE, JSON.stringify(this.transactions, null, 2));
      return true;
    } catch (error) {
      logger.error('Error saving transactions:', error);
      return false;
    }
  }

  /**
   * Determine tier based on package selection
   */
  determineTier(selectedCategories, totalPrice) {
    const categoryCount = selectedCategories.length;

    if (categoryCount <= TIER_THRESHOLDS.BASIC.maxCategories && totalPrice <= TIER_THRESHOLDS.BASIC.maxPrice) {
      return 'BASIC';
    }
    if (categoryCount <= TIER_THRESHOLDS.STANDARD.maxCategories && totalPrice <= TIER_THRESHOLDS.STANDARD.maxPrice) {
      return 'STANDARD';
    }
    return 'PREMIUM';
  }

  /**
   * Get user by username
   */
  getUser(username) {
    return this.users.find(u => u.username === username);
  }

  /**
   * Create or update user
   */
  async createOrUpdateUser(userData) {
    await this.init();

    const existingIndex = this.users.findIndex(u => u.username === userData.username);
    const now = new Date().toISOString();

    if (existingIndex >= 0) {
      // Update existing user
      this.users[existingIndex] = {
        ...this.users[existingIndex],
        ...userData,
        updatedAt: now
      };
      await this.saveUsers();
      return this.users[existingIndex];
    } else {
      // Create new user
      const newUser = {
        ...DEFAULT_USER,
        ...userData,
        createdAt: now,
        updatedAt: now
      };
      this.users.push(newUser);
      await this.saveUsers();
      logger.info(`Created user: ${userData.username}`);
      return newUser;
    }
  }

  /**
   * Update user package
   */
  async updatePackage(username, selectedCategories, monthlyPrice) {
    await this.init();

    const user = this.getUser(username);
    if (!user) {
      throw new Error('User not found');
    }

    const tier = this.determineTier(selectedCategories, monthlyPrice);
    const now = new Date();

    // Calculate billing date (same day next month)
    const billingDate = now.getDate();
    const nextBilling = new Date(now);
    nextBilling.setMonth(nextBilling.getMonth() + 1);

    user.tier = tier;
    user.package = {
      selectedCategories,
      monthlyPrice,
      createdAt: user.package.createdAt || now.toISOString(),
      billingDate,
      nextBillingDate: nextBilling.toISOString()
    };
    user.updatedAt = now.toISOString();

    await this.saveUsers();
    logger.info(`Updated package for ${username}: ${tier} tier, ${monthlyPrice} GNF`);

    return user;
  }

  /**
   * Update wallet balance
   */
  async updateWalletBalance(username, amount, type = 'topup', note = '') {
    await this.init();

    const user = this.getUser(username);
    if (!user) {
      throw new Error('User not found');
    }

    const now = new Date().toISOString();
    const transaction = {
      id: `TXN-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      username,
      type, // topup, deduction, refund
      amount: parseInt(amount),
      balanceBefore: user.wallet.balance,
      balanceAfter: user.wallet.balance + (type === 'deduction' ? -amount : amount),
      note,
      status: 'completed',
      createdAt: now
    };

    // Update balance
    if (type === 'deduction') {
      if (user.wallet.balance < amount) {
        throw new Error('Insufficient balance');
      }
      user.wallet.balance -= parseInt(amount);
      user.wallet.lastDeduction = now;
    } else {
      user.wallet.balance += parseInt(amount);
      user.wallet.lastTopup = now;
    }

    user.updatedAt = now;

    // Save transaction
    this.transactions.push(transaction);
    await this.saveTransactions();
    await this.saveUsers();

    logger.info(`Wallet ${type} for ${username}: ${amount} GNF - New balance: ${user.wallet.balance} GNF`);

    return { user, transaction };
  }

  /**
   * Create pending top-up transaction
   */
  async createPendingTopup(username, amount, paymentMethod = 'mobile_money', note = '') {
    await this.init();

    const user = this.getUser(username);
    if (!user) {
      throw new Error('User not found');
    }

    const now = new Date().toISOString();
    const transaction = {
      id: `TXN-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      username,
      type: 'topup',
      amount: parseInt(amount),
      paymentMethod,
      balanceBefore: user.wallet.balance,
      balanceAfter: user.wallet.balance, // Not updated yet
      note,
      status: 'pending',
      createdAt: now,
      confirmedAt: null,
      confirmedBy: null
    };

    this.transactions.push(transaction);
    await this.saveTransactions();

    logger.info(`Pending top-up created for ${username}: ${amount} GNF`);

    return transaction;
  }

  /**
   * Confirm pending top-up
   */
  async confirmTopup(transactionId, adminUsername = 'system') {
    await this.init();

    const transaction = this.transactions.find(t => t.id === transactionId);
    if (!transaction) {
      throw new Error('Transaction not found');
    }

    if (transaction.status !== 'pending') {
      throw new Error('Transaction is not pending');
    }

    const user = this.getUser(transaction.username);
    if (!user) {
      throw new Error('User not found');
    }

    const now = new Date().toISOString();

    // Update transaction
    transaction.status = 'confirmed';
    transaction.confirmedAt = now;
    transaction.confirmedBy = adminUsername;
    transaction.balanceAfter = user.wallet.balance + transaction.amount;

    // Update user wallet
    user.wallet.balance += transaction.amount;
    user.wallet.lastTopup = now;
    user.updatedAt = now;

    await this.saveTransactions();
    await this.saveUsers();

    logger.info(`Top-up confirmed for ${transaction.username}: ${transaction.amount} GNF by ${adminUsername}`);

    return { user, transaction };
  }

  /**
   * Get pending top-ups
   */
  async getPendingTopups() {
    await this.init();
    return this.transactions.filter(t => t.type === 'topup' && t.status === 'pending');
  }

  /**
   * Get user transaction history
   */
  async getUserTransactions(username, limit = 10) {
    await this.init();
    return this.transactions
      .filter(t => t.username === username)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, limit);
  }

  /**
   * Check if user has access to content category
   */
  hasAccessToCategory(username, categoryId) {
    const user = this.getUser(username);
    if (!user || user.status !== 'active') {
      return false;
    }

    return user.package.selectedCategories.includes(categoryId);
  }

  /**
   * Validate user can stream
   */
  validateStreamAccess(username, categoryId = null) {
    const user = this.getUser(username);

    if (!user) {
      return {
        allowed: false,
        error: 'USER_NOT_FOUND',
        message: 'User not found in system'
      };
    }

    if (user.status === 'suspended') {
      return {
        allowed: false,
        error: 'ACCOUNT_SUSPENDED',
        message: 'Your account is suspended due to insufficient balance',
        requiredAction: 'topup'
      };
    }

    if (user.status !== 'active') {
      return {
        allowed: false,
        error: 'ACCOUNT_INACTIVE',
        message: 'Your account is inactive'
      };
    }

    // Check category access if specified
    if (categoryId && !this.hasAccessToCategory(username, categoryId)) {
      return {
        allowed: false,
        error: 'UPGRADE_REQUIRED',
        message: `Your ${user.tier} package does not include ${categoryId} content`,
        currentTier: user.tier,
        requiredCategory: categoryId,
        upgradeUrl: '/packages'
      };
    }

    return {
      allowed: true,
      user: {
        username: user.username,
        tier: user.tier,
        balance: user.wallet.balance,
        nextBillingDate: user.package.nextBillingDate
      }
    };
  }

  /**
   * Get users due for billing
   */
  async getUsersDueForBilling() {
    await this.init();

    const today = new Date();
    const todayDay = today.getDate();

    return this.users.filter(user => {
      if (user.status !== 'active') return false;
      if (!user.wallet.autoRenew) return false;
      if (!user.package.billingDate) return false;

      // Check if billing date matches today
      return user.package.billingDate === todayDay;
    });
  }

  /**
   * Process monthly billing for a user
   */
  async processBilling(username) {
    await this.init();

    const user = this.getUser(username);
    if (!user) {
      throw new Error('User not found');
    }

    if (!user.package.monthlyPrice) {
      logger.warn(`User ${username} has no package price set`);
      return { success: false, error: 'No package configured' };
    }

    const amount = user.package.monthlyPrice;

    try {
      // Try to deduct from wallet
      const result = await this.updateWalletBalance(
        username,
        amount,
        'deduction',
        'Monthly subscription billing'
      );

      // Update next billing date
      const nextBilling = new Date();
      nextBilling.setMonth(nextBilling.getMonth() + 1);
      user.package.nextBillingDate = nextBilling.toISOString();
      await this.saveUsers();

      logger.info(`✅ Billing successful for ${username}: ${amount} GNF`);

      return {
        success: true,
        user: result.user,
        transaction: result.transaction
      };

    } catch (error) {
      // Insufficient balance - suspend user
      logger.warn(`❌ Billing failed for ${username}: ${error.message}`);

      user.status = 'suspended';
      user.updatedAt = new Date().toISOString();
      await this.saveUsers();

      // Create failed transaction record
      const failedTransaction = {
        id: `TXN-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        username,
        type: 'deduction_failed',
        amount,
        note: `Monthly billing failed: ${error.message}`,
        status: 'failed',
        createdAt: new Date().toISOString()
      };
      this.transactions.push(failedTransaction);
      await this.saveTransactions();

      return {
        success: false,
        error: error.message,
        user,
        suspended: true
      };
    }
  }

  /**
   * Get all users
   */
  async getAllUsers() {
    await this.init();
    return this.users;
  }

  /**
   * Get user statistics
   */
  async getStats() {
    await this.init();

    return {
      totalUsers: this.users.length,
      activeUsers: this.users.filter(u => u.status === 'active').length,
      suspendedUsers: this.users.filter(u => u.status === 'suspended').length,
      totalBalance: this.users.reduce((sum, u) => sum + u.wallet.balance, 0),
      totalRevenue: this.transactions
        .filter(t => t.type === 'deduction' && t.status === 'completed')
        .reduce((sum, t) => sum + t.amount, 0),
      pendingTopups: this.transactions.filter(t => t.type === 'topup' && t.status === 'pending').length,
      tiers: {
        BASIC: this.users.filter(u => u.tier === 'BASIC').length,
        STANDARD: this.users.filter(u => u.tier === 'STANDARD').length,
        PREMIUM: this.users.filter(u => u.tier === 'PREMIUM').length
      }
    };
  }
}

// Export singleton instance
const userService = new UserService();
export default userService;
