/**
 * Billing Scheduler Service
 * Automated monthly billing for all active users
 * Runs daily at midnight to check for users due for billing
 *
 * Created: December 7, 2025
 * Author: ZION SYNAPSE for DASH WebTV
 */

import userService from './user.service.js';
import logger from '../utils/logger.js';

class SchedulerService {
  constructor() {
    this.scheduledTask = null;
    this.isRunning = false;
    this.lastRun = null;
    this.stats = {
      totalRuns: 0,
      successfulBillings: 0,
      failedBillings: 0,
      totalRevenue: 0
    };
  }

  /**
   * Start the scheduler
   * Runs daily at midnight (00:00 Africa/Conakry time)
   */
  start() {
    if (this.scheduledTask) {
      logger.warn('Scheduler already running');
      return;
    }

    // Calculate milliseconds until next midnight in Africa/Conakry timezone
    const scheduleNextRun = () => {
      const now = new Date();
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);

      const msUntilMidnight = tomorrow - now;

      this.scheduledTask = setTimeout(async () => {
        await this.runBilling();
        scheduleNextRun(); // Schedule next run
      }, msUntilMidnight);

      const hoursUntil = Math.floor(msUntilMidnight / (60 * 60 * 1000));
      logger.info(`✅ Billing scheduler started - next run in ${hoursUntil} hours`);
    };

    scheduleNextRun();
  }

  /**
   * Stop the scheduler
   */
  stop() {
    if (this.scheduledTask) {
      clearTimeout(this.scheduledTask);
      this.scheduledTask = null;
      logger.info('⏸️ Billing scheduler stopped');
    }
  }

  /**
   * Run billing process for all due users
   */
  async runBilling() {
    if (this.isRunning) {
      logger.warn('Billing already in progress, skipping...');
      return;
    }

    this.isRunning = true;
    const startTime = Date.now();
    const now = new Date();

    logger.info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    logger.info(`🔄 Starting billing run: ${now.toISOString()}`);
    logger.info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    try {
      // Get users due for billing today
      const dueUsers = await userService.getUsersDueForBilling();

      logger.info(`📋 Found ${dueUsers.length} users due for billing today (day ${now.getDate()})`);

      const results = {
        total: dueUsers.length,
        successful: 0,
        failed: 0,
        suspended: 0,
        revenue: 0,
        details: []
      };

      // Process each user
      for (const user of dueUsers) {
        try {
          logger.info(`Processing ${user.username} (${user.package.monthlyPrice} GNF)...`);

          const result = await userService.processBilling(user.username);

          if (result.success) {
            results.successful++;
            results.revenue += user.package.monthlyPrice;
            results.details.push({
              username: user.username,
              amount: user.package.monthlyPrice,
              status: 'success',
              newBalance: result.user.wallet.balance
            });
            logger.info(`  ✅ Success - New balance: ${result.user.wallet.balance} GNF`);
          } else {
            results.failed++;
            if (result.suspended) {
              results.suspended++;
            }
            results.details.push({
              username: user.username,
              amount: user.package.monthlyPrice,
              status: 'failed',
              error: result.error,
              suspended: result.suspended
            });
            logger.warn(`  ❌ Failed: ${result.error}`);
          }

        } catch (error) {
          results.failed++;
          results.details.push({
            username: user.username,
            status: 'error',
            error: error.message
          });
          logger.error(`  ⚠️ Error processing ${user.username}:`, error.message);
        }
      }

      // Update stats
      this.stats.totalRuns++;
      this.stats.successfulBillings += results.successful;
      this.stats.failedBillings += results.failed;
      this.stats.totalRevenue += results.revenue;
      this.lastRun = {
        timestamp: now.toISOString(),
        duration: Date.now() - startTime,
        results
      };

      // Log summary
      logger.info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      logger.info('📊 Billing Summary:');
      logger.info(`   Total: ${results.total}`);
      logger.info(`   ✅ Successful: ${results.successful}`);
      logger.info(`   ❌ Failed: ${results.failed}`);
      logger.info(`   ⏸️ Suspended: ${results.suspended}`);
      logger.info(`   💰 Revenue: ${results.revenue.toLocaleString()} GNF`);
      logger.info(`   ⏱️ Duration: ${Date.now() - startTime}ms`);
      logger.info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

      return this.lastRun;

    } catch (error) {
      logger.error('❌ Billing run failed:', error);
      throw error;
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Get scheduler status
   */
  getStatus() {
    const nextMidnight = new Date();
    nextMidnight.setDate(nextMidnight.getDate() + 1);
    nextMidnight.setHours(0, 0, 0, 0);

    return {
      running: this.scheduledTask !== null,
      processing: this.isRunning,
      lastRun: this.lastRun,
      stats: this.stats,
      nextRun: this.scheduledTask ? nextMidnight.toISOString() : null
    };
  }

  /**
   * Manually trigger billing (for admin/testing)
   */
  async manualRun() {
    logger.info('🔧 Manual billing run triggered');
    return await this.runBilling();
  }

  /**
   * Reset stats
   */
  resetStats() {
    this.stats = {
      totalRuns: 0,
      successfulBillings: 0,
      failedBillings: 0,
      totalRevenue: 0
    };
    logger.info('📊 Stats reset');
  }
}

// Export singleton instance
const schedulerService = new SchedulerService();
export default schedulerService;
