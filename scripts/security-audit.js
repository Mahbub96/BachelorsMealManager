#!/usr/bin/env node

/**
 * Security Audit Script
 * Identifies hardcoded credentials, IP addresses, and sensitive data
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Security patterns to check for
const SECURITY_PATTERNS = {
  // Hardcoded credentials
  credentials: [
    /password\s*[:=]\s*['"`][^'"`]+['"`]/gi,
    /email\s*[:=]\s*['"`][^'"`]+@[^'"`]+\.[^'"`]+['"`]/gi,
    /secret\s*[:=]\s*['"`][^'"`]+['"`]/gi,
    /key\s*[:=]\s*['"`][^'"`]+['"`]/gi,
    /token\s*[:=]\s*['"`][^'"`]+['"`]/gi,
  ],

  // Hardcoded IP addresses
  ipAddresses: [
    /192\.168\.\d+\.\d+/g,
    /10\.\d+\.\d+\.\d+/g,
    /172\.(1[6-9]|2[0-9]|3[0-1])\.\d+\.\d+/g,
    /localhost/g,
    /127\.0\.0\.1/g,
  ],

  // Hardcoded URLs
  urls: [/https?:\/\/[^\s'"]+/gi],

  // Common test data
  testData: [/mahbub@mess\.com/gi, /Password123/gi, /test1230/gi, /admin123/gi],
};

// Files to exclude from scanning
const EXCLUDE_PATTERNS = [
  /node_modules/,
  /\.git/,
  /\.env/,
  /package-lock\.json/,
  /yarn\.lock/,
  /\.log$/,
  /\.md$/,
  /\.txt$/,
];

// Colors for console output
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m',
  bold: '\x1b[1m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function scanFile(filePath) {
  const issues = [];

  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');

    lines.forEach((line, lineNumber) => {
      // Check each security pattern
      Object.entries(SECURITY_PATTERNS).forEach(([category, patterns]) => {
        patterns.forEach(pattern => {
          const matches = line.match(pattern);
          if (matches) {
            issues.push({
              category,
              pattern: pattern.toString(),
              line: lineNumber + 1,
              content: line.trim(),
              matches,
            });
          }
        });
      });
    });
  } catch (error) {
    log(`❌ Error reading file: ${filePath}`, 'red');
  }

  return issues;
}

function scanDirectory(dirPath, issues = []) {
  try {
    const items = fs.readdirSync(dirPath);

    items.forEach(item => {
      const fullPath = path.join(dirPath, item);
      const stat = fs.statSync(fullPath);

      // Skip excluded patterns
      if (EXCLUDE_PATTERNS.some(pattern => pattern.test(fullPath))) {
        return;
      }

      if (stat.isDirectory()) {
        scanDirectory(fullPath, issues);
      } else if (stat.isFile()) {
        const fileIssues = scanFile(fullPath);
        if (fileIssues.length > 0) {
          issues.push({
            file: fullPath,
            issues: fileIssues,
          });
        }
      }
    });
  } catch (error) {
    log(`❌ Error scanning directory: ${dirPath}`, 'red');
  }

  return issues;
}

function generateSecureSecrets() {
  log('\n🔐 Generating secure secrets...', 'cyan');

  const secrets = {
    JWT_SECRET: crypto.randomBytes(64).toString('hex'),
    JWT_REFRESH_SECRET: crypto.randomBytes(64).toString('hex'),
    SESSION_SECRET: crypto.randomBytes(32).toString('hex'),
    API_KEY: crypto.randomBytes(32).toString('hex'),
  };

  Object.entries(secrets).forEach(([key, value]) => {
    log(`${key}=${value}`, 'green');
  });

  return secrets;
}

function generateEnvironmentTemplate() {
  log('\n📝 Generating .env template...', 'cyan');

  const template = `# Database Configuration
MONGODB_URI=mongodb://localhost:27017/bachelor-mess
MONGODB_URI_PROD=mongodb://your-production-mongodb-uri

# Server Configuration
PORT=3000
NODE_ENV=development

# JWT Configuration - Generate secure secrets
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_REFRESH_SECRET=your-refresh-secret-key
JWT_EXPIRE=7d
JWT_REFRESH_EXPIRE=30d

# CORS Configuration
CORS_ORIGIN=http://localhost:3000,http://localhost:3001,http://localhost:8081

# Security Configuration
BCRYPT_SALT_ROUNDS=12
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Test Configuration (for development only)
TEST_USER_ID=687bb6f40864ea7356a4d5e4
TEST_USER_EMAIL=test@mess.com
TEST_EMAIL=test@mess.com
TEST_PASSWORD=test123
API_BASE_URL=http://localhost:3000

# Admin Configuration
ADMIN_EMAIL=admin@mess.com
ADMIN_PASSWORD=AdminPassword123
MEMBER_PASSWORD=MemberPassword123

# API Configuration
API_PREFIX=/api/v1
API_VERSION=v1

# Logging Configuration
LOG_LEVEL=info
LOG_FORMAT=combined

# Cache Configuration
REDIS_URL=redis://localhost:6379
CACHE_TTL=300

# File Upload Configuration
MAX_FILE_SIZE=10485760
UPLOAD_PATH=./uploads

# Monitoring Configuration
ENABLE_METRICS=true
METRICS_PORT=9090

# Development Configuration
ENABLE_SWAGGER=true
ENABLE_CORS=true
ENABLE_RATE_LIMITING=true
`;

  return template;
}

function main() {
  log('🔒 Security Audit Tool', 'bold');
  log('Scanning for hardcoded credentials and sensitive data...\n', 'yellow');

  const projectRoot = process.cwd();
  const issues = scanDirectory(projectRoot);

  if (issues.length === 0) {
    log('✅ No security issues found!', 'green');
  } else {
    log(
      `❌ Found ${issues.length} files with potential security issues:`,
      'red'
    );

    issues.forEach(({ file, issues: fileIssues }) => {
      log(`\n📁 ${file}`, 'blue');

      fileIssues.forEach(issue => {
        log(`  Line ${issue.line}: ${issue.content}`, 'yellow');
        log(`  Category: ${issue.category}`, 'magenta');
      });
    });

    log('\n🚨 RECOMMENDATIONS:', 'red');
    log(
      '1. Replace hardcoded credentials with environment variables',
      'yellow'
    );
    log('2. Use secure secrets for JWT tokens', 'yellow');
    log('3. Remove hardcoded IP addresses', 'yellow');
    log('4. Implement proper configuration management', 'yellow');
  }

  // Generate secure secrets
  const secrets = generateSecureSecrets();

  // Generate environment template
  const envTemplate = generateEnvironmentTemplate();

  log('\n📋 Next Steps:', 'cyan');
  log('1. Update your .env file with the generated secrets', 'green');
  log('2. Replace hardcoded values with environment variables', 'green');
  log('3. Run this audit again to verify fixes', 'green');
  log('4. Implement proper authentication middleware', 'green');

  // Save environment template
  const envPath = path.join(projectRoot, '.env.template');
  fs.writeFileSync(envPath, envTemplate);
  log(`\n💾 Environment template saved to: ${envPath}`, 'green');
}

if (require.main === module) {
  main();
}

module.exports = {
  scanFile,
  scanDirectory,
  generateSecureSecrets,
  generateEnvironmentTemplate,
};
