const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const { exec } = promisify(require('child_process').exec);
require('dotenv').config();

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
    process.exit(1);
  }
};

// List available backups
const listBackups = () => {
  const backupDir = path.join(__dirname, '..', 'backups');

  if (!fs.existsSync(backupDir)) {
    console.log('❌ No backups directory found');
    return [];
  }

  const files = fs
    .readdirSync(backupDir)
    .filter(
      file =>
        file.startsWith('bachelor-mess-backup-') && file.endsWith('.tar.gz')
    )
    .sort()
    .reverse();

  return files.map((file, index) => {
    const filePath = path.join(backupDir, file);
    const stats = fs.statSync(filePath);
    const size = (stats.size / 1024 / 1024).toFixed(2);
    const modified = stats.mtime.toISOString().split('T')[0];
    return {
      index: index + 1,
      name: file,
      size: size,
      modified: modified,
      path: filePath,
    };
  });
};

// Restore function
const restoreDatabase = async backupFile => {
  try {
    console.log('🔄 Starting database restore...');
    console.log(`📁 Restoring from: ${backupFile}`);

    const backupDir = path.join(__dirname, '..', 'backups');
    const backupPath = path.join(backupDir, backupFile);

    if (!fs.existsSync(backupPath)) {
      console.error('❌ Backup file not found:', backupPath);
      return;
    }

    // Extract backup
    const extractDir = path.join(backupDir, 'temp-restore');
    const extractCommand = `tar -xzf "${backupPath}" -C "${backupDir}"`;

    console.log('📦 Extracting backup...');
    await execAsync(extractCommand);

    // Find the extracted directory
    const extractedDirs = fs.readdirSync(backupDir).filter(item => {
      const itemPath = path.join(backupDir, item);
      return (
        fs.statSync(itemPath).isDirectory() &&
        item.startsWith('bachelor-mess-backup-')
      );
    });

    if (extractedDirs.length === 0) {
      console.error('❌ No extracted backup directory found');
      return;
    }

    const extractedDir = path.join(backupDir, extractedDirs[0]);
    const dbName = process.env.MONGODB_URI
      ? process.env.MONGODB_URI.split('/').pop().split('?')[0]
      : 'bachelor-mess';

    // Restore database
    const restoreCommand = `mongorestore --db="${dbName}" --drop "${extractedDir}/${dbName}"`;

    console.log('🔄 Restoring database...');
    const { stdout, stderr } = await execAsync(restoreCommand);

    if (stderr && !stderr.includes('done')) {
      console.error('❌ Restore failed:', stderr);
      return;
    }

    // Clean up extracted directory
    await execAsync(`rm -rf "${extractedDir}"`);

    console.log('✅ Database restored successfully!');
  } catch (error) {
    console.error('❌ Restore failed:', error);
  } finally {
    mongoose.connection.close();
  }
};

// Interactive restore
const interactiveRestore = () => {
  const readline = require('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const backups = listBackups();

  if (backups.length === 0) {
    console.log('❌ No backups found');
    rl.close();
    return;
  }

  console.log('\n📋 Available backups:');
  backups.forEach(backup => {
    console.log(
      `  ${backup.index}. ${backup.name} (${backup.size} MB) - ${backup.modified}`
    );
  });

  rl.question('\nEnter backup number to restore (or 0 to cancel): ', answer => {
    const choice = parseInt(answer);

    if (choice === 0) {
      console.log('❌ Restore cancelled');
      rl.close();
      return;
    }

    if (choice < 1 || choice > backups.length) {
      console.log('❌ Invalid choice');
      rl.close();
      return;
    }

    const selectedBackup = backups[choice - 1];
    rl.question(
      `Are you sure you want to restore ${selectedBackup.name}? This will overwrite current data. (yes/no): `,
      confirm => {
        if (confirm.toLowerCase() === 'yes' || confirm.toLowerCase() === 'y') {
          connectDB().then(() => {
            restoreDatabase(selectedBackup.name);
          });
        } else {
          console.log('❌ Restore cancelled');
        }
        rl.close();
      }
    );
  });
};

// Run interactive restore
interactiveRestore();
