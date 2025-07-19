# Bachelor Mess Management API

A comprehensive RESTful API for managing bachelor mess operations including meal tracking, expense management, user administration, and analytics.

## 🚀 Features

- **JWT Authentication** with role-based access control
- **Real-time Analytics** with multiple timeframe support
- **File Upload** for receipt images (Cloudinary integration)
- **Comprehensive CRUD** operations for all entities
- **Advanced Filtering** and search capabilities
- **Statistics & Reporting** with aggregation pipelines
- **High Security** with multiple security layers
- **Scalable Architecture** with proper error handling

## 🛠️ Tech Stack

- **Runtime**: Node.js (v18+)
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (JSON Web Tokens)
- **File Upload**: Multer + Cloudinary
- **Validation**: Express-validator + Joi
- **Security**: Helmet, CORS, Rate Limiting, XSS Protection
- **Logging**: Winston
- **Testing**: Jest

## 📋 Prerequisites

- Node.js (v18 or higher)
- MongoDB (local or Atlas)
- Cloudinary account (for file uploads)

## 🚀 Quick Start

### 1. Clone the repository

```bash
git clone <repository-url>
cd bachelor-mess-api
```

### 2. Install dependencies

```bash
npm install
```

### 3. Environment setup

```bash
# Copy environment template
cp env.example .env

# Edit .env with your configuration
nano .env
```

### 4. Database setup

Make sure MongoDB is running locally or update the `MONGODB_URI` in your `.env` file.

### 5. Start the server

```bash
# Development mode
npm run dev

# Production mode
npm start
```

The API will be available at `http://localhost:3000`

## 🔧 Environment Variables

Create a `.env` file in the root directory:

```env
# Server Configuration
NODE_ENV=development
PORT=3000

# Database Configuration
MONGODB_URI=mongodb://localhost:27017/bachelor-mess
MONGODB_URI_PROD=mongodb+srv://username:password@cluster.mongodb.net/bachelor-mess

# JWT Configuration
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

## 📚 API Documentation

### Authentication Endpoints

#### Register User
```http
POST /api/auth/register
Content-Type: application/json

{
  "name": "Mahbub Alam",
  "email": "mahbub@example.com",
  "password": "SecurePass123",
  "role": "member"
}
```

#### Login User
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "mahbub@example.com",
  "password": "SecurePass123"
}
```

### Meal Management

#### Submit Daily Meals
```http
POST /api/meals/submit
Authorization: Bearer <token>
Content-Type: application/json

{
  "breakfast": true,
  "lunch": false,
  "dinner": true,
  "date": "2024-01-15",
  "notes": "Extra rice for dinner"
}
```

#### Get User Meals
```http
GET /api/meals/user?startDate=2024-01-01&endDate=2024-01-31&status=approved&limit=10
Authorization: Bearer <token>
```

### Bazar Management

#### Submit Bazar Entry
```http
POST /api/bazar/submit
Authorization: Bearer <token>
Content-Type: multipart/form-data

items: [{"name": "Rice", "quantity": "5kg", "price": 250}]
totalAmount: 1250
description: "Weekly grocery shopping"
date: 2024-01-15
receiptImage: [file upload]
```

#### Get Bazar Entries
```http
GET /api/bazar/user?startDate=2024-01-01&endDate=2024-01-31&status=approved&limit=10
Authorization: Bearer <token>
```

### Dashboard & Analytics

#### Get Dashboard Stats
```http
GET /api/dashboard/stats
Authorization: Bearer <token>
```

#### Get Analytics Data
```http
GET /api/analytics?timeframe=week
Authorization: Bearer <token>
```

### User Management (Admin Only)

#### Get All Users
```http
GET /api/users/all?status=active&role=member&search=mahbub
Authorization: Bearer <token>
```

#### Create User
```http
POST /api/users/create
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "New User",
  "email": "newuser@example.com",
  "password": "SecurePass123",
  "phone": "+880 1712-345678",
  "role": "member"
}
```

## 🔒 Security Features

- **JWT Authentication** with refresh tokens
- **Role-based Access Control** (Admin/Member)
- **Rate Limiting** to prevent abuse
- **Input Validation** with express-validator and Joi
- **XSS Protection** with xss-clean
- **NoSQL Injection Protection** with mongo-sanitize
- **CORS Configuration** for cross-origin requests
- **Helmet** for security headers
- **Password Hashing** with bcryptjs
- **File Upload Security** with type and size validation

## 📊 Database Models

### User Model
- Authentication and authorization
- Profile management
- Role-based access control
- Activity tracking

### Meal Model
- Daily meal tracking (breakfast, lunch, dinner)
- Approval workflow
- Statistics and analytics
- Date-based queries

### Bazar Model
- Expense tracking with items
- Receipt image upload
- Approval workflow
- Category breakdown

## 🧪 Testing

```bash
# Run tests
npm test

# Run tests in watch mode
npm run test:watch
```

## 📝 Scripts

```bash
# Development
npm run dev

# Production
npm start

# Testing
npm test
npm run test:watch

# Linting
npm run lint
npm run lint:fix

# Security check
npm run security-check

# Code formatting
npm run format
```

## 🚀 Deployment

### Local Development
```bash
npm run dev
```

### Production Deployment
1. Set `NODE_ENV=production`
2. Configure production MongoDB URI
3. Set secure JWT secrets
4. Configure Cloudinary credentials
5. Set up proper CORS origins
6. Run `npm start`

### Docker Deployment
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

## 📁 Project Structure

```
src/
├── config/
│   └── database.js          # Database configuration
├── middleware/
│   ├── auth.js             # JWT authentication
│   ├── errorHandler.js     # Global error handling
│   ├── notFound.js         # 404 handler
│   ├── upload.js           # File upload middleware
│   └── validation.js       # Input validation
├── models/
│   ├── User.js            # User model
│   ├── Meal.js            # Meal model
│   └── Bazar.js           # Bazar model
├── routes/
│   ├── auth.js            # Authentication routes
│   ├── dashboard.js       # Dashboard routes
│   ├── meals.js           # Meal management routes
│   ├── bazar.js           # Bazar management routes
│   ├── users.js           # User management routes
│   └── analytics.js       # Analytics routes
└── utils/
    └── logger.js          # Logging utility
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Run the test suite
6. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Contact the development team
- Check the API documentation

## 🔄 Version History

- **v1.0.0** - Initial release with core functionality
- Complete CRUD operations for all entities
- JWT authentication with role-based access
- File upload with Cloudinary integration
- Comprehensive analytics and reporting
- High-security implementation

---

**Built with ❤️ for efficient mess management** 