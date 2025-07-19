const fs = require('fs').promises;
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);
const logger = require('./logger');
const { config } = require('../config/config');

class BackupManager {
  constructor() {
    this.backupDir = process.env.BACKUP_DIR || path.join(__dirname, '../../backups');
    this.maxBackups = parseInt(process.env.MAX_BACKUPS) || 10;
    this.backupRetentionDays = parseInt(process.env.BACKUP_RETENTION_DAYS) || 30;
    this.autoBackup = process.env.AUTO_BACKUP === 'true';
    this.backupInterval = parseInt(process.env.BACKUP_INTERVAL_HOURS) || 24;
  }

  // Initialize backup directory
  async initialize() {
    try {
      await fs.mkdir(this.backupDir, { recursive: true });
      logger.info(`Backup directory initialized: ${this.backupDir}`);
    } catch (error) {
      logger.error('Failed to initialize backup directory:', error);
      throw error;
    }
  }

  // Create database backup
  async createDatabaseBackup() {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupFileName = `db-backup-${timestamp}.gz`;
      const backupPath = path.join(this.backupDir, backupFileName);

      // Get MongoDB URI from config
      const mongoUri = config.database.uri;
      if (!mongoUri) {
        throw new Error('MongoDB URI not configured');
      }

      // Extract database name from URI
      const dbName = mongoUri.split('/').pop().split('?')[0];

      // Create mongodump command
      let command;
      if (mongoUri.startsWith('mongodb+srv://')) {
        // MongoDB Atlas
        command = `mongodump --uri="${mongoUri}" --archive="${backupPath}" --gzip`;
      } else {
        // Local MongoDB
        command = `mongodump --uri="${mongoUri}" --archive="${backupPath}" --gzip`;
      }

      logger.info(`Starting database backup: ${backupFileName}`);
      const { stdout, stderr } = await execAsync(command);

      if (stderr && !stderr.includes('writing metadata')) {
        logger.warn('Database backup warnings:', stderr);
      }

      const stats = await fs.stat(backupPath);
      logger.info(`Database backup completed: ${backupFileName} (${this.formatBytes(stats.size)})`);

      // Clean old backups
      await this.cleanOldBackups();

      return {
        success: true,
        fileName: backupFileName,
        size: stats.size,
        path: backupPath,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      logger.error('Database backup failed:', error);
      throw error;
    }
  }

  // Restore database from backup
  async restoreDatabase(backupFileName) {
    try {
      const backupPath = path.join(this.backupDir, backupFileName);
      
      // Check if backup file exists
      await fs.access(backupPath);
      
      const mongoUri = config.database.uri;
      if (!mongoUri) {
        throw new Error('MongoDB URI not configured');
      }

      logger.info(`Starting database restore from: ${backupFileName}`);

      // Create mongorestore command
      let command;
      if (mongoUri.startsWith('mongodb+srv://')) {
        // MongoDB Atlas
        command = `mongorestore --uri="${mongoUri}" --archive="${backupPath}" --gzip --drop`;
      } else {
        // Local MongoDB
        command = `mongorestore --uri="${mongoUri}" --archive="${backupPath}" --gzip --drop`;
      }

      const { stdout, stderr } = await execAsync(command);

      if (stderr && !stderr.includes('restoring')) {
        logger.warn('Database restore warnings:', stderr);
      }

      logger.info(`Database restore completed: ${backupFileName}`);

      return {
        success: true,
        fileName: backupFileName,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      logger.error('Database restore failed:', error);
      throw error;
    }
  }

  // Create file system backup
  async createFileBackup() {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupFileName = `files-backup-${timestamp}.tar.gz`;
      const backupPath = path.join(this.backupDir, backupFileName);

      // Directories to backup
      const uploadsDir = path.join(__dirname, '../../uploads');
      const logsDir = path.join(__dirname, '../../logs');

      // Check if directories exist
      const dirsToBackup = [];
      try {
        await fs.access(uploadsDir);
        dirsToBackup.push(uploadsDir);
      } catch (error) {
        logger.warn('Uploads directory not found, skipping');
      }

      try {
        await fs.access(logsDir);
        dirsToBackup.push(logsDir);
      } catch (error) {
        logger.warn('Logs directory not found, skipping');
      }

      if (dirsToBackup.length === 0) {
        logger.warn('No directories to backup');
        return null;
      }

      logger.info(`Starting file backup: ${backupFileName}`);
      
      // Create tar command
      const dirsString = dirsToBackup.join(' ');
      const command = `tar -czf "${backupPath}" -C "${path.dirname(dirsToBackup[0])}" ${dirsToBackup.map(dir => path.basename(dir)).join(' ')}`;
      
      const { stdout, stderr } = await execAsync(command);

      if (stderr) {
        logger.warn('File backup warnings:', stderr);
      }

      const stats = await fs.stat(backupPath);
      logger.info(`File backup completed: ${backupFileName} (${this.formatBytes(stats.size)})`);

      return {
        success: true,
        fileName: backupFileName,
        size: stats.size,
        path: backupPath,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      logger.error('File backup failed:', error);
      throw error;
    }
  }

  // List available backups
  async listBackups() {
    try {
      const files = await fs.readdir(this.backupDir);
      const backups = [];

      for (const file of files) {
        const filePath = path.join(this.backupDir, file);
        const stats = await fs.stat(filePath);
        
        backups.push({
          fileName: file,
          size: stats.size,
          sizeFormatted: this.formatBytes(stats.size),
          createdAt: stats.birthtime,
          modifiedAt: stats.mtime,
          type: file.includes('db-backup') ? 'database' : 'files'
        });
      }

      // Sort by creation date (newest first)
      backups.sort((a, b) => b.createdAt - a.createdAt);

      return backups;
    } catch (error) {
      logger.error('Failed to list backups:', error);
      throw error;
    }
  }

  // Clean old backups
  async cleanOldBackups() {
    try {
      const backups = await this.listBackups();
      const now = new Date();
      const cutoffDate = new Date(now.getTime() - (this.backupRetentionDays * 24 * 60 * 60 * 1000));

      let deletedCount = 0;
      for (const backup of backups) {
        if (backup.createdAt < cutoffDate) {
          const filePath = path.join(this.backupDir, backup.fileName);
          await fs.unlink(filePath);
          logger.info(`Deleted old backup: ${backup.fileName}`);
          deletedCount++;
        }
      }

      // Also limit total number of backups
      if (backups.length > this.maxBackups) {
        const excessBackups = backups.slice(this.maxBackups);
        for (const backup of excessBackups) {
          const filePath = path.join(this.backupDir, backup.fileName);
          await fs.unlink(filePath);
          logger.info(`Deleted excess backup: ${backup.fileName}`);
          deletedCount++;
        }
      }

      if (deletedCount > 0) {
        logger.info(`Cleaned up ${deletedCount} old backups`);
      }

      return deletedCount;
    } catch (error) {
      logger.error('Failed to clean old backups:', error);
      throw error;
    }
  }

  // Create full backup (database + files)
  async createFullBackup() {
    try {
      logger.info('Starting full backup process');
      
      const dbBackup = await this.createDatabaseBackup();
      const fileBackup = await this.createFileBackup();

      const fullBackup = {
        success: true,
        timestamp: new Date().toISOString(),
        database: dbBackup,
        files: fileBackup,
        totalSize: (dbBackup?.size || 0) + (fileBackup?.size || 0)
      };

      logger.info(`Full backup completed successfully (${this.formatBytes(fullBackup.totalSize)})`);
      return fullBackup;
    } catch (error) {
      logger.error('Full backup failed:', error);
      throw error;
    }
  }

  // Verify backup integrity
  async verifyBackup(backupFileName) {
    try {
      const backupPath = path.join(this.backupDir, backupFileName);
      
      // Check if file exists
      await fs.access(backupPath);
      
      const stats = await fs.stat(backupPath);
      
      if (stats.size === 0) {
        throw new Error('Backup file is empty');
      }

      // For database backups, try to read the archive
      if (backupFileName.includes('db-backup')) {
        const { stdout } = await execAsync(`mongorestore --dryRun --archive="${backupPath}" --gzip`);
        logger.info(`Backup verification successful: ${backupFileName}`);
      }

      return {
        success: true,
        fileName: backupFileName,
        size: stats.size,
        verified: true
      };
    } catch (error) {
      logger.error(`Backup verification failed for ${backupFileName}:`, error);
      throw error;
    }
  }

  // Get backup statistics
  async getBackupStats() {
    try {
      const backups = await this.listBackups();
      const dbBackups = backups.filter(b => b.type === 'database');
      const fileBackups = backups.filter(b => b.type === 'files');

      const totalSize = backups.reduce((sum, b) => sum + b.size, 0);
      const avgSize = backups.length > 0 ? totalSize / backups.length : 0;

      return {
        totalBackups: backups.length,
        databaseBackups: dbBackups.length,
        fileBackups: fileBackups.length,
        totalSize: totalSize,
        totalSizeFormatted: this.formatBytes(totalSize),
        averageSize: avgSize,
        averageSizeFormatted: this.formatBytes(avgSize),
        oldestBackup: backups.length > 0 ? backups[backups.length - 1].createdAt : null,
        newestBackup: backups.length > 0 ? backups[0].createdAt : null
      };
    } catch (error) {
      logger.error('Failed to get backup stats:', error);
      throw error;
    }
  }

  // Start automatic backup schedule
  startAutoBackup() {
    if (!this.autoBackup) {
      logger.info('Auto backup is disabled');
      return;
    }

    logger.info(`Auto backup enabled - will run every ${this.backupInterval} hours`);
    
    const intervalMs = this.backupInterval * 60 * 60 * 1000;
    
    setInterval(async () => {
      try {
        logger.info('Starting scheduled backup');
        await this.createFullBackup();
      } catch (error) {
        logger.error('Scheduled backup failed:', error);
      }
    }, intervalMs);
  }

  // Helper method to format bytes
  formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}

// Create singleton instance
const backupManager = new BackupManager();

// Initialize backup manager
backupManager.initialize().then(() => {
  logger.info('Backup manager initialized');
  
  // Start auto backup if enabled
  if (backupManager.autoBackup) {
    backupManager.startAutoBackup();
  }
}).catch(error => {
  logger.error('Failed to initialize backup manager:', error);
});

module.exports = backupManager; 