/**
 * CURATED CHANNELS SERVICE - Controlled Access & Smart Curation
 *
 * This service provides:
 * 1. Tiered access control (Basic, Standard, Premium)
 * 2. Smart curation from 38K+ sources
 * 3. Category-based organization
 * 4. Quality filtering
 * 5. Dynamic updates from iptv-org + Scraper Zilla
 *
 * Created: December 2025
 * Author: ZION SYNAPSE for DASH
 */

import freeIPTVService from './free-iptv.service.js';
import logger from '../utils/logger.js';
import cacheService from './cache.service.js';

class CuratedChannelsService {
  constructor() {
    // Access tier definitions
    this.tiers = {
      BASIC: {
        name: 'Basic',
        maxChannels: 50,
        categories: ['news', 'guinea'],
        includeVOD: false,
        quality: ['sd', 'hd'],
        description: 'Free tier - Guinea + News channels'
      },
      STANDARD: {
        name: 'Standard',
        maxChannels: 200,
        categories: ['news', 'sports', 'entertainment', 'guinea', 'west-africa', 'french'],
        includeVOD: true,
        vodLimit: 100,
        quality: ['sd', 'hd'],
        description: 'Standard subscription - West Africa + Sports'
      },
      PREMIUM: {
        name: 'Premium',
        maxChannels: null, // Unlimited
        categories: 'all',
        includeVOD: true,
        vodLimit: null,
        quality: ['sd', 'hd', '4k'],
        description: 'Premium - Full access to all content'
      }
    };

    // Priority channels - ALWAYS include these (hand-picked quality)
    this.priorityChannels = {
      guinea: [
        { id: 'rtg-guinea', name: 'RTG', keywords: ['rtg', 'radiodiffusion', 'guinee'] },
        { id: 'espace-tv', name: 'Espace TV', keywords: ['espace'] },
        { id: 'kalac-tv', name: 'Kalac TV', keywords: ['kalac'] }
      ],
      sports: [
        { id: 'africa24-sport', name: 'Africa 24 Sport', keywords: ['africa24', 'africa 24 sport'] },
        { id: 'afrosport', name: 'AfroSport', keywords: ['afrosport', 'afro sport'] },
        { id: 'bein-sports', name: 'beIN Sports', keywords: ['bein'] },
        { id: 'supersport', name: 'SuperSport', keywords: ['supersport'] },
        { id: 'canal-sport', name: 'Canal+ Sport', keywords: ['canal+', 'canal sport'] }
      ],
      news: [
        { id: 'france24-fr', name: 'France 24 FR', keywords: ['france 24', 'france24'] },
        { id: 'africa24', name: 'Africa 24', keywords: ['africa 24', 'africa24'] },
        { id: 'tv5monde', name: 'TV5Monde', keywords: ['tv5', 'tv5monde'] },
        { id: 'euronews-fr', name: 'Euronews FR', keywords: ['euronews'] },
        { id: 'rfi', name: 'RFI', keywords: ['rfi'] }
      ],
      entertainment: [
        { id: 'trace-africa', name: 'Trace Africa', keywords: ['trace'] },
        { id: 'novelas-tv', name: 'Novelas TV', keywords: ['novelas'] },
        { id: 'nollywood', name: 'Nollywood', keywords: ['nollywood'] }
      ]
    };

    // Blocked/blacklisted channels (inappropriate, broken, or problematic)
    this.blocklist = new Set([
      // Add channel IDs or keywords to block
    ]);

    // Cache settings
    this.cacheTTL = 1800; // 30 minutes for curated lists
  }

  /**
   * Check if a channel matches priority criteria
   */
  isPriorityChannel(channel, category) {
    const priorities = this.priorityChannels[category] || [];
    const nameLower = (channel.name || '').toLowerCase();

    return priorities.some(p =>
      p.keywords.some(k => nameLower.includes(k.toLowerCase()))
    );
  }

  /**
   * Check if channel is blocked
   */
  isBlocked(channel) {
    if (this.blocklist.has(channel.id)) return true;
    const nameLower = (channel.name || '').toLowerCase();
    return Array.from(this.blocklist).some(b => nameLower.includes(b.toLowerCase()));
  }

  /**
   * Score a channel for quality/relevance
   */
  scoreChannel(channel, userRegion = 'guinea') {
    let score = 0;

    // Priority channels get highest score
    Object.keys(this.priorityChannels).forEach(cat => {
      if (this.isPriorityChannel(channel, cat)) {
        score += 100;
      }
    });

    // Regional relevance
    const nameLower = (channel.name || '').toLowerCase();
    const groupLower = (channel.group || '').toLowerCase();

    if (nameLower.includes('guinea') || nameLower.includes('guinee') || nameLower.includes('conakry')) {
      score += 50;
    }
    if (nameLower.includes('africa') || groupLower.includes('africa')) {
      score += 30;
    }
    if (nameLower.includes('france') || channel.languages?.includes('fra')) {
      score += 20;
    }

    // Quality indicators
    if (channel.logo) score += 5;
    if (channel.type === 'hls') score += 10; // HLS usually more reliable

    return score;
  }

  /**
   * Filter and sort channels by category
   */
  filterByCategory(channels, category) {
    const categoryKeywords = {
      sports: ['sport', 'football', 'soccer', 'tennis', 'basketball', 'boxing', 'ufc', 'f1', 'racing', 'bein', 'supersport', 'espn', 'dazn', 'canal+ sport'],
      news: ['news', 'info', 'actualite', 'journal', 'cnn', 'bbc', 'france 24', 'euronews', 'al jazeera', 'dw', 'rfi'],
      entertainment: ['entertainment', 'divertissement', 'music', 'musique', 'trace', 'mtv', 'vh1', 'comedy', 'drama', 'novelas'],
      movies: ['movie', 'film', 'cinema', 'action', 'paramount', 'hbo', 'amc', 'tcm', 'canal+ cinema'],
      kids: ['kids', 'enfant', 'cartoon', 'disney', 'nick', 'boomerang', 'tiji'],
      guinea: ['guinea', 'guinee', 'conakry', 'rtg', 'espace tv', 'kalac'],
      'west-africa': ['senegal', 'ivory', 'mali', 'nigeria', 'ghana', 'burkina', 'togo', 'benin', 'africa'],
      french: [] // Filter by language instead
    };

    const keywords = categoryKeywords[category] || [];

    if (category === 'french') {
      // Filter by French language
      return channels.filter(ch =>
        ch.languages?.includes('fra') ||
        ch.languages?.includes('French') ||
        (ch.name || '').toLowerCase().includes('france')
      );
    }

    if (keywords.length === 0) return channels;

    return channels.filter(ch => {
      const nameLower = (ch.name || '').toLowerCase();
      const groupLower = (ch.group || '').toLowerCase();
      const categories = (ch.categories || []).map(c => c.toLowerCase());

      return keywords.some(k =>
        nameLower.includes(k) ||
        groupLower.includes(k) ||
        categories.some(c => c.includes(k))
      );
    });
  }

  /**
   * Get curated channels for a specific tier
   */
  async getChannelsForTier(tier = 'BASIC', options = {}) {
    const tierConfig = this.tiers[tier.toUpperCase()];
    if (!tierConfig) {
      throw new Error(`Invalid tier: ${tier}`);
    }

    const cacheKey = `curated:${tier}:${JSON.stringify(options)}`;

    try {
      // Check cache
      const cached = await cacheService.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }

      logger.info(`Building curated list for tier: ${tier}`);

      // Get base channels from all sources
      let allChannels = [];

      if (tierConfig.categories === 'all') {
        // Premium gets everything
        allChannels = await freeIPTVService.getMegaList();
      } else {
        // Get channels for allowed categories
        const categoryPromises = tierConfig.categories.map(async cat => {
          if (cat === 'guinea') {
            return freeIPTVService.getChannelsByCountry('gn');
          } else if (cat === 'west-africa') {
            return freeIPTVService.getWestAfricanChannels();
          } else if (cat === 'french') {
            return freeIPTVService.getFrenchChannels();
          } else if (cat === 'sports') {
            return freeIPTVService.getAllSports();
          } else {
            return freeIPTVService.getAPIChannelsByCategory(cat);
          }
        });

        const results = await Promise.all(categoryPromises);

        // Flatten and deduplicate
        const seen = new Set();
        results.forEach(channels => {
          channels.forEach(ch => {
            if (ch.url && !seen.has(ch.url) && !this.isBlocked(ch)) {
              seen.add(ch.url);
              allChannels.push(ch);
            }
          });
        });
      }

      // Filter blocked channels
      allChannels = allChannels.filter(ch => !this.isBlocked(ch));

      // Score and sort channels
      const scored = allChannels.map(ch => ({
        ...ch,
        score: this.scoreChannel(ch),
        tier: tier
      }));

      scored.sort((a, b) => b.score - a.score);

      // Apply limit if tier has one
      let result = tierConfig.maxChannels
        ? scored.slice(0, tierConfig.maxChannels)
        : scored;

      // Organize by category for UI
      const organized = {
        tier: tierConfig.name,
        description: tierConfig.description,
        totalChannels: result.length,
        categories: {},
        all: result
      };

      // Group by category
      const categoryGroups = ['sports', 'news', 'entertainment', 'movies', 'guinea', 'french'];
      categoryGroups.forEach(cat => {
        organized.categories[cat] = this.filterByCategory(result, cat);
      });

      // Cache result
      await cacheService.set(cacheKey, JSON.stringify(organized), this.cacheTTL);

      logger.info(`Curated ${result.length} channels for ${tier} tier`);
      return organized;

    } catch (error) {
      logger.error(`Error getting channels for ${tier}:`, error.message);
      throw error;
    }
  }

  /**
   * Get channels for BASIC tier
   */
  async getBasicChannels() {
    return this.getChannelsForTier('BASIC');
  }

  /**
   * Get channels for STANDARD tier
   */
  async getStandardChannels() {
    return this.getChannelsForTier('STANDARD');
  }

  /**
   * Get channels for PREMIUM tier
   */
  async getPremiumChannels() {
    return this.getChannelsForTier('PREMIUM');
  }

  /**
   * Get channels by category (respects tier limits)
   */
  async getCategoryChannels(category, tier = 'PREMIUM') {
    const tierData = await this.getChannelsForTier(tier);
    return tierData.categories[category] || [];
  }

  /**
   * Search curated channels
   */
  async searchChannels(query, tier = 'PREMIUM') {
    const tierData = await this.getChannelsForTier(tier);
    const queryLower = query.toLowerCase();

    return tierData.all.filter(ch => {
      const nameLower = (ch.name || '').toLowerCase();
      const groupLower = (ch.group || '').toLowerCase();
      return nameLower.includes(queryLower) || groupLower.includes(queryLower);
    });
  }

  /**
   * Get tier configuration
   */
  getTierConfig(tier) {
    return this.tiers[tier.toUpperCase()] || null;
  }

  /**
   * Get all tier configurations
   */
  getAllTiers() {
    return this.tiers;
  }

  /**
   * Add channel to blocklist
   */
  blockChannel(channelId) {
    this.blocklist.add(channelId);
    logger.info(`Blocked channel: ${channelId}`);
  }

  /**
   * Remove channel from blocklist
   */
  unblockChannel(channelId) {
    this.blocklist.delete(channelId);
    logger.info(`Unblocked channel: ${channelId}`);
  }

  /**
   * Get curated stats
   */
  async getStats() {
    const [basic, standard, premium] = await Promise.all([
      this.getChannelsForTier('BASIC'),
      this.getChannelsForTier('STANDARD'),
      this.getChannelsForTier('PREMIUM')
    ]);

    return {
      tiers: {
        basic: {
          totalChannels: basic.totalChannels,
          categories: Object.keys(basic.categories).reduce((acc, cat) => {
            acc[cat] = basic.categories[cat].length;
            return acc;
          }, {})
        },
        standard: {
          totalChannels: standard.totalChannels,
          categories: Object.keys(standard.categories).reduce((acc, cat) => {
            acc[cat] = standard.categories[cat].length;
            return acc;
          }, {})
        },
        premium: {
          totalChannels: premium.totalChannels,
          categories: Object.keys(premium.categories).reduce((acc, cat) => {
            acc[cat] = premium.categories[cat].length;
            return acc;
          }, {})
        }
      },
      blockedChannels: this.blocklist.size,
      lastUpdated: new Date().toISOString()
    };
  }
}

// Singleton export
const curatedChannelsService = new CuratedChannelsService();
export default curatedChannelsService;
