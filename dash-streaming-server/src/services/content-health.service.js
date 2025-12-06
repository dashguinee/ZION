/**
 * Content Health Service - Elite Tier
 * Tracks stream health, user reports, and content status
 *
 * Created: December 6, 2025
 * Author: ZION SYNAPSE for DASH
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import logger from '../utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, '../../data');

// Data files
const HEALTH_FILE = path.join(DATA_DIR, 'content-health.json');
const REPORTS_FILE = path.join(DATA_DIR, 'user-reports.json');
const DUPLICATES_FILE = path.join(DATA_DIR, 'content-duplicates.json');

// Default data structures
const DEFAULT_HEALTH = {
  lastUpdated: null,
  healthChecks: {}, // contentId -> { status, lastChecked, failCount, latency }
  offlineContent: [], // list of confirmed offline content IDs
  degradedContent: [], // list of content with issues but still working
};

const DEFAULT_REPORTS = {
  reports: [], // { id, contentId, contentType, issueType, timestamp, userAgent, resolved }
  stats: {
    totalReports: 0,
    resolvedReports: 0,
    pendingReports: 0,
    topIssueTypes: {}
  }
};

const DEFAULT_DUPLICATES = {
  lastScanned: null,
  duplicateGroups: [], // [{ canonicalId, variants: [{ id, source, quality, language }] }]
  mergeRules: {} // canonicalTitle -> { preferredSource, qualityOrder, fallbackChain }
};

class ContentHealthService {
  constructor() {
    this.healthData = this.loadJSON(HEALTH_FILE, DEFAULT_HEALTH);
    this.reportsData = this.loadJSON(REPORTS_FILE, DEFAULT_REPORTS);
    this.duplicatesData = this.loadJSON(DUPLICATES_FILE, DEFAULT_DUPLICATES);

    // Ensure data directory exists
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  }

  loadJSON(filePath, defaultData) {
    try {
      if (fs.existsSync(filePath)) {
        const data = fs.readFileSync(filePath, 'utf8');
        return JSON.parse(data);
      }
    } catch (error) {
      logger.error(`Error loading ${filePath}:`, error);
    }
    return { ...defaultData };
  }

  saveJSON(filePath, data) {
    try {
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
      return true;
    } catch (error) {
      logger.error(`Error saving ${filePath}:`, error);
      return false;
    }
  }

  // =====================
  // USER REPORTS
  // =====================

  /**
   * Submit a user report for broken/problematic content
   */
  submitReport({ contentId, contentType, contentName, issueType, description, userAgent, username }) {
    const report = {
      id: `report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      contentId: String(contentId),
      contentType, // 'movie', 'series', 'live', 'episode'
      contentName: contentName || 'Unknown',
      issueType, // 'not_playing', 'buffering', 'wrong_content', 'audio_issue', 'subtitle_issue', 'offline', 'other'
      description: description || '',
      timestamp: new Date().toISOString(),
      userAgent: userAgent || 'unknown',
      username: username || 'anonymous',
      resolved: false,
      resolution: null,
      resolvedAt: null
    };

    this.reportsData.reports.unshift(report); // Add to front (newest first)

    // Update stats
    this.reportsData.stats.totalReports++;
    this.reportsData.stats.pendingReports++;
    this.reportsData.stats.topIssueTypes[issueType] =
      (this.reportsData.stats.topIssueTypes[issueType] || 0) + 1;

    // Auto-flag content if it has multiple reports
    const reportsForContent = this.reportsData.reports.filter(
      r => r.contentId === String(contentId) && !r.resolved
    );

    if (reportsForContent.length >= 3) {
      this.flagContentAsDegraded(contentId, contentType, 'Multiple user reports');
    }

    if (reportsForContent.length >= 5) {
      this.flagContentAsOffline(contentId, contentType, 'Too many user reports');
    }

    this.saveJSON(REPORTS_FILE, this.reportsData);

    logger.info(`User report submitted: ${report.id} for ${contentType} ${contentId}`);

    return { success: true, reportId: report.id };
  }

  /**
   * Get pending reports for admin
   */
  getPendingReports(limit = 50) {
    return this.reportsData.reports
      .filter(r => !r.resolved)
      .slice(0, limit);
  }

  /**
   * Get all reports with optional filtering
   */
  getReports({ limit = 50, contentId, issueType, resolved } = {}) {
    let filtered = this.reportsData.reports;

    if (contentId) {
      filtered = filtered.filter(r => r.contentId === String(contentId));
    }
    if (issueType) {
      filtered = filtered.filter(r => r.issueType === issueType);
    }
    if (resolved !== undefined) {
      filtered = filtered.filter(r => r.resolved === resolved);
    }

    return filtered.slice(0, limit);
  }

  /**
   * Resolve a report
   */
  resolveReport(reportId, resolution) {
    const report = this.reportsData.reports.find(r => r.id === reportId);
    if (!report) {
      return { success: false, error: 'Report not found' };
    }

    report.resolved = true;
    report.resolution = resolution; // 'fixed', 'removed', 'cannot_reproduce', 'duplicate', 'wont_fix'
    report.resolvedAt = new Date().toISOString();

    this.reportsData.stats.resolvedReports++;
    this.reportsData.stats.pendingReports--;

    this.saveJSON(REPORTS_FILE, this.reportsData);

    return { success: true };
  }

  /**
   * Get report statistics
   */
  getReportStats() {
    // Group by content to find most reported
    const contentReports = {};
    this.reportsData.reports.forEach(r => {
      if (!r.resolved) {
        const key = `${r.contentType}_${r.contentId}`;
        if (!contentReports[key]) {
          contentReports[key] = {
            contentId: r.contentId,
            contentType: r.contentType,
            contentName: r.contentName,
            count: 0
          };
        }
        contentReports[key].count++;
      }
    });

    const mostReported = Object.values(contentReports)
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return {
      ...this.reportsData.stats,
      mostReported,
      recentReports: this.reportsData.reports.slice(0, 5)
    };
  }

  // =====================
  // HEALTH TRACKING
  // =====================

  /**
   * Update health status for content
   */
  updateHealthStatus(contentId, contentType, status) {
    const key = `${contentType}_${contentId}`;
    const existing = this.healthData.healthChecks[key] || {
      status: 'unknown',
      lastChecked: null,
      failCount: 0,
      successCount: 0,
      latency: null
    };

    if (status.success) {
      existing.status = 'healthy';
      existing.failCount = 0;
      existing.successCount++;
      existing.latency = status.latency || null;

      // Remove from offline/degraded lists
      this.healthData.offlineContent = this.healthData.offlineContent.filter(id => id !== key);
      this.healthData.degradedContent = this.healthData.degradedContent.filter(id => id !== key);
    } else {
      existing.failCount++;
      existing.successCount = 0;

      if (existing.failCount >= 3) {
        existing.status = 'offline';
        if (!this.healthData.offlineContent.includes(key)) {
          this.healthData.offlineContent.push(key);
        }
      } else if (existing.failCount >= 1) {
        existing.status = 'degraded';
        if (!this.healthData.degradedContent.includes(key)) {
          this.healthData.degradedContent.push(key);
        }
      }
    }

    existing.lastChecked = new Date().toISOString();
    this.healthData.healthChecks[key] = existing;
    this.healthData.lastUpdated = new Date().toISOString();

    this.saveJSON(HEALTH_FILE, this.healthData);

    return existing;
  }

  /**
   * Flag content as degraded (issues but still working)
   */
  flagContentAsDegraded(contentId, contentType, reason) {
    const key = `${contentType}_${contentId}`;
    if (!this.healthData.degradedContent.includes(key)) {
      this.healthData.degradedContent.push(key);
      logger.info(`Content flagged as degraded: ${key} - ${reason}`);
    }

    const healthCheck = this.healthData.healthChecks[key] || {};
    healthCheck.status = 'degraded';
    healthCheck.reason = reason;
    healthCheck.flaggedAt = new Date().toISOString();
    this.healthData.healthChecks[key] = healthCheck;

    this.saveJSON(HEALTH_FILE, this.healthData);
  }

  /**
   * Flag content as offline
   */
  flagContentAsOffline(contentId, contentType, reason) {
    const key = `${contentType}_${contentId}`;
    if (!this.healthData.offlineContent.includes(key)) {
      this.healthData.offlineContent.push(key);
      logger.info(`Content flagged as offline: ${key} - ${reason}`);
    }

    // Remove from degraded
    this.healthData.degradedContent = this.healthData.degradedContent.filter(id => id !== key);

    const healthCheck = this.healthData.healthChecks[key] || {};
    healthCheck.status = 'offline';
    healthCheck.reason = reason;
    healthCheck.flaggedAt = new Date().toISOString();
    this.healthData.healthChecks[key] = healthCheck;

    this.saveJSON(HEALTH_FILE, this.healthData);
  }

  /**
   * Get content health status
   */
  getContentHealth(contentId, contentType) {
    const key = `${contentType}_${contentId}`;
    return this.healthData.healthChecks[key] || { status: 'unknown' };
  }

  /**
   * Get all offline content
   */
  getOfflineContent() {
    return this.healthData.offlineContent.map(key => {
      const [type, id] = key.split('_');
      return {
        contentId: id,
        contentType: type,
        ...this.healthData.healthChecks[key]
      };
    });
  }

  /**
   * Get all degraded content
   */
  getDegradedContent() {
    return this.healthData.degradedContent.map(key => {
      const [type, id] = key.split('_');
      return {
        contentId: id,
        contentType: type,
        ...this.healthData.healthChecks[key]
      };
    });
  }

  /**
   * Clear offline flag for content (after fix)
   */
  clearOfflineFlag(contentId, contentType) {
    const key = `${contentType}_${contentId}`;
    this.healthData.offlineContent = this.healthData.offlineContent.filter(id => id !== key);
    this.healthData.degradedContent = this.healthData.degradedContent.filter(id => id !== key);

    if (this.healthData.healthChecks[key]) {
      this.healthData.healthChecks[key].status = 'healthy';
      this.healthData.healthChecks[key].failCount = 0;
    }

    this.saveJSON(HEALTH_FILE, this.healthData);

    return { success: true };
  }

  // =====================
  // DUPLICATE MANAGEMENT
  // =====================

  /**
   * Add a duplicate group (same content from multiple sources)
   */
  addDuplicateGroup(canonicalTitle, variants) {
    // variants: [{ id, source, quality, language, priority }]
    const group = {
      id: `dup_${Date.now()}`,
      canonicalTitle,
      canonicalId: variants[0]?.id, // First variant is canonical
      variants: variants.map((v, idx) => ({
        ...v,
        priority: v.priority || idx,
        isCanonical: idx === 0
      })),
      createdAt: new Date().toISOString()
    };

    this.duplicatesData.duplicateGroups.push(group);
    this.saveJSON(DUPLICATES_FILE, this.duplicatesData);

    return group;
  }

  /**
   * Get fallback chain for content (if it has duplicates)
   */
  getFallbackChain(contentId) {
    const group = this.duplicatesData.duplicateGroups.find(
      g => g.variants.some(v => String(v.id) === String(contentId))
    );

    if (!group) return null;

    // Return variants sorted by priority, excluding the current one
    return group.variants
      .filter(v => String(v.id) !== String(contentId))
      .sort((a, b) => a.priority - b.priority);
  }

  /**
   * Get canonical version of content (best quality/source)
   */
  getCanonicalVersion(contentId) {
    const group = this.duplicatesData.duplicateGroups.find(
      g => g.variants.some(v => String(v.id) === String(contentId))
    );

    if (!group) return null;

    return group.variants.find(v => v.isCanonical) || group.variants[0];
  }

  /**
   * Check if content is a duplicate (non-canonical version)
   */
  isDuplicate(contentId) {
    const group = this.duplicatesData.duplicateGroups.find(
      g => g.variants.some(v => String(v.id) === String(contentId))
    );

    if (!group) return false;

    const variant = group.variants.find(v => String(v.id) === String(contentId));
    return variant && !variant.isCanonical;
  }

  /**
   * Get all duplicate groups
   */
  getDuplicateGroups() {
    return this.duplicatesData.duplicateGroups;
  }

  // =====================
  // HEALTH DASHBOARD
  // =====================

  /**
   * Get full health dashboard data
   */
  getDashboardData() {
    return {
      lastUpdated: this.healthData.lastUpdated,
      summary: {
        totalHealthChecks: Object.keys(this.healthData.healthChecks).length,
        offlineCount: this.healthData.offlineContent.length,
        degradedCount: this.healthData.degradedContent.length,
        healthyCount: Object.values(this.healthData.healthChecks)
          .filter(h => h.status === 'healthy').length
      },
      reports: this.getReportStats(),
      offlineContent: this.getOfflineContent().slice(0, 20),
      degradedContent: this.getDegradedContent().slice(0, 20),
      duplicateGroups: this.duplicatesData.duplicateGroups.length
    };
  }
}

export default new ContentHealthService();
