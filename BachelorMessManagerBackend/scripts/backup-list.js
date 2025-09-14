const fs = require('fs');
const path = require('path');

// List backups function
const listBackups = () => {
  try {
    const backupDir = path.join(__dirname, '..', 'backups');

    if (!fs.existsSync(backupDir)) {
      console.log('❌ No backups directory found');
      return;
    }

    const files = fs
      .readdirSync(backupDir)
      .filter(
        file =>
          file.startsWith('bachelor-mess-backup-') && file.endsWith('.tar.gz')
      )
      .map(file => {
        const filePath = path.join(backupDir, file);
        const stats = fs.statSync(filePath);
        return {
          name: file,
          size: (stats.size / 1024 / 1024).toFixed(2),
          modified: stats.mtime.toISOString().replace('T', ' ').split('.')[0],
          path: filePath,
        };
      })
      .sort((a, b) => new Date(b.modified) - new Date(a.modified));

    if (files.length === 0) {
      console.log('📋 No backups found');
      return;
    }

    console.log('📋 Available Backups:');
    console.log(
      '┌─────┬─────────────────────────────────────────────────┬──────────┬─────────────────────┐'
    );
    console.log(
      '│ No. │ Backup Name                                    │ Size (MB)│ Modified            │'
    );
    console.log(
      '├─────┼─────────────────────────────────────────────────┼──────────┼─────────────────────┤'
    );

    files.forEach((file, index) => {
      const name =
        file.name.length > 45 ? file.name.substring(0, 42) + '...' : file.name;
      const size = file.size.padStart(8);
      const modified = file.modified;
      console.log(
        `│ ${String(index + 1).padStart(3)} │ ${name.padEnd(47)} │ ${size} │ ${modified} │`
      );
    });

    console.log(
      '└─────┴─────────────────────────────────────────────────┴──────────┴─────────────────────┘'
    );

    const totalSize = files.reduce(
      (sum, file) => sum + parseFloat(file.size),
      0
    );
    console.log(`\n📊 Total backups: ${files.length}`);
    console.log(`💾 Total size: ${totalSize.toFixed(2)} MB`);
  } catch (error) {
    console.error('❌ Error listing backups:', error);
  }
};

// Run list
listBackups();
