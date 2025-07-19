const NodeCache = require('node-cache');
const logger = require('./logger');

/**
 * Advanced Caching System
 * Implements best practices for API caching
 */
class CacheManager {
  constructor() {
    this.cache = new NodeCache({
      stdTTL: 300, // 5 minutes default
      checkperiod: 600, // Check for expired keys every 10 minutes
      useClones: false, // Better performance
      deleteOnExpire: true,
    });

    // Cache statistics
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
    };

    // Set up event listeners
    this.setupEventListeners();
  }

  /**
   * Set up cache event listeners
   */
  setupEventListeners() {
    this.cache.on('set', (key, value) => {
      this.stats.sets++;
      logger.debug('Cache set', {
        key,
        valueSize: JSON.stringify(value).length,
      });
    });

    this.cache.on('del', (key, value) => {
      this.stats.deletes++;
      logger.debug('Cache delete', { key });
    });

    this.cache.on('expired', (key, value) => {
      logger.debug('Cache expired', { key });
    });

    this.cache.on('flush', () => {
      logger.info('Cache flushed');
    });
  }

  /**
   * Get value from cache
   */
  get(key) {
    const value = this.cache.get(key);
    if (value !== undefined) {
      this.stats.hits++;
      logger.debug('Cache hit', { key });
      return value;
    } else {
      this.stats.misses++;
      logger.debug('Cache miss', { key });
      return null;
    }
  }

  /**
   * Set value in cache
   */
  set(key, value, ttl = 300) {
    const success = this.cache.set(key, value, ttl);
    if (success) {
      logger.debug('Cache set successful', { key, ttl });
    }
    return success;
  }

  /**
   * Delete value from cache
   */
  del(key) {
    const deleted = this.cache.del(key);
    if (deleted > 0) {
      logger.debug('Cache delete successful', { key });
    }
    return deleted > 0;
  }

  /**
   * Check if key exists in cache
   */
  has(key) {
    return this.cache.has(key);
  }

  /**
   * Get cache statistics
   */
  getStats() {
    const cacheStats = this.cache.getStats();
    return {
      ...this.stats,
      ...cacheStats,
      hitRate: this.stats.hits / (this.stats.hits + this.stats.misses) || 0,
    };
  }

  /**
   * Clear all cache
   */
  flush() {
    this.cache.flushAll();
    this.stats = { hits: 0, misses: 0, sets: 0, deletes: 0 };
    logger.info('Cache flushed and stats reset');
  }

  /**
   * Get multiple keys at once
   */
  mget(keys) {
    return this.cache.mget(keys);
  }

  /**
   * Set multiple keys at once
   */
  mset(keyValuePairs, ttl = 300) {
    const pairs = keyValuePairs.map(([key, value]) => [key, value, ttl]);
    return this.cache.mset(pairs);
  }

  /**
   * Cache middleware for Express routes
   */
  middleware(ttl = 300, keyGenerator = null) {
    return (req, res, next) => {
      // Skip caching for non-GET requests
      if (req.method !== 'GET') {
        return next();
      }

      // Generate cache key
      const cacheKey = keyGenerator
        ? keyGenerator(req)
        : `${req.method}:${req.originalUrl}:${JSON.stringify(req.query)}:${req.user?.id || 'anonymous'}`;

      // Try to get from cache
      const cachedResponse = this.get(cacheKey);
      if (cachedResponse) {
        return res.json(cachedResponse);
      }

      // Store original send method
      const originalSend = res.json;

      // Override send method to cache response
      res.json = function (data) {
        // Cache the response
        cacheManager.set(cacheKey, data, ttl);

        // Call original send method
        return originalSend.call(this, data);
      };

      next();
    };
  }

  /**
   * Cache invalidation patterns
   */
  invalidatePattern(pattern) {
    const keys = this.cache.keys();
    const matchingKeys = keys.filter(key => key.includes(pattern));

    matchingKeys.forEach(key => this.del(key));

    logger.info('Cache invalidated by pattern', {
      pattern,
      keysCount: matchingKeys.length,
    });
    return matchingKeys.length;
  }

  /**
   * Cache warming for frequently accessed data
   */
  async warmCache(warmingFunctions) {
    logger.info('Starting cache warming...');

    const results = [];
    for (const [name, fn] of Object.entries(warmingFunctions)) {
      try {
        const data = await fn();
        const key = `warm:${name}`;
        this.set(key, data, 3600); // 1 hour TTL for warmed cache
        results.push({ name, success: true });
        logger.debug('Cache warmed', { name });
      } catch (error) {
        results.push({ name, success: false, error: error.message });
        logger.error('Cache warming failed', { name, error: error.message });
      }
    }

    logger.info('Cache warming completed', { results });
    return results;
  }

  /**
   * Memory usage monitoring
   */
  getMemoryUsage() {
    const stats = this.cache.getStats();
    return {
      keys: stats.keys,
      hits: stats.hits,
      misses: stats.misses,
      keyCount: stats.ksize,
      valueCount: stats.vsize,
    };
  }
}

// Create singleton instance
const cacheManager = new CacheManager();

/**
 * Cache decorator for functions
 */
const cacheable = (ttl = 300, keyGenerator = null) => {
  return (target, propertyName, descriptor) => {
    const method = descriptor.value;

    descriptor.value = async function (...args) {
      const cacheKey = keyGenerator
        ? keyGenerator(...args)
        : `${target.constructor.name}:${propertyName}:${JSON.stringify(args)}`;

      // Try to get from cache
      const cached = cacheManager.get(cacheKey);
      if (cached) {
        return cached;
      }

      // Execute method and cache result
      const result = await method.apply(this, args);
      cacheManager.set(cacheKey, result, ttl);

      return result;
    };

    return descriptor;
  };
};

/**
 * Cache invalidation decorator
 */
const cacheInvalidate = pattern => {
  return (target, propertyName, descriptor) => {
    const method = descriptor.value;

    descriptor.value = async function (...args) {
      const result = await method.apply(this, args);

      // Invalidate cache after method execution
      cacheManager.invalidatePattern(pattern);

      return result;
    };

    return descriptor;
  };
};

module.exports = {
  cacheManager,
  cacheable,
  cacheInvalidate,
  CacheManager,
};
