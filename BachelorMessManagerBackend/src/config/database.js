const mongoose = require('mongoose');
const logger = require('../utils/logger');

const connectDB = async () => {
  try {
    const mongoUri =
      process.env.NODE_ENV === 'production'
        ? process.env.MONGODB_URI_PROD
        : process.env.MONGODB_URI;

    if (!mongoUri) {
      throw new Error('MongoDB URI is not configured');
    }

    const options = {
      maxPoolSize: parseInt(process.env.MONGODB_MAX_POOL_SIZE) || 10,
      minPoolSize: parseInt(process.env.MONGODB_MIN_POOL_SIZE) || 2,
      serverSelectionTimeoutMS:
        parseInt(process.env.MONGODB_SERVER_SELECTION_TIMEOUT) || 5000,
      socketTimeoutMS: parseInt(process.env.MONGODB_SOCKET_TIMEOUT) || 45000,
      bufferCommands: false,
      maxIdleTimeMS: parseInt(process.env.MONGODB_MAX_IDLE_TIME) || 30000,
      retryWrites: true,
      w: 'majority',
      readPreference: 'primary',
      readConcern: { level: 'local' },
      writeConcern: { w: 'majority', j: true },
    };

    const conn = await mongoose.connect(mongoUri, options);

    logger.info(`MongoDB Connected: ${conn.connection.host}`);
    logger.info(`Database: ${conn.connection.name}`);

    // Safely access pool size
    const poolSize = conn.connection.pool?.size || 'unknown';
    logger.info(`Connection Pool Size: ${poolSize}`);

    // Handle connection events
    mongoose.connection.on('error', err => {
      logger.error('MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected');
    });

    mongoose.connection.on('reconnected', () => {
      logger.info('MongoDB reconnected');
    });

    mongoose.connection.on('connected', () => {
      logger.info('MongoDB connected');
    });

    mongoose.connection.on('close', () => {
      logger.info('MongoDB connection closed');
    });

    // Monitor connection pool
    setInterval(() => {
      try {
        const pool = mongoose.connection.pool;
        if (pool && typeof pool.status === 'function') {
          const poolStatus = pool.status();
          logger.debug(`Connection pool status: ${poolStatus}`);
        } else {
          logger.debug(
            'Connection pool not available or status method not found'
          );
        }
      } catch (error) {
        logger.debug('Error checking connection pool status:', error.message);
      }
    }, 60000); // Log every minute

    // Graceful shutdown
    const gracefulShutdown = async signal => {
      logger.info(`${signal} received, closing MongoDB connection`);

      try {
        await mongoose.connection.close();
        logger.info('MongoDB connection closed through app termination');
        process.exit(0);
      } catch (error) {
        logger.error('Error closing MongoDB connection:', error);
        process.exit(1);
      }
    };

    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

    return conn;
  } catch (error) {
    logger.error('Database connection failed:', error);

    // Retry connection logic
    if (process.env.NODE_ENV === 'production') {
      logger.info('Retrying database connection in 5 seconds...');
      setTimeout(() => {
        connectDB();
      }, 5000);
    } else {
      process.exit(1);
    }
  }
};

// Database health check
const checkDatabaseHealth = async () => {
  try {
    const status = mongoose.connection.readyState;
    const healthStatus = {
      connected: status === 1,
      status: status,
      statusText:
        ['disconnected', 'connected', 'connecting', 'disconnecting'][status] ||
        'unknown',
      host: mongoose.connection.host,
      port: mongoose.connection.port,
      name: mongoose.connection.name,
      poolSize: mongoose.connection.pool?.size || 0,
    };

    return healthStatus;
  } catch (error) {
    logger.error('Database health check failed:', error);
    return {
      connected: false,
      error: error.message,
    };
  }
};

// Database statistics
const getDatabaseStats = async () => {
  try {
    const stats = await mongoose.connection.db.stats();
    return {
      collections: stats.collections,
      dataSize: stats.dataSize,
      storageSize: stats.storageSize,
      indexes: stats.indexes,
      indexSize: stats.indexSize,
    };
  } catch (error) {
    logger.error('Failed to get database stats:', error);
    return null;
  }
};

module.exports = {
  connectDB,
  checkDatabaseHealth,
  getDatabaseStats,
};
