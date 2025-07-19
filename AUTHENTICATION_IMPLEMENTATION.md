# Authentication Implementation Guide

## Overview

This document describes the complete authentication system implemented for the Mess Manager Application, including both backend API and React Native client.

## 🏗️ Architecture

### Backend (Node.js + Express + MongoDB)

- **Framework**: Express.js with MongoDB
- **Authentication**: JWT (JSON Web Tokens)
- **Password Hashing**: bcryptjs
- **Validation**: express-validator
- **Security**: Helmet, CORS, Rate Limiting

### Frontend (React Native + Expo)

- **Framework**: React Native with Expo Router
- **State Management**: React Context API
- **Storage**: AsyncStorage for token persistence
- **HTTP Client**: Custom HTTP client with interceptors

## 🔐 Authentication Features

### ✅ Implemented Features

1. **User Registration**

   - Email validation
   - Password strength requirements
   - Duplicate email prevention
   - Role-based registration (admin/member)

2. **User Login**

   - Email/password authentication
   - JWT token generation
   - Refresh token support
   - Automatic token storage

3. **Session Management**

   - Token persistence across app restarts
   - Automatic token refresh
   - Secure logout functionality

4. **Security Features**
   - Password hashing with bcrypt
   - JWT token expiration
   - Rate limiting
   - Input validation and sanitization

## 📱 React Native Implementation

### Authentication Flow

1. **App Launch**

   ```
   App Start → AuthGuard → Check Stored Token → Route to Login or Main App
   ```

2. **Login Process**

   ```
   Login Screen → API Call → Store Token → Navigate to Main App
   ```

3. **Registration Process**
   ```
   Signup Screen → API Call → Success Alert → Navigate to Login
   ```

### Key Components

#### 1. AuthContext (`context/AuthContext.tsx`)

```typescript
interface AuthContextType {
  user: User | null;
  token: string | null;
  role: string | null;
  setAuth: (data: AuthData) => void;
  logout: () => Promise<void>;
  isLoading: boolean;
}
```

#### 2. AuthService (`services/authService.ts`)

- Handles all authentication API calls
- Manages token storage and retrieval
- Provides automatic token refresh

#### 3. AuthGuard (`components/AuthGuard.tsx`)

- Shows loading screen during authentication check
- Prevents unauthorized access to protected routes

### Screens

#### LoginScreen (`app/LoginScreen.tsx`)

- Modern UI with gradient background
- Form validation
- Error handling
- Navigation to signup

#### SignupScreen (`app/SignupScreen.tsx`)

- Complete registration form
- Password confirmation
- Real-time validation
- Success feedback

## 🔧 Backend Implementation

### API Endpoints

| Endpoint             | Method | Description       | Access  |
| -------------------- | ------ | ----------------- | ------- |
| `/api/auth/register` | POST   | Register new user | Public  |
| `/api/auth/login`    | POST   | User login        | Public  |
| `/api/auth/logout`   | POST   | User logout       | Private |
| `/api/auth/refresh`  | POST   | Refresh token     | Public  |
| `/api/auth/profile`  | GET    | Get user profile  | Private |
| `/api/auth/verify`   | GET    | Verify token      | Private |

### Database Schema

```javascript
// User Model
{
  name: String,
  email: String (unique),
  password: String (hashed),
  role: String (admin/member),
  status: String (active/inactive),
  joinDate: Date,
  lastLogin: Date,
  createdAt: Date
}
```

### Security Features

1. **Password Requirements**

   - Minimum 6 characters
   - At least one uppercase letter
   - At least one lowercase letter
   - At least one number

2. **Token Security**

   - JWT with 7-day expiration
   - Refresh tokens with 30-day expiration
   - Secure token storage

3. **Rate Limiting**
   - 100 requests per 15 minutes per IP
   - Slow down after 50 requests

## 🚀 Getting Started

### Prerequisites

1. **MongoDB** - Running locally or cloud instance
2. **Node.js** - Version 18 or higher
3. **Expo CLI** - For React Native development

### Backend Setup

1. **Install Dependencies**

   ```bash
   cd BachelorMessManagerBackend
   npm install
   ```

2. **Environment Configuration**

   ```bash
   cp env.example .env
   # Edit .env with your configuration
   ```

3. **Start Backend**
   ```bash
   npm run dev
   ```

### Frontend Setup

1. **Install Dependencies**

   ```bash
   cd bachelor-mess-client
   npm install
   ```

2. **Start Development Server**

   ```bash
   npm start
   ```

3. **Run on Device/Simulator**

   ```bash
   # iOS
   npx expo run:ios

   # Android
   npx expo run:android
   ```

## 🧪 Testing

### Backend Testing

Run the authentication test script:

```bash
node test-auth-flow.js
```

This will test:

- User registration
- User login
- Invalid login handling
- Duplicate registration prevention

### Manual Testing

Use these test credentials:

```
Email: john@mess.com
Password: Password123
```

## 📋 API Response Format

### Success Response

```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "jwt_token_here",
    "refreshToken": "refresh_token_here",
    "user": {
      "id": "user_id",
      "name": "User Name",
      "email": "user@example.com",
      "role": "member",
      "status": "active"
    }
  }
}
```

### Error Response

```json
{
  "success": false,
  "error": "Error message",
  "details": [
    {
      "type": "field",
      "value": "invalid_value",
      "msg": "Validation message",
      "path": "field_name"
    }
  ]
}
```

## 🔒 Security Considerations

1. **Token Storage**

   - Tokens stored in AsyncStorage (encrypted in production)
   - Automatic token refresh before expiration
   - Secure logout clears all stored data

2. **API Security**

   - HTTPS required in production
   - CORS properly configured
   - Input validation and sanitization
   - Rate limiting to prevent abuse

3. **Password Security**
   - bcrypt hashing with 12 rounds
   - Strong password requirements
   - No password storage in plain text

## 🛠️ Troubleshooting

### Common Issues

1. **Backend Connection Failed**

   - Check if MongoDB is running
   - Verify port 3000 is available
   - Check environment variables

2. **Login Fails**

   - Verify email/password format
   - Check backend logs for errors
   - Ensure user exists in database

3. **Token Issues**
   - Check JWT secret configuration
   - Verify token expiration settings
   - Clear AsyncStorage and re-login

### Debug Commands

```bash
# Check backend health
curl http://localhost:3000/health

# Test registration
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","email":"test@mess.com","password":"Password123","role":"member"}'

# Test login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@mess.com","password":"Password123"}'
```

## 📈 Future Enhancements

1. **Social Authentication**

   - Google OAuth integration
   - Facebook login support

2. **Advanced Security**

   - Two-factor authentication (2FA)
   - Biometric authentication
   - Device fingerprinting

3. **User Management**

   - Password reset functionality
   - Email verification
   - Account deactivation

4. **Monitoring**
   - Authentication analytics
   - Failed login tracking
   - Security event logging

## 📞 Support

For issues or questions about the authentication implementation:

1. Check the backend logs for detailed error messages
2. Verify API endpoints are accessible
3. Test with the provided test script
4. Review the security configuration

---

**Last Updated**: July 19, 2025
**Version**: 1.0.0
