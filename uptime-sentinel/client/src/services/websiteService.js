import { apiService } from './api';

class WebsiteService {
  constructor() {
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
    this.statsCache = new Map();
    this.statsCacheTimeout = 2 * 60 * 1000; // 2 minutes for stats
  }

  // Cache key generators
  getCacheKey(type, params = {}) {
    return `${type}_${JSON.stringify(params)}`;
  }

  // Check if cache entry is valid
  isCacheValid(cacheEntry) {
    return cacheEntry && Date.now() - cacheEntry.timestamp < this.cacheTimeout;
  }

  isStatsCacheValid(cacheEntry) {
    return cacheEntry && Date.now() - cacheEntry.timestamp < this.statsCacheTimeout;
  }

  // Get all websites with caching
  async getWebsites(options = {}) {
    const { forceRefresh = false } = options;
    const cacheKey = this.getCacheKey('websites');
    
    if (!forceRefresh) {
      const cached = this.cache.get(cacheKey);
      if (this.isCacheValid(cached)) {
        return cached.data;
      }
    }

    try {
      const websites = await apiService.getWebsites();
      
      // Cache the result
      this.cache.set(cacheKey, {
        data: websites,
        timestamp: Date.now()
      });

      return websites;
    } catch (error) {
      // If cache exists and API fails, return cached data
      const cached = this.cache.get(cacheKey);
      if (cached) {
        console.warn('API failed, returning cached data:', error.message);
        return cached.data;
      }
      throw error;
    }
  }

  // Get paginated ping history
  async getPingHistory(websiteId, options = {}) {
    const { 
      page = 1, 
      limit = 50, 
      sortBy = 'timestamp', 
      sortOrder = 'desc',
      status = null,
      dateRange = null,
      forceRefresh = false
    } = options;

    const params = { page, limit, sortBy, sortOrder, status, dateRange };
    const cacheKey = this.getCacheKey(`ping_history_${websiteId}`, params);
    
    if (!forceRefresh) {
      const cached = this.cache.get(cacheKey);
      if (this.isCacheValid(cached)) {
        return cached.data;
      }
    }

    try {
      // Build query parameters
      const queryParams = {
        sortBy,
        sortOrder,
        limit: limit.toString()
      };

      if (status) queryParams.status = status;
      if (dateRange) {
        queryParams.filterDate = dateRange;
      }

      const result = await apiService.getPingHistory(websiteId, queryParams);
      
      // Cache the result
      this.cache.set(cacheKey, {
        data: result,
        timestamp: Date.now()
      });

      return result;
    } catch (error) {
      const cached = this.cache.get(cacheKey);
      if (cached) {
        console.warn('Ping history API failed, returning cached data:', error.message);
        return cached.data;
      }
      throw error;
    }
  }

  // Get dashboard statistics with caching
  async getDashboardStats(options = {}) {
    const { forceRefresh = false } = options;
    const cacheKey = this.getCacheKey('dashboard_stats');
    
    if (!forceRefresh) {
      const cached = this.statsCache.get(cacheKey);
      if (this.isStatsCacheValid(cached)) {
        return cached.data;
      }
    }

    try {
      const websites = await this.getWebsites({ forceRefresh });
      
      const stats = this.calculateDashboardStats(websites);
      
      // Cache with shorter timeout for stats
      this.statsCache.set(cacheKey, {
        data: stats,
        timestamp: Date.now()
      });

      return stats;
    } catch (error) {
      const cached = this.statsCache.get(cacheKey);
      if (cached) {
        console.warn('Dashboard stats calculation failed, returning cached data:', error.message);
        return cached.data;
      }
      throw error;
    }
  }

  // Calculate dashboard statistics
  calculateDashboardStats(websites) {
    if (!websites || websites.length === 0) {
      return {
        totalWebsites: 0,
        activeWebsites: 0,
        totalPingsToday: 0,
        averageUptime: 0,
        averageResponseTime: 0,
        websitesByStatus: {
          up: 0,
          down: 0,
          warning: 0,
          paused: 0
        }
      };
    }

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    let totalPingsToday = 0;
    let totalUptime = 0;
    let totalResponseTime = 0;
    let uptimeCount = 0;
    let responseTimeCount = 0;

    const websitesByStatus = {
      up: 0,
      down: 0,
      warning: 0,
      paused: 0
    };

    websites.forEach(website => {
      // Count by status
      websitesByStatus[website.status] = (websitesByStatus[website.status] || 0) + 1;

      // Count pings today
      if (website.lastChecked && new Date(website.lastChecked) >= todayStart) {
        totalPingsToday++;
      }

      // Calculate uptime percentage
      if (website.totalChecks > 0) {
        const uptime = ((website.totalChecks - website.totalFailures) / website.totalChecks) * 100;
        totalUptime += uptime;
        uptimeCount++;
      }

      // Calculate average response time
      if (website.averageResponseTime > 0) {
        totalResponseTime += website.averageResponseTime;
        responseTimeCount++;
      }
    });

    return {
      totalWebsites: websites.length,
      activeWebsites: websites.filter(w => w.status !== 'paused').length,
      totalPingsToday,
      averageUptime: uptimeCount > 0 ? (totalUptime / uptimeCount) : 0,
      averageResponseTime: responseTimeCount > 0 ? (totalResponseTime / responseTimeCount) : 0,
      websitesByStatus
    };
  }

  // Get website by ID with caching
  async getWebsiteById(id, options = {}) {
    const { forceRefresh = false } = options;
    const cacheKey = this.getCacheKey(`website_${id}`);
    
    if (!forceRefresh) {
      const cached = this.cache.get(cacheKey);
      if (this.isCacheValid(cached)) {
        return cached.data;
      }
    }

    try {
      const website = await apiService.getWebsiteById(id);
      
      this.cache.set(cacheKey, {
        data: website,
        timestamp: Date.now()
      });

      return website;
    } catch (error) {
      const cached = this.cache.get(cacheKey);
      if (cached) {
        console.warn('Website API failed, returning cached data:', error.message);
        return cached.data;
      }
      throw error;
    }
  }

  // Add website with cache invalidation
  async addWebsite(websiteData) {
    try {
      const result = await apiService.addWebsite(websiteData);
      
      // Invalidate relevant caches
      this.invalidateCache(['websites', 'dashboard_stats']);
      
      return result;
    } catch (error) {
      throw error;
    }
  }

  // Delete website with cache invalidation
  async deleteWebsite(id) {
    try {
      const result = await apiService.deleteWebsite(id);
      
      // Invalidate relevant caches
      this.invalidateCache(['websites', 'dashboard_stats', `website_${id}`]);
      
      return result;
    } catch (error) {
      throw error;
    }
  }

  // Pause/Resume website with cache invalidation
  async pauseWebsite(id) {
    try {
      const result = await apiService.pauseWebsite(id);
      
      // Invalidate relevant caches
      this.invalidateCache(['websites', 'dashboard_stats', `website_${id}`]);
      
      return result;
    } catch (error) {
      throw error;
    }
  }

  async resumeWebsite(id) {
    try {
      const result = await apiService.resumeWebsite(id);
      
      // Invalidate relevant caches
      this.invalidateCache(['websites', 'dashboard_stats', `website_${id}`]);
      
      return result;
    } catch (error) {
      throw error;
    }
  }

  // Cache invalidation
  invalidateCache(keys) {
    keys.forEach(keyPattern => {
      if (keyPattern.includes('*')) {
        // Handle wildcard patterns
        const pattern = keyPattern.replace('*', '');
        for (const [key] of this.cache) {
          if (key.includes(pattern)) {
            this.cache.delete(key);
          }
        }
        for (const [key] of this.statsCache) {
          if (key.includes(pattern)) {
            this.statsCache.delete(key);
          }
        }
      } else {
        // Exact key match
        this.cache.delete(keyPattern);
        this.statsCache.delete(keyPattern);
      }
    });
  }

  // Clear all cache
  clearCache() {
    this.cache.clear();
    this.statsCache.clear();
  }

  // Get cache statistics
  getCacheStats() {
    const now = Date.now();
    let validEntries = 0;
    let expiredEntries = 0;

    for (const [key, entry] of this.cache) {
      if (now - entry.timestamp < this.cacheTimeout) {
        validEntries++;
      } else {
        expiredEntries++;
      }
    }

    return {
      totalEntries: this.cache.size,
      validEntries,
      expiredEntries,
      hitRatio: validEntries / (validEntries + expiredEntries) || 0
    };
  }

  // Prefetch commonly used data
  async prefetchDashboardData() {
    try {
      // Prefetch websites and stats in parallel
      const [websites] = await Promise.allSettled([
        this.getWebsites(),
        this.getDashboardStats()
      ]);

      return { success: true, websites: websites.value };
    } catch (error) {
      console.warn('Prefetch failed:', error.message);
      return { success: false, error: error.message };
    }
  }
}

export const websiteService = new WebsiteService();
export default websiteService;
