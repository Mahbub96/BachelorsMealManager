const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');
require('dotenv').config();

const execAsync = promisify(exec);

// Database connection
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(
      process.env.MONGODB_URI || 'mongodb://localhost:27017/bachelor-mess',
      {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      }
    );
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error('Database connection error:', error);
    throw error;
  }
};

// Create backup directory if it doesn't exist
const ensureBackupDir = () => {
  const backupDir = path.join(__dirname, '..', 'backups');
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }
  return backupDir;
};

// Backup function
const createBackup = async () => {
  try {
    console.log('💾 Starting database backup...');

    const backupDir = ensureBackupDir();
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupName = `bachelor-mess-backup-${timestamp}`;
    const backupPath = path.join(backupDir, backupName);

    // Get database URI
    const mongoUri =
      process.env.MONGODB_URI || 'mongodb://localhost:27017/bachelor-mess';

    // Create mongodump command
    const dumpCommand = `mongodump --uri="${mongoUri}" --out="${backupPath}"`;

    console.log('🔄 Creating backup...');
    const { stderr } = await execAsync(dumpCommand);

    if (stderr && !stderr.includes('done dumping')) {
      console.error('❌ Backup failed:', stderr);
      return;
    }

    console.log('✅ Backup created successfully!');
    console.log(`📁 Backup location: ${backupPath}`);

    // Create a compressed archive
    const archivePath = `${backupPath}.tar.gz`;
    const tarCommand = `tar -czf "${archivePath}" -C "${backupDir}" "${backupName}"`;

    console.log('🗜️  Compressing backup...');
    await execAsync(tarCommand);

    // Remove uncompressed directory
    await execAsync(`rm -rf "${backupPath}"`);

    console.log(`✅ Compressed backup created: ${archivePath}`);

    // List recent backups
    const files = fs
      .readdirSync(backupDir)
      .filter(file => file.startsWith('bachelor-mess-backup-'))
      .sort()
      .reverse()
      .slice(0, 5);

    console.log('\n📋 Recent backups:');
    files.forEach((file, index) => {
      const filePath = path.join(backupDir, file);
      const stats = fs.statSync(filePath);
      const size = (stats.size / 1024 / 1024).toFixed(2);
      console.log(`  ${index + 1}. ${file} (${size} MB)`);
    });
  } catch (error) {
    console.error('❌ Backup failed:', error);
  } finally {
    mongoose.connection.close();
  }
};

// Run backup
connectDB().then(() => {
  createBackup();
});
