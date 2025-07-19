# Bachelor Mess Manager Backend

A comprehensive RESTful API for managing bachelor mess operations with modern architecture, security, and scalability.

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18.0.0 or higher
- **npm** 8.0.0 or higher
- **MongoDB** 6.0 or higher
- **Docker** (optional, for containerized setup)

### Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd BachelorMessManagerBackend
   ```

2. **Run the setup script**

   ```bash
   npm run dev:setup
   ```

   This will:
   - Check Node.js version
   - Create `.env` file from `env.example`
   - Install dependencies
   - Generate secure JWT secrets
   - Create necessary directories
   - Run linting and tests

3. **Start the development server**
   ```bash
   npm run dev
   ```

## 🐳 Docker Setup

### Using Docker Compose (Recommended)

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Manual Docker Build

```bash
# Build the image
npm run docker:build

# Run the container
npm run docker:run
```

## 📋 Environment Configuration

### Required Environment Variables

Copy `env.example` to `.env` and configure:

```bash
# Server Configuration
NODE_ENV=development
PORT=3000
HOST=0.0.0.0
API_PREFIX=/api
API_VERSION=v1

# Database Configuration
MONGODB_URI=mongodb://localhost:27017/bachelor-mess
MONGODB_URI_PROD=mongodb+srv://username:password@cluster.mongodb.net/bachelor-mess

# JWT Configuration
JWT_SECRET=your-secure-jwt-secret
JWT_REFRESH_SECRET=your-secure-refresh-secret

# Cloudinary Configuration (for file uploads)
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

### Environment Profiles

- **Development**: `NODE_ENV=development`
- **Production**: `NODE_ENV=production`
- **Testing**: `NODE_ENV=test`

## 🗄️ Database Setup

### MongoDB Connection

The application supports both local and cloud MongoDB instances:

```bash
# Local MongoDB
MONGODB_URI=mongodb://localhost:27017/bachelor-mess

# MongoDB Atlas
MONGODB_URI_PROD=mongodb+srv://username:password@cluster.mongodb.net/bachelor-mess
```

### Database Initialization

The application automatically:

- Creates collections with proper validation
- Sets up indexes for optimal performance
- Creates a default admin user
- Adds sample data for development

### Default Admin Credentials

```
Username: admin
Password: admin123
Email: admin@bachelor-mess.com
```

## 🔧 Available Scripts

### Development

```bash
npm run dev              # Start development server
npm run dev:debug        # Start with debugging
npm run dev:setup        # Run complete setup
```

### Testing

```bash
npm test                 # Run all tests
npm run test:watch       # Run tests in watch mode
npm run test:coverage    # Run tests with coverage
npm run test:unit        # Run unit tests only
npm run test:integration # Run integration tests only
```

### Code Quality

```bash
npm run lint             # Check code style
npm run lint:fix         # Fix code style issues
npm run lint:check       # Strict linting check
npm run format           # Format code with Prettier
npm run format:check     # Check code formatting
```

### Security

```bash
npm run security-check   # Run security audit
npm run security-fix     # Fix security vulnerabilities
```

### Docker

```bash
npm run docker:build           # Build Docker image
npm run docker:run            # Run Docker container
npm run docker:compose        # Start with Docker Compose
npm run docker:compose:down   # Stop Docker Compose
npm run docker:compose:logs   # View Docker logs
npm run docker:compose:restart # Restart services
```

### Database

```bash
npm run db:migrate      # Run database migrations
npm run db:seed         # Seed database with sample data
npm run db:reset        # Reset database
npm run db:backup       # Create database backup
npm run db:restore      # Restore database from backup
```

### Monitoring

```bash
npm run health:check    # Check application health
npm run monitor:start   # Start monitoring
npm run monitor:status  # Check monitoring status
```

### Logs

```bash
npm run logs:view       # View application logs
npm run logs:clear      # Clear log files
npm run logs:rotate     # Rotate log files
```

### Deployment

```bash
npm run deploy:staging    # Deploy to staging
npm run deploy:production # Deploy to production
```

## 🌐 API Endpoints

### Base URL

```
http://localhost:3000/api/v1
```

### Authentication

```
POST   /auth/register     # User registration
POST   /auth/login        # User login
POST   /auth/refresh      # Refresh token
POST   /auth/logout       # User logout
```

### Users

```
GET    /users             # Get all users
GET    /users/:id         # Get user by ID
PUT    /users/:id         # Update user
DELETE /users/:id         # Delete user
```

### Meals

```
GET    /meals             # Get all meals
POST   /meals             # Create meal
GET    /meals/:id         # Get meal by ID
PUT    /meals/:id         # Update meal
DELETE /meals/:id         # Delete meal
```

### Bazar

```
GET    /bazar             # Get all bazar entries
POST   /bazar             # Create bazar entry
GET    /bazar/:id         # Get bazar by ID
PUT    /bazar/:id         # Update bazar
DELETE /bazar/:id         # Delete bazar
```

### Dashboard

```
GET    /dashboard         # Get dashboard data
GET    /dashboard/stats   # Get statistics
GET    /dashboard/analytics # Get analytics
```

### Health & Monitoring

```
GET    /health            # Health check
GET    /metrics           # Application metrics
```

## 🔒 Security Features

- **JWT Authentication** with refresh tokens
- **Rate Limiting** to prevent abuse
- **Input Validation** and sanitization
- **CORS** configuration
- **Helmet** security headers
- **XSS Protection**
- **SQL Injection Protection**
- **Password Hashing** with bcrypt
- **Request Logging**

## 📊 Monitoring & Health Checks

### Health Check Endpoint

```
GET /api/v1/health
```

Response:

```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "environment": "development",
  "version": "1.0.0",
  "checks": {
    "database": {
      "status": "healthy",
      "message": "Database connection is active"
    },
    "memory": {
      "status": "healthy",
      "message": "Memory usage: 45.2MB / 512MB"
    },
    "uptime": { "status": "healthy", "message": "Uptime: 2d 5h 30m" },
    "environment": {
      "status": "healthy",
      "message": "All required environment variables are set"
    }
  }
}
```

## 🐛 Troubleshooting

### Common Issues

1. **MongoDB Connection Failed**

   ```bash
   # Check if MongoDB is running
   docker-compose up mongo

   # Or start local MongoDB
   mongod
   ```

2. **Port Already in Use**

   ```bash
   # Change port in .env
   PORT=3001
   ```

3. **JWT Secret Issues**

   ```bash
   # Regenerate JWT secrets
   npm run dev:setup
   ```

4. **Permission Issues**
   ```bash
   # Fix file permissions
   chmod +x scripts/*.js
   ```

### Logs

View application logs:

```bash
npm run logs:view
```

### Debug Mode

Start with debugging enabled:

```bash
npm run dev:debug
```

## 📁 Project Structure

```
BachelorMessManagerBackend/
├── src/
│   ├── config/          # Configuration files
│   ├── controllers/     # Route controllers
│   ├── middleware/      # Custom middleware
│   ├── models/          # Database models
│   ├── routes/          # API routes
│   └── utils/           # Utility functions
├── scripts/             # Setup and utility scripts
├── tests/               # Test files
├── logs/                # Application logs
├── uploads/             # File uploads
├── backups/             # Database backups
├── docker-compose.yml   # Docker Compose configuration
├── Dockerfile           # Docker configuration
├── server.js            # Main application file
├── healthcheck.js       # Health check script
├── package.json         # Dependencies and scripts
└── env.example          # Environment variables template
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests: `npm test`
5. Run linting: `npm run lint`
6. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:

- Create an issue in the repository
- Check the documentation
- Review the troubleshooting section

---

**Happy Coding! 🚀**
