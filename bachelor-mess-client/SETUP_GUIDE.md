# Bachelor Mess Manager - Complete Setup Guide

This guide will help you set up both the client (React Native/Expo) and backend (Node.js/Express) for the Bachelor Mess Manager application.

## 📋 Prerequisites

- **Node.js** (v14 or higher)
- **npm** or **yarn**
- **Expo CLI** (`npm install -g @expo/cli`)
- **MongoDB** (local installation or MongoDB Atlas account)
- **Cloudinary** account (for file uploads)

## 🏗️ Project Structure

```
bachelor-mess-client/
├── app/                    # Expo Router screens
├── components/            # Reusable components
├── services/             # API services
├── assets/               # Images, fonts, etc.
├── package.json          # Client dependencies
└── ...

bachelor-mess-server/
├── controllers/          # Route handlers
├── models/              # Mongoose models
├── routes/              # Express routes
├── middleware/          # Custom middleware
├── uploads/             # File upload directory
├── package.json         # Server dependencies
├── server.js            # Main server file
└── ...
```

## 🚀 Quick Start

### 1. Clone and Setup

```bash
# Navigate to the project directory
cd bachelor-mess-client

# Install client dependencies
npm install

# Navigate to server directory
cd bachelor-mess-server

# Install server dependencies
npm install
```

### 2. Environment Configuration

#### Backend Environment (.env)

Create `bachelor-mess-server/.env`:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# MongoDB Configuration
MONGO_URI=mongodb://localhost:27017/bachelor-mess
# For MongoDB Atlas:
# MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/bachelor-mess

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# CORS Configuration
CORS_ORIGIN=http://localhost:3000
```

#### Client Configuration

Update `services/api.js` with your backend URL:

```javascript
const api = axios.create({
  baseURL: "http://localhost:5000/api", // Update with your backend URL
  // ...
});
```

### 3. Database Setup

#### Option A: Local MongoDB

1. Install MongoDB locally
2. Start MongoDB service
3. Create database: `bachelor-mess`

#### Option B: MongoDB Atlas

1. Create MongoDB Atlas account
2. Create a new cluster
3. Get connection string
4. Update `MONGO_URI` in `.env`

### 4. Cloudinary Setup

1. Create Cloudinary account
2. Get your credentials from dashboard
3. Update `.env` with your credentials

### 5. Start the Applications

#### Start Backend

```bash
cd bachelor-mess-server

# Development mode
npm run dev

# Production mode
npm start
```

#### Start Client

```bash
cd bachelor-mess-client

# Start Expo development server
npm start

# Or run on specific platform
npm run android
npm run ios
npm run web
```

## 🔧 Development Workflow

### Backend Development

1. **Start server**: `npm run dev`
2. **Test endpoints**: Use Postman or curl
3. **View logs**: Check console output
4. **Database**: Use MongoDB Compass or Atlas

### Client Development

1. **Start Expo**: `npm start`
2. **Scan QR code**: Use Expo Go app
3. **Hot reload**: Changes appear instantly
4. **Debug**: Use React Native Debugger

## 📱 Testing the Application

### 1. Backend Health Check

```bash
curl http://localhost:5000/api/health
```

Expected response:

```json
{
  "message": "Server is running",
  "timestamp": "2024-01-16T10:30:00.000Z"
}
```

### 2. Create Test User

```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Admin",
    "email": "admin@test.com",
    "password": "password123",
    "role": "admin"
  }'
```

### 3. Login

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@test.com",
    "password": "password123"
  }'
```

### 4. Test Client Connection

1. Open the mobile app
2. Try to login with test credentials
3. Check if API calls work

## 🔐 Authentication Flow

1. **Register/Login**: Get JWT token
2. **Store token**: Client stores in AsyncStorage
3. **API calls**: Include token in Authorization header
4. **Token refresh**: Handle expired tokens

## 📊 API Endpoints Summary

### Authentication

- `POST /api/auth/register` - Register user
- `POST /api/auth/login` - Login user

### Users (Admin)

- `GET /api/users/all` - Get all users
- `POST /api/users/create` - Create user
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

### Meals

- `POST /api/meals/submit` - Submit daily meals
- `GET /api/meals/user` - Get user's meals
- `GET /api/meals/all` - Get all meals (admin)
- `PUT /api/meals/:id/status` - Approve/reject meal

### Bazar

- `POST /api/bazar/submit` - Submit bazar entry
- `GET /api/bazar/user` - Get user's bazar entries
- `GET /api/bazar/all` - Get all bazar entries (admin)
- `PUT /api/bazar/:id/status` - Approve/reject bazar

## 🐛 Troubleshooting

### Common Issues

1. **MongoDB Connection Error**

   - Check if MongoDB is running
   - Verify connection string
   - Check network connectivity

2. **CORS Errors**

   - Verify CORS_ORIGIN in .env
   - Check client URL configuration

3. **JWT Errors**

   - Verify JWT_SECRET is set
   - Check token format in requests

4. **File Upload Issues**
   - Verify Cloudinary credentials
   - Check file size limits
   - Ensure uploads directory exists

### Debug Commands

```bash
# Check server status
curl http://localhost:5000/api/health

# Check MongoDB connection
mongo --eval "db.runCommand('ping')"

# View server logs
tail -f bachelor-mess-server/logs/app.log

# Test specific endpoint
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"test"}'
```

## 🚀 Deployment

### Backend Deployment

1. **Environment Variables**

   - Set `NODE_ENV=production`
   - Use strong `JWT_SECRET`
   - Configure production MongoDB
   - Set up Cloudinary

2. **Hosting Options**
   - **Render**: Easy deployment
   - **Railway**: Good for Node.js
   - **Heroku**: Traditional choice
   - **Vercel**: Good for APIs

### Client Deployment

1. **Build for Production**

   ```bash
   expo build:android
   expo build:ios
   ```

2. **Publish to Stores**
   - Google Play Store
   - Apple App Store

## 📚 Additional Resources

- [Expo Documentation](https://docs.expo.dev/)
- [React Native Documentation](https://reactnative.dev/)
- [Express.js Documentation](https://expressjs.com/)
- [MongoDB Documentation](https://docs.mongodb.com/)
- [JWT Documentation](https://jwt.io/)

## 🤝 Contributing

1. Fork the repository
2. Create feature branch
3. Make changes
4. Test thoroughly
5. Submit pull request

## 📄 License

This project is licensed under the ISC License.

---

**Happy Coding! 🎉**
