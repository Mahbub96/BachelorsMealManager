const express = require('express');
const router = express.Router();
const AuthMiddleware = require('../middleware/auth');
const metricsCollector = require('../utils/metrics');
const backupManager = require('../utils/backup');
const { checkDatabaseHealth, getDatabaseStats } = require('../config/database');
const { config, isProduction } = require('../config/config');
const logger = require('../utils/logger');

// @desc    Get system health status
// @route   GET /api/monitoring/health
// @access  Private (Admin only)
router.get(
  '/health',
  AuthMiddleware.protect(),
  AuthMiddleware.requireAdmin(),
  async (req, res, next) => {
    try {
      const healthStatus = {
        success: true,
        timestamp: new Date().toISOString(),
        system: {
          uptime: process.uptime(),
          memory: process.memoryUsage(),
          cpu: process.cpuUsage(),
          platform: process.platform,
          nodeVersion: process.version,
          pid: process.pid,
        },
        database: await checkDatabaseHealth(),
        application: {
          environment: config.server.nodeEnv,
          version: process.env.npm_package_version || '1.0.0',
          apiPrefix: config.server.apiPrefix,
          apiVersion: config.server.apiVersion,
        },
      };

      // Check if any component is unhealthy
      if (!healthStatus.database.connected) {
        healthStatus.success = false;
        healthStatus.status = 'unhealthy';
      } else {
        healthStatus.status = 'healthy';
      }

      const statusCode = healthStatus.success ? 200 : 503;
      res.status(statusCode).json(healthStatus);
    } catch (error) {
      next(error);
    }
  }
);

// @desc    Get system metrics
// @route   GET /api/monitoring/metrics
// @access  Private (Admin only)
router.get(
  '/metrics',
  AuthMiddleware.protect(),
  AuthMiddleware.requireAdmin(),
  async (req, res, next) => {
    try {
      const metrics = metricsCollector.getMetrics();

      res.status(200).json({
        success: true,
        data: metrics,
      });
    } catch (error) {
      next(error);
    }
  }
);

// @desc    Get Prometheus metrics
// @route   GET /api/monitoring/metrics/prometheus
// @access  Public
router.get('/metrics/prometheus', (req, res) => {
  try {
    const prometheusMetrics = metricsCollector.exportForPrometheus();

    res.set('Content-Type', 'text/plain');
    res.status(200).send(prometheusMetrics);
  } catch (error) {
    logger.error('Failed to export Prometheus metrics:', error);
    res.status(500).send('# Error generating metrics\n');
  }
});

// @desc    Get database statistics
// @route   GET /api/monitoring/database
// @access  Private (Admin only)
router.get(
  '/database',
  AuthMiddleware.protect(),
  AuthMiddleware.requireAdmin(),
  async (req, res, next) => {
    try {
      const dbHealth = await checkDatabaseHealth();
      const dbStats = await getDatabaseStats();

      res.status(200).json({
        success: true,
        data: {
          health: dbHealth,
          statistics: dbStats,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

// @desc    Get backup information
// @route   GET /api/monitoring/backups
// @access  Private (Admin only)
router.get(
  '/backups',
  AuthMiddleware.protect(),
  AuthMiddleware.requireAdmin(),
  async (req, res, next) => {
    try {
      const backups = await backupManager.listBackups();
      const stats = await backupManager.getBackupStats();

      res.status(200).json({
        success: true,
        data: {
          backups,
          statistics: stats,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

// @desc    Create backup
// @route   POST /api/monitoring/backups
// @access  Private (Admin only)
router.post(
  '/backups',
  AuthMiddleware.protect(),
  AuthMiddleware.requireAdmin(),
  async (req, res, next) => {
    try {
      const { type = 'full' } = req.body;

      let backupResult;
      switch (type) {
        case 'database':
          backupResult = await backupManager.createDatabaseBackup();
          break;
        case 'files':
          backupResult = await backupManager.createFileBackup();
          break;
        case 'full':
        default:
          backupResult = await backupManager.createFullBackup();
          break;
      }

      res.status(201).json({
        success: true,
        message: `${type} backup created successfully`,
        data: backupResult,
      });
    } catch (error) {
      next(error);
    }
  }
);

// @desc    Restore from backup
// @route   POST /api/monitoring/backups/:fileName/restore
// @access  Private (Admin only)
router.post(
  '/backups/:fileName/restore',
  AuthMiddleware.protect(),
  AuthMiddleware.requireAdmin(),
  async (req, res, next) => {
    try {
      const { fileName } = req.params;
      const { confirm } = req.body;

      if (!confirm) {
        return res.status(400).json({
          success: false,
          error: 'Confirmation required for restore operation',
        });
      }

      const restoreResult = await backupManager.restoreDatabase(fileName);

      res.status(200).json({
        success: true,
        message: 'Database restored successfully',
        data: restoreResult,
      });
    } catch (error) {
      next(error);
    }
  }
);

// @desc    Verify backup
// @route   GET /api/monitoring/backups/:fileName/verify
// @access  Private (Admin only)
router.get(
  '/backups/:fileName/verify',
  AuthMiddleware.protect(),
  AuthMiddleware.requireAdmin(),
  async (req, res, next) => {
    try {
      const { fileName } = req.params;
      const verifyResult = await backupManager.verifyBackup(fileName);

      res.status(200).json({
        success: true,
        data: verifyResult,
      });
    } catch (error) {
      next(error);
    }
  }
);

// @desc    Get system configuration
// @route   GET /api/monitoring/config
// @access  Private (Admin only)
router.get(
  '/config',
  AuthMiddleware.protect(),
  AuthMiddleware.requireAdmin(),
  (req, res) => {
    try {
      // Only return non-sensitive configuration
      const safeConfig = {
        server: {
          port: config.server.port,
          nodeEnv: config.server.nodeEnv,
          apiPrefix: config.server.apiPrefix,
          apiVersion: config.server.apiVersion,
        },
        clustering: config.clustering,
        security: {
          enabled: config.security.enabled,
          bcryptRounds: config.security.bcryptRounds,
          rateLimitMaxRequests: config.security.rateLimitMaxRequests,
        },
        cors: config.cors,
        upload: config.upload,
        logging: config.logging,
        performance: config.performance,
        monitoring: config.monitoring,
        pagination: config.pagination,
        cache: config.cache,
        features: config.features,
        business: config.business,
      };

      res.status(200).json({
        success: true,
        data: safeConfig,
      });
    } catch (error) {
      next(error);
    }
  }
);

// @desc    Get system logs
// @route   GET /api/monitoring/logs
// @access  Private (Admin only)
router.get(
  '/logs',
  AuthMiddleware.protect(),
  AuthMiddleware.requireAdmin(),
  (req, res, next) => {
    try {
      const { level = 'info', limit = 100 } = req.query;

      // This is a simplified log retrieval
      // In a real implementation, you'd want to read from log files
      const logs = {
        message: 'Log retrieval not implemented in this version',
        level,
        limit: parseInt(limit),
      };

      res.status(200).json({
        success: true,
        data: logs,
      });
    } catch (error) {
      next(error);
    }
  }
);

// @desc    Reset metrics
// @route   POST /api/monitoring/metrics/reset
// @access  Private (Admin only)
router.post(
  '/metrics/reset',
  AuthMiddleware.protect(),
  AuthMiddleware.requireAdmin(),
  (req, res, next) => {
    try {
      metricsCollector.reset();

      res.status(200).json({
        success: true,
        message: 'Metrics reset successfully',
      });
    } catch (error) {
      next(error);
    }
  }
);

// @desc    Get performance dashboard data
// @route   GET /api/monitoring/dashboard
// @access  Private (Admin only)
router.get(
  '/dashboard',
  AuthMiddleware.protect(),
  AuthMiddleware.requireAdmin(),
  async (req, res, next) => {
    try {
      const metrics = metricsCollector.getMetrics();
      const dbHealth = await checkDatabaseHealth();
      const backupStats = await backupManager.getBackupStats();

      const dashboard = {
        system: {
          uptime: process.uptime(),
          memory: process.memoryUsage(),
          cpu: process.cpuUsage(),
          platform: process.platform,
          nodeVersion: process.version,
        },
        performance: {
          avgResponseTime: metrics.calculated?.avgResponseTime || 0,
          p95ResponseTime: metrics.calculated?.p95ResponseTime || 0,
          p99ResponseTime: metrics.calculated?.p99ResponseTime || 0,
          errorRate: metrics.calculated?.errorRate || 0,
          requestsPerMinute: metrics.calculated?.requestsPerMinute || 0,
        },
        requests: {
          total: metrics.requests.total,
          byMethod: metrics.requests.byMethod,
          byStatus: metrics.requests.byStatus,
        },
        errors: {
          total: metrics.errors.total,
          byType: metrics.errors.byType,
        },
        database: {
          health: dbHealth,
          queries: metrics.database.queries,
          slowQueries: metrics.database.slowQueries,
          connectionErrors: metrics.database.connectionErrors,
        },
        business: metrics.business,
        backups: backupStats,
      };

      res.status(200).json({
        success: true,
        data: dashboard,
      });
    } catch (error) {
      next(error);
    }
  }
);

// @desc    Get real-time system status
// @route   GET /api/monitoring/status
// @access  Private (Admin only)
router.get(
  '/status',
  AuthMiddleware.protect(),
  AuthMiddleware.requireAdmin(),
  (req, res, next) => {
    try {
      const status = {
        timestamp: new Date().toISOString(),
        system: {
          status: 'running',
          uptime: process.uptime(),
          memory: {
            used: process.memoryUsage().heapUsed,
            total: process.memoryUsage().heapTotal,
            external: process.memoryUsage().external,
          },
          cpu: process.cpuUsage(),
        },
        services: {
          database:
            mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
          backup: backupManager.autoBackup ? 'enabled' : 'disabled',
          metrics: config.performance.enableMetrics ? 'enabled' : 'disabled',
          monitoring: config.monitoring.enabled ? 'enabled' : 'disabled',
        },
        environment: {
          nodeEnv: config.server.nodeEnv,
          port: config.server.port,
          clustering: config.clustering.enabled ? 'enabled' : 'disabled',
        },
      };

      res.status(200).json({
        success: true,
        data: status,
      });
    } catch (error) {
      next(error);
    }
  }
);

module.exports = router;
