# Bachelor Mess Manager Backend - Complete Setup Guide

This guide will help you set up the Bachelor Mess Manager Backend with a perfect environment configuration.

## 🎯 Overview

The backend is designed with modern architecture principles, comprehensive security, and scalability in mind. This setup guide ensures you have everything configured perfectly for development, testing, and production environments.

## 📋 Prerequisites

### System Requirements

- **Node.js**: 18.0.0 or higher
- **npm**: 8.0.0 or higher
- **MongoDB**: 6.0 or higher
- **Git**: Latest version
- **Docker**: 20.0 or higher (optional)

### Verify Prerequisites

```bash
# Check Node.js version
node --version

# Check npm version
npm --version

# Check Git version
git --version

# Check Docker version (if using Docker)
docker --version
docker-compose --version
```

## 🚀 Quick Setup (Recommended)

### 1. Clone and Navigate

```bash
git clone <repository-url>
cd BachelorMessManagerBackend
```

### 2. Run Automated Setup

```bash
npm run dev:setup
```

This single command will:

- ✅ Check all prerequisites
- ✅ Create environment configuration
- ✅ Install dependencies
- ✅ Generate secure secrets
- ✅ Create necessary directories
- ✅ Run code quality checks
- ✅ Test the setup

### 3. Start Development Server

```bash
npm run dev
```

Your backend is now running at `http://localhost:3000`!

## 🔧 Manual Setup (Advanced)

If you prefer manual setup or need to customize specific components:

### Step 1: Environment Configuration

1. **Copy environment template**

   ```bash
   cp env.example .env
   ```

2. **Configure environment variables**

   ```bash
   # Edit .env file with your values
   nano .env
   ```

3. **Required configurations**

   ```env
   # Server Configuration
   NODE_ENV=development
   PORT=3000
   HOST=0.0.0.0

   # Database Configuration
   MONGODB_URI=mongodb://localhost:27017/bachelor-mess

   # JWT Configuration (will be auto-generated)
   JWT_SECRET=your-secure-jwt-secret
   JWT_REFRESH_SECRET=your-secure-refresh-secret

   # Cloudinary Configuration (for file uploads)
   CLOUDINARY_CLOUD_NAME=your-cloud-name
   CLOUDINARY_API_KEY=your-api-key
   CLOUDINARY_API_SECRET=your-api-secret
   ```

### Step 2: Install Dependencies

```bash
npm install
```

### Step 3: Create Directories

```bash
mkdir -p logs uploads backups temp
```

### Step 4: Generate Secure Secrets

```bash
node scripts/generate-secrets.js
```

### Step 5: Database Setup

#### Option A: Local MongoDB

1. **Install MongoDB**

   ```bash
   # macOS (using Homebrew)
   brew install mongodb-community

   # Ubuntu/Debian
   sudo apt-get install mongodb

   # Windows
   # Download from https://www.mongodb.com/try/download/community
   ```

2. **Start MongoDB**

   ```bash
   # macOS
   brew services start mongodb-community

   # Ubuntu/Debian
   sudo systemctl start mongod

   # Windows
   # Start MongoDB service
   ```

#### Option B: Docker MongoDB

```bash
# Start MongoDB with Docker
docker run -d \
  --name mongodb \
  -p 27017:27017 \
  -v mongodb_data:/data/db \
  mongo:6.0

# Or use Docker Compose
docker-compose up mongo -d
```

#### Option C: MongoDB Atlas (Cloud)

1. Create account at [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Create a cluster
3. Get connection string
4. Update `MONGODB_URI_PROD` in `.env`

### Step 6: Verify Setup

```bash
# Run health check
npm run health:check

# Run tests
npm test

# Run linting
npm run lint
```

## 🐳 Docker Setup

### Complete Docker Environment

```bash
# Start all services (API, MongoDB, Redis, Mongo Express)
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Individual Docker Services

```bash
# Build API image
npm run docker:build

# Run API container
npm run docker:run

# Start MongoDB only
docker-compose up mongo -d

# Start Redis only
docker-compose up redis -d
```

### Docker Environment Variables

The `docker-compose.yml` includes all necessary environment variables. You can override them by creating a `.env` file in the project root.

## 🔒 Security Configuration

### JWT Secrets

The setup automatically generates secure JWT secrets. If you need to regenerate:

```bash
# Generate new secrets
node scripts/generate-secrets.js

# Or manually update .env
JWT_SECRET=your-64-character-secret
JWT_REFRESH_SECRET=your-64-character-refresh-secret
```

### Environment-Specific Security

#### Development

```env
NODE_ENV=development
ENABLE_SECURITY=true
LOG_LEVEL=debug
```

#### Production

```env
NODE_ENV=production
ENABLE_SECURITY=true
LOG_LEVEL=info
ENABLE_MONITORING=true
```

#### Testing

```env
NODE_ENV=test
ENABLE_SECURITY=false
LOG_LEVEL=error
```

## 📊 Database Configuration

### Connection Options

```env
# Basic connection
MONGODB_URI=mongodb://localhost:27017/bachelor-mess

# With authentication
MONGODB_URI=mongodb://username:password@localhost:27017/bachelor-mess

# MongoDB Atlas
MONGODB_URI_PROD=mongodb+srv://username:password@cluster.mongodb.net/bachelor-mess
```

### Connection Pool Settings

```env
MONGODB_MAX_POOL_SIZE=10
MONGODB_MIN_POOL_SIZE=2
MONGODB_SERVER_SELECTION_TIMEOUT=5000
MONGODB_SOCKET_TIMEOUT=45000
MONGODB_MAX_IDLE_TIME=30000
```

## 🔧 Development Tools

### Code Quality

```bash
# Linting
npm run lint              # Check code style
npm run lint:fix          # Fix code style issues
npm run lint:check        # Strict linting check

# Formatting
npm run format            # Format code
npm run format:check      # Check formatting

# Security
npm run security-check    # Security audit
npm run security-fix      # Fix vulnerabilities
```

### Testing

```bash
# Run all tests
npm test

# Run specific test types
npm run test:unit         # Unit tests only
npm run test:integration  # Integration tests only
npm run test:coverage     # With coverage report

# Watch mode
npm run test:watch        # Run tests in watch mode
```

### Debugging

```bash
# Start with debugging
npm run dev:debug

# Debug with Node.js inspector
node --inspect server.js

# Debug with Chrome DevTools
node --inspect-brk server.js
```

## 📝 Logging Configuration

### Log Levels

```env
LOG_LEVEL=info            # error, warn, info, debug
LOG_FILE_PATH=logs/app.log
ENABLE_LOGGING=true
LOG_MAX_FILES=5
LOG_MAX_SIZE=10m
```

### Log Rotation

```bash
# Manual log rotation
npm run logs:rotate

# View logs
npm run logs:view

# Clear logs
npm run logs:clear
```

## 🔍 Monitoring & Health Checks

### Health Check Endpoint

```bash
# Check application health
curl http://localhost:3000/api/v1/health

# Or use the script
npm run health:check
```

### Monitoring Dashboard

```bash
# Start monitoring
npm run monitor:start

# Check monitoring status
npm run monitor:status
```

## 🚀 Deployment Preparation

### Staging Deployment

```bash
# Run deployment checks
npm run deploy:staging

# This includes:
# - Running all tests
# - Code quality checks
# - Security audit
# - Build verification
```

### Production Deployment

```bash
# Full production deployment
npm run deploy:production

# This includes:
# - All staging checks
# - Docker image build
# - Production configuration
```

## 🐛 Troubleshooting

### Common Issues

#### 1. MongoDB Connection Failed

```bash
# Check if MongoDB is running
docker-compose up mongo -d

# Or start local MongoDB
mongod

# Check connection
mongo --eval "db.adminCommand('ping')"
```

#### 2. Port Already in Use

```bash
# Find process using port
lsof -i :3000

# Kill process
kill -9 <PID>

# Or change port in .env
PORT=3001
```

#### 3. Permission Issues

```bash
# Fix file permissions
chmod +x scripts/*.js

# Fix directory permissions
chmod 755 logs uploads backups
```

#### 4. Node.js Version Issues

```bash
# Check Node.js version
node --version

# Install correct version (using nvm)
nvm install 18
nvm use 18
```

#### 5. Dependency Issues

```bash
# Clear npm cache
npm cache clean --force

# Remove node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Debug Mode

```bash
# Start with verbose logging
NODE_ENV=development LOG_LEVEL=debug npm run dev

# Start with debugging enabled
npm run dev:debug
```

### Log Analysis

```bash
# View real-time logs
npm run logs:view

# Search for errors
grep "ERROR" logs/app.log

# Search for specific patterns
grep "MongoDB" logs/app.log
```

## 📚 Additional Resources

### Documentation

- [API Documentation](./API_REQUIREMENT_DOC.md)
- [Authentication Guide](./AUTHENTICATION_IMPLEMENTATION.md)
- [Uniform Utilities Guide](./UNIFORM_UTILITIES_GUIDE.md)

### External Resources

- [Node.js Documentation](https://nodejs.org/docs/)
- [Express.js Guide](https://expressjs.com/)
- [MongoDB Documentation](https://docs.mongodb.com/)
- [JWT.io](https://jwt.io/)

### Community Support

- GitHub Issues
- Stack Overflow
- Node.js Community

## ✅ Verification Checklist

After setup, verify these items:

- [ ] Node.js version is 18+ (`node --version`)
- [ ] MongoDB is running and accessible
- [ ] Environment variables are configured
- [ ] Dependencies are installed (`npm list`)
- [ ] Health check passes (`npm run health:check`)
- [ ] Tests pass (`npm test`)
- [ ] Linting passes (`npm run lint`)
- [ ] Application starts without errors (`npm run dev`)
- [ ] API endpoints are accessible
- [ ] Database collections are created
- [ ] Default admin user exists
- [ ] Logs are being written
- [ ] File uploads work (if Cloudinary configured)

## 🎉 Success!

Your Bachelor Mess Manager Backend is now perfectly configured and ready for development!

**Next Steps:**

1. Configure your specific environment variables
2. Set up Cloudinary for file uploads
3. Start developing your features
4. Deploy to your preferred platform

**Happy Coding! 🚀**
