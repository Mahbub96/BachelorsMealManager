# Bachelor Mess - Complete API Documentation

## Table of Contents

1. [Overview](#overview)
2. [Authentication](#authentication)
3. [Base URL & Configuration](#base-url--configuration)
4. [API Endpoints](#api-endpoints)
   - [Authentication Endpoints](#authentication-endpoints)
   - [Dashboard Endpoints](#dashboard-endpoints)
   - [Meal Management Endpoints](#meal-management-endpoints)
   - [Bazar Management Endpoints](#bazar-management-endpoints)
   - [User Management Endpoints](#user-management-endpoints)
   - [Analytics Endpoints](#analytics-endpoints)
5. [Data Models](#data-models)
6. [Error Handling](#error-handling)
7. [Frontend Integration](#frontend-integration)
8. [Setup & Deployment](#setup--deployment)

## Overview

The Bachelor Mess API is a RESTful service built with Node.js, Express, and MongoDB. It provides comprehensive functionality for managing a bachelor mess (shared accommodation) including meal tracking, expense management, user administration, and analytics.

### Key Features

- **JWT Authentication** with role-based access control
- **Real-time Analytics** with multiple timeframe support
- **File Upload** for receipt images (Cloudinary integration)
- **Comprehensive CRUD** operations for all entities
- **Advanced Filtering** and search capabilities
- **Statistics & Reporting** with aggregation pipelines

## Authentication

### JWT Token Structure

```json
{
  "id": "user_id",
  "role": "admin|member",
  "iat": 1640995200,
  "exp": 1641081600
}
```

### Authentication Headers

```
Authorization: Bearer <jwt_token>
```

### Role-Based Access

- **Admin**: Full access to all endpoints
- **Member**: Limited access to personal data and basic operations

## Base URL & Configuration

### Development

```
http://localhost:3000/api
```

### Production

```
https://your-domain.com/api
```

### Environment Variables

```env
PORT=3000
MONGODB_URI=mongodb://localhost:27017/bachelor-mess
JWT_SECRET=your-secret-key
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

## API Endpoints

### Authentication Endpoints

#### 1. User Registration

**POST** `/api/auth/register`

Register a new user account.

**Request Body:**

```json
{
  "name": "Mahbub Alam",
  "email": "mahbub@example.com",
  "password": "securepassword123",
  "role": "member"
}
```

**Response (201):**

```json
{
  "message": "User registered successfully"
}
```

**Error Responses:**

- `400` - User already exists
- `500` - Server error

#### 2. User Login

**POST** `/api/auth/login`

Authenticate user and receive JWT token.

**Request Body:**

```json
{
  "email": "mahbub@example.com",
  "password": "securepassword123"
}
```

**Response (200):**

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "name": "Mahbub Alam",
    "role": "member"
  }
}
```

**Error Responses:**

- `404` - User not found
- `400` - Invalid credentials
- `500` - Server error

### Dashboard Endpoints

#### 3. Health Check

**GET** `/api/health`

Check API server status.

**Response (200):**

```json
{
  "success": true,
  "message": "Bachelor Mess API is running",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

#### 4. Dashboard Statistics

**GET** `/api/dashboard/stats`

Get key dashboard metrics.

**Headers:**

```
Authorization: Bearer <token>
```

**Response (200):**

```json
{
  "success": true,
  "data": {
    "totalMembers": 12,
    "monthlyExpense": 32400,
    "averageMeals": 2.4,
    "balance": 1200,
    "totalMeals": 156,
    "pendingPayments": 3,
    "monthlyBudget": 40000,
    "budgetUsed": 81
  }
}
```

#### 5. Recent Activities

**GET** `/api/dashboard/activities`

Get recent system activities.

**Headers:**

```
Authorization: Bearer <token>
```

**Response (200):**

```json
{
  "success": true,
  "data": [
    {
      "id": "1",
      "type": "meal",
      "title": "Breakfast Added",
      "description": "Rahim added breakfast for today",
      "time": "2 hours ago",
      "priority": "low",
      "amount": 120,
      "user": "Rahim",
      "icon": "🍽️"
    }
  ]
}
```

#### 6. Combined Dashboard Data

**GET** `/api/dashboard?timeframe=week|month|year`

Get all dashboard data in a single request.

**Headers:**

```
Authorization: Bearer <token>
```

**Query Parameters:**

- `timeframe` (optional): week, month, year (default: week)

**Response (200):**

```json
{
  "success": true,
  "data": {
    "analytics": {
      "mealDistribution": [...],
      "expenseTrend": [...],
      "categoryBreakdown": [...],
      "monthlyProgress": {
        "current": 75,
        "target": 100
      }
    },
    "stats": {
      "totalMembers": 12,
      "monthlyExpense": 32400,
      "averageMeals": 2.4,
      "balance": 1200
    },
    "activities": [...]
  }
}
```

### Meal Management Endpoints

#### 7. Submit Daily Meals

**POST** `/api/meals/submit`

Submit daily meal entries for a user.

**Headers:**

```
Authorization: Bearer <token>
```

**Request Body:**

```json
{
  "breakfast": true,
  "lunch": false,
  "dinner": true,
  "date": "2024-01-15",
  "notes": "Extra rice for dinner"
}
```

**Response (201):**

```json
{
  "message": "Meals submitted successfully",
  "meal": {
    "id": "507f1f77bcf86cd799439011",
    "userId": "507f1f77bcf86cd799439012",
    "date": "2024-01-15T00:00:00.000Z",
    "breakfast": true,
    "lunch": false,
    "dinner": true,
    "status": "pending",
    "notes": "Extra rice for dinner",
    "createdAt": "2024-01-15T10:30:00.000Z"
  }
}
```

**Error Responses:**

- `400` - Meal entry already exists for this date
- `500` - Server error

#### 8. Get User Meals

**GET** `/api/meals/user`

Get current user's meal entries.

**Headers:**

```
Authorization: Bearer <token>
```

**Query Parameters:**

- `startDate` (optional): Start date filter
- `endDate` (optional): End date filter
- `status` (optional): pending, approved, rejected
- `limit` (optional): Number of records (default: 10)

**Response (200):**

```json
[
  {
    "id": "507f1f77bcf86cd799439011",
    "date": "2024-01-15T00:00:00.000Z",
    "breakfast": true,
    "lunch": false,
    "dinner": true,
    "status": "approved",
    "notes": "Extra rice for dinner",
    "approvedBy": "507f1f77bcf86cd799439013",
    "approvedAt": "2024-01-15T11:00:00.000Z"
  }
]
```

#### 9. Get All Meals (Admin Only)

**GET** `/api/meals/all`

Get all meal entries with filtering.

**Headers:**

```
Authorization: Bearer <token>
```

**Query Parameters:**

- `status` (optional): pending, approved, rejected
- `startDate` (optional): Start date filter
- `endDate` (optional): End date filter
- `userId` (optional): Filter by specific user

**Response (200):**

```json
[
  {
    "id": "507f1f77bcf86cd799439011",
    "userId": {
      "id": "507f1f77bcf86cd799439012",
      "name": "Mahbub Alam",
      "email": "mahbub@example.com"
    },
    "date": "2024-01-15T00:00:00.000Z",
    "breakfast": true,
    "lunch": false,
    "dinner": true,
    "status": "approved",
    "approvedBy": {
      "id": "507f1f77bcf86cd799439013",
      "name": "Admin User"
    }
  }
]
```

#### 10. Update Meal Status (Admin Only)

**PUT** `/api/meals/:mealId/status`

Approve or reject a meal entry.

**Headers:**

```
Authorization: Bearer <token>
```

**Request Body:**

```json
{
  "status": "approved",
  "notes": "Approved with extra rice"
}
```

**Response (200):**

```json
{
  "message": "Meal approved successfully",
  "meal": {
    "id": "507f1f77bcf86cd799439011",
    "status": "approved",
    "notes": "Approved with extra rice",
    "approvedBy": "507f1f77bcf86cd799439013",
    "approvedAt": "2024-01-15T11:00:00.000Z"
  }
}
```

#### 11. Get Meal Statistics (Admin Only)

**GET** `/api/meals/stats`

Get meal statistics with aggregation.

**Headers:**

```
Authorization: Bearer <token>
```

**Query Parameters:**

- `startDate` (optional): Start date filter
- `endDate` (optional): End date filter
- `userId` (optional): Filter by specific user

**Response (200):**

```json
{
  "totalBreakfast": 45,
  "totalLunch": 42,
  "totalDinner": 48,
  "totalMeals": 135,
  "pendingCount": 5,
  "approvedCount": 120,
  "rejectedCount": 10
}
```

### Bazar Management Endpoints

#### 12. Submit Bazar Entry

**POST** `/api/bazar/submit`

Submit a bazar (grocery shopping) entry with receipt image.

**Headers:**

```
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**Request Body (Form Data):**

```
items: [{"name": "Rice", "quantity": "5kg", "price": 250}]
totalAmount: 1250
description: "Weekly grocery shopping"
date: 2024-01-15
receiptImage: [file upload]
```

**Response (201):**

```json
{
  "message": "Bazar entry submitted successfully",
  "bazar": {
    "id": "507f1f77bcf86cd799439011",
    "userId": "507f1f77bcf86cd799439012",
    "date": "2024-01-15T00:00:00.000Z",
    "items": [
      {
        "name": "Rice",
        "quantity": "5kg",
        "price": 250
      }
    ],
    "totalAmount": 1250,
    "description": "Weekly grocery shopping",
    "receiptImage": "https://res.cloudinary.com/...",
    "status": "pending"
  }
}
```

#### 13. Get User Bazar Entries

**GET** `/api/bazar/user`

Get current user's bazar entries.

**Headers:**

```
Authorization: Bearer <token>
```

**Query Parameters:**

- `startDate` (optional): Start date filter
- `endDate` (optional): End date filter
- `status` (optional): pending, approved, rejected
- `limit` (optional): Number of records (default: 10)

**Response (200):**

```json
[
  {
    "id": "507f1f77bcf86cd799439011",
    "date": "2024-01-15T00:00:00.000Z",
    "items": [
      {
        "name": "Rice",
        "quantity": "5kg",
        "price": 250
      }
    ],
    "totalAmount": 1250,
    "description": "Weekly grocery shopping",
    "receiptImage": "https://res.cloudinary.com/...",
    "status": "approved"
  }
]
```

#### 14. Get All Bazar Entries (Admin Only)

**GET** `/api/bazar/all`

Get all bazar entries with filtering.

**Headers:**

```
Authorization: Bearer <token>
```

**Query Parameters:**

- `status` (optional): pending, approved, rejected
- `startDate` (optional): Start date filter
- `endDate` (optional): End date filter
- `userId` (optional): Filter by specific user

**Response (200):**

```json
[
  {
    "id": "507f1f77bcf86cd799439011",
    "userId": {
      "id": "507f1f77bcf86cd799439012",
      "name": "Mahbub Alam",
      "email": "mahbub@example.com"
    },
    "date": "2024-01-15T00:00:00.000Z",
    "items": [...],
    "totalAmount": 1250,
    "status": "approved",
    "approvedBy": {
      "id": "507f1f77bcf86cd799439013",
      "name": "Admin User"
    }
  }
]
```

#### 15. Update Bazar Status (Admin Only)

**PUT** `/api/bazar/:bazarId/status`

Approve or reject a bazar entry.

**Headers:**

```
Authorization: Bearer <token>
```

**Request Body:**

```json
{
  "status": "approved",
  "notes": "Receipt verified, amount correct"
}
```

**Response (200):**

```json
{
  "message": "Bazar entry approved successfully",
  "bazar": {
    "id": "507f1f77bcf86cd799439011",
    "status": "approved",
    "notes": "Receipt verified, amount correct",
    "approvedBy": "507f1f77bcf86cd799439013",
    "approvedAt": "2024-01-15T11:00:00.000Z"
  }
}
```

#### 16. Get Bazar Statistics (Admin Only)

**GET** `/api/bazar/stats`

Get bazar statistics with aggregation.

**Headers:**

```
Authorization: Bearer <token>
```

**Query Parameters:**

- `startDate` (optional): Start date filter
- `endDate` (optional): End date filter
- `userId` (optional): Filter by specific user

**Response (200):**

```json
{
  "totalAmount": 45000,
  "totalEntries": 25,
  "pendingCount": 3,
  "approvedCount": 20,
  "rejectedCount": 2,
  "averageAmount": 1800
}
```

### User Management Endpoints

#### 17. Get All Users (Admin Only)

**GET** `/api/users/all`

Get all users with filtering and search.

**Headers:**

```
Authorization: Bearer <token>
```

**Query Parameters:**

- `status` (optional): active, inactive
- `role` (optional): admin, member
- `search` (optional): Search by name or email

**Response (200):**

```json
[
  {
    "id": "507f1f77bcf86cd799439011",
    "name": "Mahbub Alam",
    "email": "mahbub@example.com",
    "phone": "+880 1712-345678",
    "role": "member",
    "status": "active",
    "joinDate": "2024-01-01T00:00:00.000Z",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
]
```

#### 18. Get User by ID (Admin Only)

**GET** `/api/users/:userId`

Get specific user details.

**Headers:**

```
Authorization: Bearer <token>
```

**Response (200):**

```json
{
  "id": "507f1f77bcf86cd799439011",
  "name": "Mahbub Alam",
  "email": "mahbub@example.com",
  "phone": "+880 1712-345678",
  "role": "member",
  "status": "active",
  "joinDate": "2024-01-01T00:00:00.000Z"
}
```

#### 19. Create User (Admin Only)

**POST** `/api/users/create`

Create a new user account.

**Headers:**

```
Authorization: Bearer <token>
```

**Request Body:**

```json
{
  "name": "New User",
  "email": "newuser@example.com",
  "password": "securepassword123",
  "phone": "+880 1712-345679",
  "role": "member"
}
```

**Response (201):**

```json
{
  "message": "User created successfully",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "name": "New User",
    "email": "newuser@example.com",
    "phone": "+880 1712-345679",
    "role": "member",
    "status": "active"
  }
}
```

#### 20. Update User (Admin Only)

**PUT** `/api/users/:userId`

Update user information.

**Headers:**

```
Authorization: Bearer <token>
```

**Request Body:**

```json
{
  "name": "Updated Name",
  "email": "updated@example.com",
  "phone": "+880 1712-345680",
  "role": "admin",
  "status": "active"
}
```

**Response (200):**

```json
{
  "message": "User updated successfully",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "name": "Updated Name",
    "email": "updated@example.com",
    "phone": "+880 1712-345680",
    "role": "admin",
    "status": "active"
  }
}
```

#### 21. Delete User (Admin Only)

**DELETE** `/api/users/:userId`

Delete a user account.

**Headers:**

```
Authorization: Bearer <token>
```

**Response (200):**

```json
{
  "message": "User deleted successfully"
}
```

#### 22. Get User Statistics (Admin Only)

**GET** `/api/users/:userId/stats`

Get comprehensive statistics for a specific user.

**Headers:**

```
Authorization: Bearer <token>
```

**Query Parameters:**

- `startDate` (optional): Start date filter
- `endDate` (optional): End date filter

**Response (200):**

```json
{
  "mealStats": {
    "totalMeals": 87,
    "totalBreakfast": 30,
    "totalLunch": 28,
    "totalDinner": 29
  },
  "bazarStats": {
    "totalAmount": 12500,
    "totalEntries": 8,
    "averageAmount": 1562.5
  }
}
```

#### 23. Get Current User Profile

**GET** `/api/users/profile`

Get current user's profile information.

**Headers:**

```
Authorization: Bearer <token>
```

**Response (200):**

```json
{
  "id": "507f1f77bcf86cd799439011",
  "name": "Mahbub Alam",
  "email": "mahbub@example.com",
  "phone": "+880 1712-345678",
  "role": "member",
  "status": "active",
  "joinDate": "2024-01-01T00:00:00.000Z"
}
```

#### 24. Update Current User Profile

**PUT** `/api/users/profile`

Update current user's profile information.

**Headers:**

```
Authorization: Bearer <token>
```

**Request Body:**

```json
{
  "name": "Updated Name",
  "phone": "+880 1712-345680"
}
```

**Response (200):**

```json
{
  "message": "Profile updated successfully",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "name": "Updated Name",
    "email": "mahbub@example.com",
    "phone": "+880 1712-345680",
    "role": "member",
    "status": "active"
  }
}
```

### Analytics Endpoints

#### 25. Get Analytics Data

**GET** `/api/analytics?timeframe=week|month|year`

Get analytics data for charts and visualizations.

**Headers:**

```
Authorization: Bearer <token>
```

**Query Parameters:**

- `timeframe` (optional): week, month, year (default: week)

**Response (200):**

```json
{
  "success": true,
  "data": {
    "mealDistribution": [
      {
        "label": "Mon",
        "value": 3,
        "color": "#667eea",
        "gradient": ["#667eea", "#764ba2"],
        "trend": "up"
      }
    ],
    "expenseTrend": [
      {
        "date": "Mon",
        "value": 1200
      }
    ],
    "categoryBreakdown": [
      {
        "label": "Rice",
        "value": 35,
        "color": "#667eea",
        "gradient": ["#667eea", "#764ba2"]
      }
    ],
    "monthlyProgress": {
      "current": 75,
      "target": 100
    }
  }
}
```

## Data Models

### User Model

```javascript
{
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  phone: { type: String },
  role: { type: String, enum: ["admin", "member"], default: "member" },
  status: { type: String, enum: ["active", "inactive"], default: "active" },
  joinDate: { type: Date, default: Date.now },
  timestamps: true
}
```

### Meal Model

```javascript
{
  userId: { type: ObjectId, ref: "User", required: true },
  date: { type: Date, required: true, default: Date.now },
  breakfast: { type: Boolean, default: false },
  lunch: { type: Boolean, default: false },
  dinner: { type: Boolean, default: false },
  status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" },
  approvedBy: { type: ObjectId, ref: "User" },
  approvedAt: { type: Date },
  notes: { type: String },
  timestamps: true
}
```

### Bazar Model

```javascript
{
  userId: { type: ObjectId, ref: "User", required: true },
  date: { type: Date, required: true, default: Date.now },
  items: [{
    name: { type: String, required: true },
    quantity: { type: String, required: true },
    price: { type: Number, required: true }
  }],
  totalAmount: { type: Number, required: true },
  description: { type: String },
  receiptImage: { type: String }, // Cloudinary URL
  status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" },
  approvedBy: { type: ObjectId, ref: "User" },
  approvedAt: { type: Date },
  notes: { type: String },
  timestamps: true
}
```

## Error Handling

### Standard Error Response Format

```json
{
  "success": false,
  "error": "Error message description"
}
```

### HTTP Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

### Common Error Messages

- `"Access Denied"` - Missing or invalid JWT token
- `"Access Denied: Admins only"` - Insufficient permissions
- `"User not found"` - User doesn't exist
- `"Invalid credentials"` - Wrong email/password
- `"User already exists"` - Email already registered
- `"Meal entry already exists for this date"` - Duplicate meal entry
- `"Bazar entry not found"` - Bazar entry doesn't exist

## Frontend Integration

### API Service Configuration

```javascript
// services/api.js
const API_BASE_URL = "http://localhost:3000/api";

// Authentication helper
const getAuthHeaders = () => {
  const token = localStorage.getItem("token");
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
};

// API calls
export const authAPI = {
  login: async (credentials) => {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(credentials),
    });
    return response.json();
  },

  register: async (userData) => {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(userData),
    });
    return response.json();
  },
};

export const mealAPI = {
  submitMeals: async (mealData) => {
    const response = await fetch(`${API_BASE_URL}/meals/submit`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(mealData),
    });
    return response.json();
  },

  getUserMeals: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const response = await fetch(`${API_BASE_URL}/meals/user?${queryString}`, {
      headers: getAuthHeaders(),
    });
    return response.json();
  },
};
```

### React Hook Example

```javascript
// hooks/useMeals.js
import { useState, useEffect } from "react";
import { mealAPI } from "../services/api";

export const useMeals = () => {
  const [meals, setMeals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchMeals = async (params = {}) => {
    setLoading(true);
    setError(null);
    try {
      const data = await mealAPI.getUserMeals(params);
      setMeals(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const submitMeal = async (mealData) => {
    setLoading(true);
    setError(null);
    try {
      const result = await mealAPI.submitMeals(mealData);
      await fetchMeals(); // Refresh list
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMeals();
  }, []);

  return { meals, loading, error, fetchMeals, submitMeal };
};
```

### Component Integration Example

```javascript
// components/MealForm.jsx
import React, { useState } from "react";
import { useMeals } from "../hooks/useMeals";

export const MealForm = () => {
  const { submitMeal, loading, error } = useMeals();
  const [formData, setFormData] = useState({
    breakfast: false,
    lunch: false,
    dinner: false,
    notes: "",
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await submitMeal(formData);
      // Show success message
    } catch (err) {
      // Handle error
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Form fields */}
      <button type="submit" disabled={loading}>
        {loading ? "Submitting..." : "Submit Meals"}
      </button>
      {error && <div className="error">{error}</div>}
    </form>
  );
};
```

## Setup & Deployment

### Local Development Setup

1. **Clone Repository**

```bash
git clone <repository-url>
cd bachelor-mess-client
```

2. **Install Dependencies**

```bash
npm install
cd bachelor-mess-server
npm install
```

3. **Environment Configuration**

```bash
# Create .env file in bachelor-mess-server/
cp .env.example .env
# Edit .env with your configuration
```

4. **Database Setup**

```bash
# Install MongoDB locally or use MongoDB Atlas
# Update MONGODB_URI in .env
```

5. **Start Development Server**

```bash
# Terminal 1 - Backend
cd bachelor-mess-server
npm run dev

# Terminal 2 - Frontend
cd bachelor-mess-client
npm start
```

### Production Deployment

1. **Backend Deployment**

```bash
# Deploy to Heroku, Vercel, or your preferred platform
git push heroku main
```

2. **Frontend Configuration**

```javascript
// Update API_BASE_URL in services/api.js
const API_BASE_URL = "https://your-backend-domain.com/api";
```

3. **Environment Variables**

```env
# Production .env
NODE_ENV=production
PORT=3000
MONGODB_URI=your-production-mongodb-uri
JWT_SECRET=your-secure-jwt-secret
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

### Security Considerations

1. **JWT Secret**: Use a strong, unique secret key
2. **HTTPS**: Always use HTTPS in production
3. **CORS**: Configure CORS properly for your domain
4. **Rate Limiting**: Implement rate limiting for API endpoints
5. **Input Validation**: Validate all user inputs
6. **File Upload**: Limit file sizes and validate file types

### Monitoring & Logging

1. **Error Logging**: Implement comprehensive error logging
2. **Performance Monitoring**: Monitor API response times
3. **User Analytics**: Track API usage patterns
4. **Health Checks**: Regular health check monitoring

## Conclusion

This API provides a comprehensive solution for managing a bachelor mess with features for meal tracking, expense management, user administration, and analytics. The modular design allows for easy extension and maintenance, while the role-based access control ensures proper security.

For additional support or questions, please refer to the project documentation or contact the development team.
