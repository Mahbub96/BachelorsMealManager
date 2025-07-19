const logger = require('./logger');

class MetricsCollector {
  constructor() {
    this.metrics = {
      requests: {
        total: 0,
        byMethod: {},
        byEndpoint: {},
        byStatus: {},
        responseTime: []
      },
      errors: {
        total: 0,
        byType: {},
        byEndpoint: {}
      },
      performance: {
        memory: [],
        cpu: [],
        uptime: 0
      },
      database: {
        queries: 0,
        slowQueries: 0,
        connectionErrors: 0
      },
      business: {
        users: {
          total: 0,
          active: 0,
          newThisMonth: 0
        },
        meals: {
          total: 0,
          pending: 0,
          approved: 0,
          rejected: 0
        },
        bazar: {
          total: 0,
          totalAmount: 0,
          pending: 0,
          approved: 0,
          rejected: 0
        }
      }
    };

    this.startTime = Date.now();
    this.initializeMetrics();
  }

  initializeMetrics() {
    // Initialize method counters
    ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'].forEach(method => {
      this.metrics.requests.byMethod[method] = 0;
    });

    // Initialize status code counters
    [200, 201, 400, 401, 403, 404, 500].forEach(status => {
      this.metrics.requests.byStatus[status] = 0;
    });

    // Start performance monitoring
    this.startPerformanceMonitoring();
  }

  // Request tracking
  trackRequest(method, endpoint, statusCode, responseTime) {
    this.metrics.requests.total++;
    
    // Track by method
    if (this.metrics.requests.byMethod[method]) {
      this.metrics.requests.byMethod[method]++;
    }

    // Track by endpoint
    if (!this.metrics.requests.byEndpoint[endpoint]) {
      this.metrics.requests.byEndpoint[endpoint] = 0;
    }
    this.metrics.requests.byEndpoint[endpoint]++;

    // Track by status
    if (this.metrics.requests.byStatus[statusCode]) {
      this.metrics.requests.byStatus[statusCode]++;
    }

    // Track response time
    this.metrics.requests.responseTime.push(responseTime);

    // Keep only last 1000 response times
    if (this.metrics.requests.responseTime.length > 1000) {
      this.metrics.requests.responseTime.shift();
    }

    logger.debug(`Request tracked: ${method} ${endpoint} - ${statusCode} (${responseTime}ms)`);
  }

  // Error tracking
  trackError(errorType, endpoint, error) {
    this.metrics.errors.total++;

    // Track by type
    if (!this.metrics.errors.byType[errorType]) {
      this.metrics.errors.byType[errorType] = 0;
    }
    this.metrics.errors.byType[errorType]++;

    // Track by endpoint
    if (!this.metrics.errors.byEndpoint[endpoint]) {
      this.metrics.errors.byEndpoint[endpoint] = 0;
    }
    this.metrics.errors.byEndpoint[endpoint]++;

    logger.error(`Error tracked: ${errorType} at ${endpoint}`, error);
  }

  // Database tracking
  trackDatabaseQuery(queryType, duration) {
    this.metrics.database.queries++;

    if (duration > 1000) { // Consider queries over 1 second as slow
      this.metrics.database.slowQueries++;
      logger.warn(`Slow database query detected: ${queryType} took ${duration}ms`);
    }
  }

  trackDatabaseError(error) {
    this.metrics.database.connectionErrors++;
    logger.error('Database error tracked:', error);
  }

  // Performance monitoring
  startPerformanceMonitoring() {
    setInterval(() => {
      const memUsage = process.memoryUsage();
      const cpuUsage = process.cpuUsage();

      this.metrics.performance.memory.push({
        timestamp: Date.now(),
        rss: memUsage.rss,
        heapTotal: memUsage.heapTotal,
        heapUsed: memUsage.heapUsed,
        external: memUsage.external
      });

      this.metrics.performance.cpu.push({
        timestamp: Date.now(),
        user: cpuUsage.user,
        system: cpuUsage.system
      });

      // Keep only last 100 performance records
      if (this.metrics.performance.memory.length > 100) {
        this.metrics.performance.memory.shift();
        this.metrics.performance.cpu.shift();
      }

      this.metrics.performance.uptime = process.uptime();
    }, 60000); // Update every minute
  }

  // Business metrics
  async updateBusinessMetrics() {
    try {
      const User = require('../models/User');
      const Meal = require('../models/Meal');
      const Bazar = require('../models/Bazar');

      // User metrics
      const userStats = await User.getStats();
      this.metrics.business.users = {
        total: userStats.totalUsers || 0,
        active: userStats.activeUsers || 0,
        newThisMonth: userStats.newThisMonth || 0
      };

      // Meal metrics
      const mealStats = await Meal.getStats();
      this.metrics.business.meals = {
        total: mealStats.totalMeals || 0,
        pending: mealStats.pendingCount || 0,
        approved: mealStats.approvedCount || 0,
        rejected: mealStats.rejectedCount || 0
      };

      // Bazar metrics
      const bazarStats = await Bazar.getStats();
      this.metrics.business.bazar = {
        total: bazarStats.totalEntries || 0,
        totalAmount: bazarStats.totalAmount || 0,
        pending: bazarStats.pendingCount || 0,
        approved: bazarStats.approvedCount || 0,
        rejected: bazarStats.rejectedCount || 0
      };

      logger.debug('Business metrics updated');
    } catch (error) {
      logger.error('Failed to update business metrics:', error);
    }
  }

  // Get metrics
  getMetrics() {
    const avgResponseTime = this.metrics.requests.responseTime.length > 0
      ? this.metrics.requests.responseTime.reduce((a, b) => a + b, 0) / this.metrics.requests.responseTime.length
      : 0;

    const p95ResponseTime = this.getPercentile(this.metrics.requests.responseTime, 95);
    const p99ResponseTime = this.getPercentile(this.metrics.requests.responseTime, 99);

    return {
      ...this.metrics,
      calculated: {
        avgResponseTime: Math.round(avgResponseTime),
        p95ResponseTime: Math.round(p95ResponseTime),
        p99ResponseTime: Math.round(p99ResponseTime),
        errorRate: this.metrics.requests.total > 0 
          ? (this.metrics.errors.total / this.metrics.requests.total * 100).toFixed(2)
          : 0,
        requestsPerMinute: this.getRequestsPerMinute(),
        uptime: process.uptime()
      }
    };
  }

  // Get specific metric
  getMetric(path) {
    const keys = path.split('.');
    let value = this.metrics;
    
    for (const key of keys) {
      if (value && typeof value === 'object' && key in value) {
        value = value[key];
      } else {
        return null;
      }
    }
    
    return value;
  }

  // Helper methods
  getPercentile(values, percentile) {
    if (values.length === 0) return 0;
    
    const sorted = [...values].sort((a, b) => a - b);
    const index = Math.ceil((percentile / 100) * sorted.length) - 1;
    return sorted[index] || 0;
  }

  getRequestsPerMinute() {
    const now = Date.now();
    const oneMinuteAgo = now - 60000;
    
    // This is a simplified calculation - in a real implementation,
    // you'd want to track timestamps of individual requests
    return Math.round(this.metrics.requests.total / (process.uptime() / 60));
  }

  // Reset metrics (useful for testing)
  reset() {
    this.metrics = {
      requests: {
        total: 0,
        byMethod: {},
        byEndpoint: {},
        byStatus: {},
        responseTime: []
      },
      errors: {
        total: 0,
        byType: {},
        byEndpoint: {}
      },
      performance: {
        memory: [],
        cpu: [],
        uptime: 0
      },
      database: {
        queries: 0,
        slowQueries: 0,
        connectionErrors: 0
      },
      business: {
        users: {
          total: 0,
          active: 0,
          newThisMonth: 0
        },
        meals: {
          total: 0,
          pending: 0,
          approved: 0,
          rejected: 0
        },
        bazar: {
          total: 0,
          totalAmount: 0,
          pending: 0,
          approved: 0,
          rejected: 0
        }
      }
    };
    
    this.startTime = Date.now();
    this.initializeMetrics();
  }

  // Export metrics for external monitoring systems
  exportForPrometheus() {
    const metrics = this.getMetrics();
    let prometheusMetrics = '';

    // Request metrics
    prometheusMetrics += `# HELP http_requests_total Total number of HTTP requests\n`;
    prometheusMetrics += `# TYPE http_requests_total counter\n`;
    prometheusMetrics += `http_requests_total ${metrics.requests.total}\n`;

    // Response time metrics
    prometheusMetrics += `# HELP http_request_duration_seconds HTTP request duration in seconds\n`;
    prometheusMetrics += `# TYPE http_request_duration_seconds histogram\n`;
    prometheusMetrics += `http_request_duration_seconds{quantile="0.5"} ${metrics.calculated.avgResponseTime / 1000}\n`;
    prometheusMetrics += `http_request_duration_seconds{quantile="0.95"} ${metrics.calculated.p95ResponseTime / 1000}\n`;
    prometheusMetrics += `http_request_duration_seconds{quantile="0.99"} ${metrics.calculated.p99ResponseTime / 1000}\n`;

    // Error metrics
    prometheusMetrics += `# HELP http_errors_total Total number of HTTP errors\n`;
    prometheusMetrics += `# TYPE http_errors_total counter\n`;
    prometheusMetrics += `http_errors_total ${metrics.errors.total}\n`;

    // Memory metrics
    if (metrics.performance.memory.length > 0) {
      const latestMemory = metrics.performance.memory[metrics.performance.memory.length - 1];
      prometheusMetrics += `# HELP process_resident_memory_bytes Resident memory size in bytes\n`;
      prometheusMetrics += `# TYPE process_resident_memory_bytes gauge\n`;
      prometheusMetrics += `process_resident_memory_bytes ${latestMemory.rss}\n`;
    }

    return prometheusMetrics;
  }
}

// Create singleton instance
const metricsCollector = new MetricsCollector();

// Update business metrics every 5 minutes
setInterval(() => {
  metricsCollector.updateBusinessMetrics();
}, 5 * 60 * 1000);

module.exports = metricsCollector; 