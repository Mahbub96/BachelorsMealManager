# Database Scripts

This directory contains various database management scripts for the Bachelor Mess Manager application.

## Available Scripts

### Seeding Scripts

#### `seed.js`

Comprehensive database seeder with realistic data and proper relationships.

**Usage:**

```bash
npm run db:seed
```

**Creates:**

- 8 users with detailed profiles and payment history (1 super admin, 1 admin, 6 members)
- 6 bazar entries with various categories and statuses
- 7 days of meal entries for all members (one entry per user per date)
- Comprehensive statistics

**Features:**

- ✅ Passwords are properly hashed (using bcrypt, same as login/signup)
- ✅ Realistic payment history and statuses
- ✅ Multiple bazar categories (groceries, meat, vegetables, dairy, beverages, cooking)
- ✅ Meal entries with proper date normalization
- ✅ All data relationships properly linked

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

After running the seeder, you can use these credentials:

- **Super Admin:** `superadmin@mess.com` / `SuperAdmin@2024`
- **Admin:** `admin@mess.com` / `Admin@2024`
- **Members:** 
  - `john@mess.com` / `Password@123`
  - `jane@mess.com` / `Password@123`
  - `mike@mess.com` / `Password@123`
  - `sarah@mess.com` / `Password@123`
  - `david@mess.com` / `Password@123`
  - `emily@mess.com` / `Password@123`

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

# 3. Seed database
npm run db:seed

# 4. Initialize statistics (optional, seeder already creates stats)
npm run stats:init
```

### Development Workflow

```bash
# Seed database with comprehensive data
npm run db:seed

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
├── seed.js                # Database seeder (comprehensive)
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
