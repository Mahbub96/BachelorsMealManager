# Bachelor Mess API - Setup Guide

## 🚀 Complete Setup Instructions

This guide will help you set up the Bachelor Mess API from scratch.

## 📋 Prerequisites

1. **Node.js** (v18 or higher)
2. **MongoDB** (local installation or MongoDB Atlas account)
3. **Cloudinary** account (for file uploads)
4. **Git** (for version control)

## 🛠️ Installation Steps

### Step 1: Clone and Setup

```bash
# Clone the repository (if using git)
git clone <repository-url>
cd bachelor-mess-api

# Or create the project directory
mkdir bachelor-mess-api
cd bachelor-mess-api
```

### Step 2: Install Dependencies

```bash
npm install
```

### Step 3: Environment Configuration

```bash
# Copy the environment template
cp env.example .env

# Edit the .env file with your configuration
nano .env
```

**Required Environment Variables:**

```env
# Server Configuration
NODE_ENV=development
PORT=3000

# Database Configuration
MONGODB_URI=mongodb://localhost:27017/bachelor-mess
MONGODB_URI_PROD=mongodb+srv://username:password@cluster.mongodb.net/bachelor-mess

# JWT Configuration (CHANGE THESE IN PRODUCTION!)
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d
JWT_REFRESH_SECRET=your-refresh-secret-key
JWT_REFRESH_EXPIRES_IN=30d

# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Security Configuration
BCRYPT_ROUNDS=12
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
SLOW_DOWN_DELAY_MS=500

# File Upload Configuration
MAX_FILE_SIZE=5242880
ALLOWED_FILE_TYPES=image/jpeg,image/png,image/webp

# Logging Configuration
LOG_LEVEL=info
LOG_FILE_PATH=logs/app.log

# CORS Configuration
CORS_ORIGIN=http://localhost:3000,http://localhost:3001
CORS_CREDENTIALS=true

# API Configuration
API_PREFIX=/api
API_VERSION=v1
```

### Step 4: Database Setup

#### Option A: Local MongoDB

1. Install MongoDB locally
2. Start MongoDB service
3. Create database: `bachelor-mess`

#### Option B: MongoDB Atlas

1. Create MongoDB Atlas account
2. Create a new cluster
3. Get connection string
4. Update `MONGODB_URI_PROD` in `.env`

### Step 5: Cloudinary Setup

1. Create Cloudinary account
2. Get your credentials from dashboard
3. Update Cloudinary variables in `.env`

### Step 6: Start the Server

```bash
# Development mode
npm run dev

# Production mode
npm start
```

The API will be available at `http://localhost:3000`

## 🧪 Testing the API

### Health Check

```bash
curl http://localhost:3000/health
```

Expected response:
```json
{
  "success": true,
  "message": "Bachelor Mess API is running",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "environment": "development",
  "version": "1.0.0"
}
```

### Register a User

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Admin User",
    "email": "admin@example.com",
    "password": "AdminPass123",
    "role": "admin"
  }'
```

### Login

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "AdminPass123"
  }'
```

## 🐳 Docker Setup

### Using Docker Compose

```bash
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f app

# Stop services
docker-compose down
```

### Manual Docker Build

```bash
# Build the image
docker build -t bachelor-mess-api .

# Run the container
docker run -p 3000:3000 --env-file .env bachelor-mess-api
```

## 📊 API Endpoints Overview

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update user profile
- `POST /api/auth/refresh` - Refresh token
- `POST /api/auth/logout` - User logout

### Dashboard
- `GET /api/dashboard/stats` - Get dashboard statistics
- `GET /api/dashboard/activities` - Get recent activities
- `GET /api/dashboard` - Get combined dashboard data

### Meals
- `POST /api/meals/submit` - Submit daily meals
- `GET /api/meals/user` - Get user meals
- `GET /api/meals/all` - Get all meals (admin)
- `PUT /api/meals/:id/status` - Update meal status (admin)
- `GET /api/meals/stats` - Get meal statistics (admin)

### Bazar
- `POST /api/bazar/submit` - Submit bazar entry
- `GET /api/bazar/user` - Get user bazar entries
- `GET /api/bazar/all` - Get all bazar entries (admin)
- `PUT /api/bazar/:id/status` - Update bazar status (admin)
- `GET /api/bazar/stats` - Get bazar statistics (admin)

### Users (Admin Only)
- `GET /api/users/all` - Get all users
- `GET /api/users/:id` - Get user by ID
- `POST /api/users/create` - Create user
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

### Analytics
- `GET /api/analytics` - Get analytics data
- `GET /api/analytics/meals` - Get meal analytics
- `GET /api/analytics/expenses` - Get expense analytics
- `GET /api/analytics/users` - Get user analytics (admin)
- `GET /api/analytics/comparison` - Get comparison analytics
- `GET /api/analytics/realtime` - Get real-time analytics

## 🔒 Security Features

### Authentication & Authorization
- JWT-based authentication
- Role-based access control (Admin/Member)
- Password hashing with bcrypt
- Token refresh mechanism

### Input Validation
- Express-validator for request validation
- Joi for complex schema validation
- XSS protection
- NoSQL injection protection

### Rate Limiting
- Request rate limiting
- Slow down mechanism
- IP-based restrictions

### File Upload Security
- File type validation
- File size limits
- Secure upload to Cloudinary

## 📝 Development Workflow

### Code Quality

```bash
# Lint code
npm run lint

# Fix linting issues
npm run lint:fix

# Format code
npm run format

# Security audit
npm run security-check
```

### Testing

```bash
# Run tests
npm test

# Run tests in watch mode
npm run test:watch
```

### Database Management

```bash
# Access MongoDB shell
mongosh bachelor-mess

# Backup database
mongodump --db bachelor-mess --out ./backup

# Restore database
mongorestore --db bachelor-mess ./backup/bachelor-mess
```

## 🚀 Production Deployment

### Environment Setup

1. Set `NODE_ENV=production`
2. Use strong JWT secrets
3. Configure production MongoDB URI
4. Set up proper CORS origins
5. Configure Cloudinary credentials

### Performance Optimization

1. Enable compression
2. Use PM2 for process management
3. Set up monitoring and logging
4. Configure load balancing
5. Use CDN for static files

### Security Checklist

- [ ] Change default JWT secrets
- [ ] Set up HTTPS
- [ ] Configure firewall rules
- [ ] Enable rate limiting
- [ ] Set up monitoring
- [ ] Regular security audits
- [ ] Database backups
- [ ] Log monitoring

## 🆘 Troubleshooting

### Common Issues

1. **MongoDB Connection Error**
   - Check if MongoDB is running
   - Verify connection string
   - Check network connectivity

2. **JWT Token Issues**
   - Verify JWT_SECRET is set
   - Check token expiration
   - Validate token format

3. **File Upload Errors**
   - Check Cloudinary credentials
   - Verify file size limits
   - Check file type restrictions

4. **CORS Errors**
   - Update CORS_ORIGIN in .env
   - Check frontend origin
   - Verify CORS configuration

### Logs

```bash
# View application logs
tail -f logs/combined.log

# View error logs
tail -f logs/error.log

# View Docker logs
docker-compose logs -f app
```

## 📞 Support

For issues and questions:
1. Check the logs for error messages
2. Verify environment configuration
3. Test individual endpoints
4. Check database connectivity
5. Review security settings

## 🔄 Updates and Maintenance

### Regular Maintenance Tasks

1. **Weekly**
   - Check application logs
   - Monitor performance metrics
   - Review security alerts

2. **Monthly**
   - Update dependencies
   - Backup database
   - Review access logs
   - Security audit

3. **Quarterly**
   - Performance optimization
   - Security updates
   - Feature updates
   - Documentation review

---

**Happy Coding! 🎉** 