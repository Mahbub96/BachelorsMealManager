# Database Scripts

This directory contains various database management scripts for the Bachelor Mess Manager application.

## Available Scripts

### Seeding Scripts

#### `seed.js`

Basic database seeder that creates sample users, bazar entries, and meal entries.

**Usage:**

```bash
npm run db:seed
```

**Creates:**

- 6 sample users (1 super admin, 1 admin, 4 members)
- Sample bazar entries
- Sample meal entries
- Initial statistics

#### `perfect-seeder.js`

Comprehensive seeder with realistic data and proper relationships.

**Usage:**

```bash
npm run db:seed:perfect
```

**Creates:**

- 8 users with detailed profiles and payment history
- 6 bazar entries with various categories and statuses
- 7 days of meal entries for all members
- Comprehensive statistics

#### `test-perfect-seeder.js`

Minimal seeder for testing purposes.

**Usage:**

```bash
npm run db:seed:test
```

**Creates:**

- 2 test users (1 admin, 1 member)
- Minimal data for testing

### Database Management Scripts

#### `migrate.js`

Creates database indexes for better performance.

**Usage:**

```bash
npm run db:migrate
```

**Creates indexes for:**

- Users collection (email, role, status, createdAt)
- Bazar collection (userId, status, createdAt, category)
- Meal collection (userId, date, status, mealType)
- Statistics collection (lastUpdated)

#### `reset.js`

**⚠️ DANGER: This will delete ALL data!**

Completely resets the database by clearing all collections.

**Usage:**

```bash
npm run db:reset
```

**Features:**

- Interactive confirmation prompt
- Clears all collections
- Drops all indexes
- Safe to use in development

### Backup & Restore Scripts

#### `backup.js`

Creates a compressed backup of the database.

**Usage:**

```bash
npm run backup:create
```

**Features:**

- Creates timestamped backups
- Compresses backups to save space
- Stores in `backups/` directory
- Shows recent backup list

#### `restore.js`

Restores database from a backup.

**Usage:**

```bash
npm run db:restore
```

**Features:**

- Interactive backup selection
- Confirmation prompt
- Extracts and restores data
- Cleans up temporary files

#### `backup-list.js`

Lists all available backups with details.

**Usage:**

```bash
npm run backup:list
```

**Shows:**

- Backup names and sizes
- Modification dates
- Total backup count and size

### Utility Scripts

#### `init-statistics.js`

Initializes or refreshes statistics collection.

**Usage:**

```bash
npm run stats:init
```

**Features:**

- Calculates current statistics
- Updates all counters
- Shows summary of data

## Default Credentials

After running any seeder, you can use these credentials:

### Perfect Seeder Credentials

- **Super Admin:** `superadmin@mess.com` / `SuperAdmin@2024`
- **Admin:** `admin@mess.com` / `Admin@2024`
- **Members:** `[email]` / `Password@123`

### Basic Seeder Credentials

- **Super Admin:** `superadmin@mess.com` / `admin123`
- **Admin:** `admin@mess.com` / `admin123`
- **Members:** `[email]` / `password123`

### Test Seeder Credentials

- **Admin:** `test@mess.com` / `test123`
- **Member:** `member@mess.com` / `test123`

## Environment Variables

Make sure these environment variables are set:

```env
MONGODB_URI=mongodb://localhost:27017/bachelor-mess
NODE_ENV=development
```

## Usage Examples

### Complete Setup

```bash
# 1. Reset database
npm run db:reset

# 2. Run migrations
npm run db:migrate

# 3. Seed with perfect data
npm run db:seed:perfect

# 4. Initialize statistics
npm run stats:init
```

### Development Workflow

```bash
# Quick test setup
npm run db:seed:test

# Full development data
npm run db:seed:perfect

# Backup before changes
npm run backup:create

# Restore if needed
npm run db:restore
```

### Production Preparation

```bash
# Create final backup
npm run backup:create

# Run migrations
npm run db:migrate

# Initialize statistics
npm run stats:init
```

## File Structure

```
scripts/
├── README.md              # This file
├── seed.js                # Basic seeder
├── perfect-seeder.js      # Comprehensive seeder
├── test-perfect-seeder.js # Test seeder
├── migrate.js             # Database migrations
├── reset.js               # Database reset
├── backup.js              # Create backup
├── restore.js             # Restore backup
├── backup-list.js         # List backups
└── init-statistics.js     # Initialize statistics
```

## Notes

- All scripts include proper error handling
- Scripts are safe to run multiple times
- Backups are compressed to save space
- Interactive prompts prevent accidental data loss
- All operations are logged with timestamps
