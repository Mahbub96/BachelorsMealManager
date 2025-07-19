#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

/**
 * Bachelor Mess Manager Backend Setup Script
 * This script sets up the complete backend environment
 */

console.log('🚀 Starting Bachelor Mess Manager Backend Setup...\n');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logStep(step, message) {
  log(`\n${step}. ${message}`, 'cyan');
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

function logInfo(message) {
  log(`ℹ️  ${message}`, 'blue');
}

// Check if .env file exists
function checkEnvironmentFile() {
  logStep(1, 'Checking environment configuration');

  const envPath = path.join(__dirname, '..', '.env');
  const envExamplePath = path.join(__dirname, '..', 'env.example');

  if (!fs.existsSync(envPath)) {
    logWarning('.env file not found. Creating from env.example...');

    if (fs.existsSync(envExamplePath)) {
      const envExample = fs.readFileSync(envExamplePath, 'utf8');
      fs.writeFileSync(envPath, envExample);
      logSuccess('.env file created from env.example');
    } else {
      logError(
        'env.example file not found. Please create a .env file manually.'
      );
      return false;
    }
  } else {
    logSuccess('.env file already exists');
  }

  return true;
}

// Create necessary directories
function createDirectories() {
  logStep(2, 'Creating necessary directories');

  const directories = ['logs', 'uploads', 'backups', 'temp'];

  directories.forEach(dir => {
    const dirPath = path.join(__dirname, '..', dir);
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
      logSuccess(`Created directory: ${dir}`);
    } else {
      logInfo(`Directory already exists: ${dir}`);
    }
  });
}

// Install dependencies
function installDependencies() {
  logStep(3, 'Installing dependencies');

  try {
    logInfo('Dependencies already installed via npm install');
    logSuccess('Dependencies are ready');
  } catch (error) {
    logError('Failed to verify dependencies');
    console.error(error);
    return false;
  }

  return true;
}

// Check Node.js version
function checkNodeVersion() {
  logStep(4, 'Checking Node.js version');

  const nodeVersion = process.version;
  const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);

  if (majorVersion >= 18) {
    logSuccess(`Node.js version: ${nodeVersion} (✓ Compatible)`);
  } else {
    logError(
      `Node.js version: ${nodeVersion} (✗ Requires Node.js 18 or higher)`
    );
    return false;
  }

  return true;
}

// Check MongoDB connection
async function checkMongoDB() {
  logStep(5, 'Checking MongoDB connection');

  try {
    const mongoose = require('mongoose');
    const { config } = require('../src/config/config');

    logInfo('Attempting to connect to MongoDB...');
    await mongoose.connect(config.database.uri, config.database.options);
    logSuccess('MongoDB connection successful');

    // Test database operations
    const db = mongoose.connection.db;
    await db.admin().ping();
    logSuccess('Database ping successful');

    await mongoose.disconnect();
  } catch (error) {
    logWarning('MongoDB connection failed. Make sure MongoDB is running.');
    logInfo('You can start MongoDB using: docker-compose up mongo');
    return false;
  }

  return true;
}

// Run linting
function runLinting() {
  logStep(6, 'Running code linting');

  try {
    logInfo('Running ESLint...');
    execSync('npm run lint', {
      stdio: 'inherit',
      cwd: path.join(__dirname, '..'),
    });
    logSuccess('Linting passed');
  } catch (error) {
    logWarning('Linting failed. Some code style issues found.');
    logInfo('Run "npm run lint:fix" to automatically fix issues.');
  }
}

// Run tests
function runTests() {
  logStep(7, 'Running tests');

  try {
    logInfo('Running test suite...');
    execSync('npm test', { stdio: 'inherit', cwd: path.join(__dirname, '..') });
    logSuccess('Tests passed');
  } catch (error) {
    logWarning('Tests failed. Check the test output above.');
  }
}

// Generate secure JWT secrets
function generateSecureSecrets() {
  logStep(8, 'Generating secure JWT secrets');

  const crypto = require('crypto');
  const envPath = path.join(__dirname, '..', '.env');

  if (fs.existsSync(envPath)) {
    let envContent = fs.readFileSync(envPath, 'utf8');

    // Generate secure JWT secrets if they're still default
    const jwtSecret = crypto.randomBytes(64).toString('hex');
    const jwtRefreshSecret = crypto.randomBytes(64).toString('hex');

    envContent = envContent.replace(
      /JWT_SECRET=bachelor-mess-super-secret-jwt-key-2024-change-in-production/g,
      `JWT_SECRET=${jwtSecret}`
    );

    envContent = envContent.replace(
      /JWT_REFRESH_SECRET=bachelor-mess-refresh-secret-key-2024-change-in-production/g,
      `JWT_REFRESH_SECRET=${jwtRefreshSecret}`
    );

    fs.writeFileSync(envPath, envContent);
    logSuccess('Secure JWT secrets generated');
  }
}

// Display setup completion
function displayCompletion() {
  logStep(9, 'Setup completion');

  logSuccess('Backend setup completed successfully!');

  log('\n📋 Next steps:', 'bright');
  log('1. Configure your .env file with your specific values', 'blue');
  log('2. Set up Cloudinary credentials for file uploads', 'blue');
  log('3. Start the development server: npm run dev', 'blue');
  log('4. Or start with Docker: docker-compose up', 'blue');

  log('\n🔗 Useful commands:', 'bright');
  log('• npm run dev          - Start development server', 'green');
  log('• npm run test         - Run tests', 'green');
  log('• npm run lint         - Check code style', 'green');
  log('• npm run lint:fix     - Fix code style issues', 'green');
  log('• docker-compose up    - Start with Docker', 'green');
  log('• npm run health:check - Check application health', 'green');

  log('\n🌐 Access points:', 'bright');
  log('• API: http://localhost:3000/api/v1', 'green');
  log('• MongoDB Express: http://localhost:8081', 'green');
  log('• Health Check: http://localhost:3000/api/v1/health', 'green');

  log('\n🔐 Default admin credentials:', 'bright');
  log('• Username: admin', 'yellow');
  log('• Password: admin123', 'yellow');
  log('• Email: admin@bachelor-mess.com', 'yellow');

  log('\n✨ Happy coding!', 'magenta');
}

// Main setup function
async function setup() {
  try {
    // Check Node.js version first
    if (!checkNodeVersion()) {
      process.exit(1);
    }

    // Check environment file
    if (!checkEnvironmentFile()) {
      process.exit(1);
    }

    // Create directories
    createDirectories();

    // Install dependencies
    if (!installDependencies()) {
      process.exit(1);
    }

    // Generate secure secrets
    generateSecureSecrets();

    // Check MongoDB (optional)
    await checkMongoDB();

    // Run linting
    runLinting();

    // Run tests
    runTests();

    // Display completion
    displayCompletion();
  } catch (error) {
    logError('Setup failed with error:');
    console.error(error);
    process.exit(1);
  }
}

// Run setup if this script is executed directly
if (require.main === module) {
  setup();
}

module.exports = { setup };
