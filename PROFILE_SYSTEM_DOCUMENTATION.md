# User Profile System Documentation

## Overview

The User Profile System provides a complete solution for managing user profiles in the Bachelor Mess Manager application. It includes both backend API endpoints and frontend components with comprehensive validation, security, and user experience features.

## 🏗️ Architecture

### Backend Components

1. **User Model** (`src/models/User.js`)

   - Comprehensive user schema with validation
   - Password hashing and security features
   - Virtual properties for profile data
   - Instance methods for authentication

2. **User Controller** (`src/controllers/userController.js`)

   - Profile retrieval and update logic
   - Password change functionality
   - Security validation
   - Error handling

3. **Validation Middleware** (`src/middleware/validation.js`)

   - Profile update validation
   - Password strength requirements
   - Phone number format validation
   - Custom validation rules

4. **Routes** (`src/routes/users.js`)
   - RESTful API endpoints
   - Authentication middleware
   - Role-based access control

### Frontend Components

1. **Profile Screen** (`app/profile.tsx`)

   - Main profile display
   - Navigation to edit profile
   - Menu items for account management

2. **Edit Profile Screen** (`app/edit-profile.tsx`)

   - Form-based profile editing
   - Password change functionality
   - Real-time validation
   - Error handling

3. **ProfileCard Component** (`components/ProfileCard.tsx`)
   - Reusable profile display component
   - Responsive design
   - Action buttons support

## 🔧 API Endpoints

### Get Current User Profile

```http
GET /api/users/profile
Authorization: Bearer <token>
```

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "+880 1712-345678",
    "role": "member",
    "status": "active",
    "joinDate": "2024-01-01T00:00:00.000Z",
    "lastLogin": "2024-01-15T10:30:00.000Z",
    "isEmailVerified": true,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

### Update Current User Profile

```http
PUT /api/users/profile
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Updated Name",
  "phone": "+880 1712-345679",
  "currentPassword": "OldPassword123",
  "newPassword": "NewPassword123",
  "confirmPassword": "NewPassword123"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Profile updated successfully",
  "data": {
    "id": "507f1f77bcf86cd799439011",
    "name": "Updated Name",
    "email": "john@example.com",
    "phone": "+880 1712-345679",
    "role": "member",
    "status": "active",
    "joinDate": "2024-01-01T00:00:00.000Z",
    "lastLogin": "2024-01-15T10:30:00.000Z",
    "isEmailVerified": true,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

## 🔒 Security Features

### Password Security

- **Hashing**: Passwords are hashed using bcrypt with 12 rounds
- **Validation**: Strong password requirements enforced
- **Current Password Verification**: Required for password changes
- **Password History**: Tracks password change timestamps

### Input Validation

- **Name**: 2-50 characters, required
- **Phone**: International format validation
- **Email**: Format and uniqueness validation
- **Password**: Minimum 6 characters with complexity requirements

### Access Control

- **Authentication Required**: All profile endpoints require valid JWT
- **Self-Only Updates**: Users can only update their own profile
- **Role Protection**: Email, role, and status cannot be changed via profile endpoint

## 📱 Frontend Features

### Profile Display

- **Responsive Design**: Works on all screen sizes
- **Real-time Updates**: Profile changes reflect immediately
- **Error Handling**: User-friendly error messages
- **Loading States**: Visual feedback during operations

### Edit Profile Form

- **Form Validation**: Real-time client-side validation
- **Password Change**: Secure password update with confirmation
- **Field Validation**: Input format and length validation
- **Success Feedback**: Confirmation messages for successful updates

### User Experience

- **Intuitive Navigation**: Easy access to profile features
- **Visual Design**: Modern, clean interface
- **Accessibility**: Screen reader support and keyboard navigation
- **Offline Support**: Graceful handling of network issues

## 🧪 Testing

### Backend Tests

- **Unit Tests**: Model and controller testing
- **Integration Tests**: API endpoint testing
- **Validation Tests**: Input validation coverage
- **Security Tests**: Authentication and authorization

### Frontend Tests

- **Component Tests**: ProfileCard and form components
- **Integration Tests**: Profile update flow
- **Validation Tests**: Form validation logic
- **User Experience Tests**: Navigation and interactions

## 📊 Data Flow

### Profile Retrieval

1. User requests profile data
2. Backend validates JWT token
3. Database query for user data
4. Response with profile information
5. Frontend displays profile data

### Profile Update

1. User submits update form
2. Frontend validates input
3. Backend receives update request
4. Server validates data and permissions
5. Database update with new information
6. Response with updated profile
7. Frontend updates UI

### Password Change

1. User enters current and new passwords
2. Frontend validates password strength
3. Backend verifies current password
4. Server hashes new password
5. Database updates password hash
6. Response confirms password change
7. Frontend shows success message

## 🚀 Best Practices

### Backend

- **Input Validation**: Comprehensive validation at multiple layers
- **Error Handling**: Detailed error messages for debugging
- **Security**: Password hashing and JWT authentication
- **Performance**: Database indexing and query optimization
- **Logging**: Comprehensive logging for monitoring

### Frontend

- **State Management**: Centralized state with React hooks
- **Form Handling**: Controlled components with validation
- **Error Boundaries**: Graceful error handling
- **Performance**: Memoization and optimization
- **Accessibility**: ARIA labels and keyboard navigation

### Security

- **Authentication**: JWT-based authentication
- **Authorization**: Role-based access control
- **Input Sanitization**: XSS and injection prevention
- **Password Security**: Strong hashing and validation
- **HTTPS**: Secure communication protocols

## 🔧 Configuration

### Environment Variables

```env
# JWT Configuration
JWT_SECRET=your-jwt-secret
JWT_EXPIRES_IN=7d
JWT_REFRESH_SECRET=your-refresh-secret
JWT_REFRESH_EXPIRES_IN=30d

# Password Hashing
BCRYPT_ROUNDS=12

# Database
MONGODB_URI=mongodb://localhost:27017/bachelor-mess

# Server
PORT=5000
NODE_ENV=development
```

### Validation Rules

```javascript
// Name validation
name: {
  minLength: 2,
  maxLength: 50,
  required: true
}

// Phone validation
phone: {
  pattern: /^[+]?[1-9][\d]{0,15}$/,
  optional: true
}

// Password validation
password: {
  minLength: 6,
  pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
  required: true
}
```

## 📈 Performance Considerations

### Backend Optimization

- **Database Indexing**: Indexed fields for faster queries
- **Caching**: Redis caching for frequently accessed data
- **Query Optimization**: Efficient database queries
- **Connection Pooling**: Database connection management

### Frontend Optimization

- **Lazy Loading**: Components loaded on demand
- **Memoization**: React.memo for expensive components
- **Bundle Optimization**: Code splitting and tree shaking
- **Image Optimization**: Compressed and optimized images

## 🐛 Troubleshooting

### Common Issues

1. **Authentication Errors**

   - Check JWT token validity
   - Verify token expiration
   - Ensure proper Authorization header

2. **Validation Errors**

   - Review input format requirements
   - Check field length limits
   - Verify password complexity rules

3. **Database Errors**

   - Check database connection
   - Verify user exists
   - Review database permissions

4. **Frontend Issues**
   - Clear browser cache
   - Check network connectivity
   - Review console errors

### Debug Steps

1. **Backend Debugging**

   ```bash
   # Check server logs
   npm run dev

   # Run tests
   npm test

   # Check database
   mongo bachelor-mess
   ```

2. **Frontend Debugging**

   ```bash
   # Start development server
   npm start

   # Check Metro logs
   npx react-native log-android
   ```

## 📚 Additional Resources

- [API Documentation](./API_REQUIREMENT_DOC.md)
- [Authentication Guide](./AUTHENTICATION_IMPLEMENTATION.md)
- [Best Practices Guide](./BEST_PRACTICES_GUIDE.md)
- [Testing Guide](./tests/README.md)

## 🤝 Contributing

When contributing to the profile system:

1. **Follow Code Style**: Use ESLint and Prettier
2. **Write Tests**: Include unit and integration tests
3. **Update Documentation**: Keep docs current
4. **Security Review**: Ensure security best practices
5. **Performance Testing**: Verify performance impact

## 📄 License

This profile system is part of the Bachelor Mess Manager application and follows the same licensing terms as the main project.
