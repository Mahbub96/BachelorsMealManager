# Bachelor Mess Manager API Documentation

## Overview

This document provides comprehensive API documentation for the Bachelor Mess Manager Backend application. The API is built with Node.js, Express, and MongoDB, providing endpoints for user authentication, meal management, bazar (grocery) management, statistics, and system administration.

## Base URL

```
http://localhost:3000/api
```

## Authentication

Most endpoints require authentication. Include the JWT token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

## Response Format

All API responses follow this standard format:

```json
{
  "success": true,
  "data": { ... },
  "message": "Optional message"
}
```

Error responses:

```json
{
  "success": false,
  "error": "Error message"
}
```

---

## 1. Authentication Routes (`/auth`)

### Register User

- **POST** `/api/auth/register`
- **Access**: Public
- **Description**: Register a new user account
- **Body**:
  ```json
  {
    "name": "string",
    "email": "string",
    "password": "string",
    "phone": "string"
  }
  ```

### Login User

- **POST** `/api/auth/login`
- **Access**: Public
- **Description**: Authenticate user and get access token
- **Body**:
  ```json
  {
    "email": "string",
    "password": "string"
  }
  ```

### Get Current User Profile

- **GET** `/api/auth/profile`
- **Access**: Private
- **Description**: Get current user's profile information

### Update Current User Profile

- **PUT** `/api/auth/profile`
- **Access**: Private
- **Description**: Update current user's profile information
- **Body**:
  ```json
  {
    "name": "string",
    "email": "string",
    "phone": "string"
  }
  ```

### Change Password

- **PUT** `/api/auth/change-password`
- **Access**: Private
- **Description**: Change user's password
- **Body**:
  ```json
  {
    "currentPassword": "string",
    "newPassword": "string"
  }
  ```

### Refresh Token

- **POST** `/api/auth/refresh`
- **Access**: Public
- **Description**: Get new access token using refresh token
- **Body**:
  ```json
  {
    "refreshToken": "string"
  }
  ```

### Logout User

- **POST** `/api/auth/logout`
- **Access**: Private
- **Description**: Logout user and invalidate tokens

### Verify Token

- **GET** `/api/auth/verify`
- **Access**: Private
- **Description**: Verify if current token is valid

### Forgot Password

- **POST** `/api/auth/forgot-password`
- **Access**: Public
- **Description**: Send password reset email
- **Body**:
  ```json
  {
    "email": "string"
  }
  ```

### Reset Password

- **POST** `/api/auth/reset-password`
- **Access**: Public
- **Description**: Reset password using reset token
- **Body**:
  ```json
  {
    "token": "string",
    "newPassword": "string"
  }
  ```

---

## 2. User Management Routes (`/users`)

### Get User Profile

- **GET** `/api/users/profile`
- **Access**: Private
- **Description**: Get current user's profile

### Update User Profile

- **PUT** `/api/users/profile`
- **Access**: Private
- **Description**: Update current user's profile
- **Body**:
  ```json
  {
    "name": "string",
    "email": "string",
    "phone": "string"
  }
  ```

### Get User Statistics

- **GET** `/api/users/stats/:userId`
- **Access**: Private
- **Description**: Get statistics for a specific user

### Get Current User Statistics

- **GET** `/api/users/stats/current`
- **Access**: Private
- **Description**: Get current user's statistics

### Get User Dashboard

- **GET** `/api/users/dashboard`
- **Access**: Private
- **Description**: Get current user's dashboard data

---

## 3. Meal Management Routes (`/meals`)

### Submit Daily Meals

- **POST** `/api/meals`
- **Access**: Private
- **Description**: Submit daily meal entries
- **Body**:
  ```json
  {
    "date": "2024-01-15",
    "breakfast": true,
    "lunch": true,
    "dinner": false
  }
  ```

### Submit Daily Meals (Alternative)

- **POST** `/api/meals/submit`
- **Access**: Private
- **Description**: Alternative endpoint for submitting meals

### Get User Meals

- **GET** `/api/meals`
- **Access**: Private
- **Description**: Get current user's meal entries

### Get User Meals (Alternative)

- **GET** `/api/meals/user`
- **Access**: Private
- **Description**: Alternative endpoint for getting user meals

### Get All Meals (Admin Only)

- **GET** `/api/meals/all`
- **Access**: Private/Admin
- **Description**: Get all meal entries (admin access required)

### Get Meal by ID

- **GET** `/api/meals/:mealId`
- **Access**: Private
- **Description**: Get specific meal entry by ID

### Update Meal Entry

- **PUT** `/api/meals/:mealId`
- **Access**: Private
- **Description**: Update specific meal entry
- **Body**:
  ```json
  {
    "breakfast": true,
    "lunch": false,
    "dinner": true
  }
  ```

### Update Meal Status (Admin Only)

- **PATCH** `/api/meals/:mealId/status`
- **Access**: Private/Admin
- **Description**: Update meal approval status
- **Body**:
  ```json
  {
    "status": "approved|rejected|pending"
  }
  ```

### Delete Meal Entry

- **DELETE** `/api/meals/:mealId`
- **Access**: Private
- **Description**: Delete specific meal entry

### Get Meal Statistics

- **GET** `/api/meals/stats/overview`
- **Access**: Private/Admin
- **Description**: Get meal statistics overview

### Get User Meal Statistics

- **GET** `/api/meals/stats/user`
- **Access**: Private
- **Description**: Get current user's meal statistics

### Get User Meal Statistics (Alternative)

- **GET** `/api/meals/user/stats`
- **Access**: Private
- **Description**: Alternative endpoint for user meal statistics

### Bulk Approve Meals (Admin Only)

- **POST** `/api/meals/bulk-approve`
- **Access**: Private/Admin
- **Description**: Approve multiple meals at once
- **Body**:
  ```json
  {
    "mealIds": ["id1", "id2", "id3"],
    "status": "approved"
  }
  ```

---

## 4. Bazar (Grocery) Management Routes (`/bazar`)

### Submit Bazar Entry

- **POST** `/api/bazar`
- **Access**: Private
- **Description**: Submit bazar (grocery) entry with receipt
- **Body**: FormData with file upload
  ```json
  {
    "date": "2024-01-15",
    "items": [
      {
        "name": "Rice",
        "quantity": 5,
        "unit": "kg",
        "price": 250
      }
    ],
    "totalAmount": 1250,
    "receipt": "file"
  }
  ```

### Get User Bazar Entries

- **GET** `/api/bazar`
- **Access**: Private
- **Description**: Get current user's bazar entries

### Get User Bazar Entries (Alternative)

- **GET** `/api/bazar/user`
- **Access**: Private
- **Description**: Alternative endpoint for getting user bazar entries

### Get All Bazar Entries (Admin Only)

- **GET** `/api/bazar/all`
- **Access**: Private/Admin
- **Description**: Get all bazar entries (admin access required)

### Get Bazar by ID

- **GET** `/api/bazar/:bazarId`
- **Access**: Private
- **Description**: Get specific bazar entry by ID

### Update Bazar Entry

- **PUT** `/api/bazar/:bazarId`
- **Access**: Private
- **Description**: Update specific bazar entry
- **Body**:
  ```json
  {
    "items": [...],
    "totalAmount": 1500
  }
  ```

### Update Bazar Status (Admin Only)

- **PATCH** `/api/bazar/:bazarId/status`
- **Access**: Private/Admin
- **Description**: Update bazar approval status
- **Body**:
  ```json
  {
    "status": "approved|rejected|pending"
  }
  ```

### Delete Bazar Entry

- **DELETE** `/api/bazar/:bazarId`
- **Access**: Private
- **Description**: Delete specific bazar entry

### Get Bazar Statistics

- **GET** `/api/bazar/stats/overview`
- **Access**: Private/Admin
- **Description**: Get bazar statistics overview

### Get User Bazar Statistics

- **GET** `/api/bazar/stats/user`
- **Access**: Private
- **Description**: Get current user's bazar statistics

### Bulk Approve Bazar Entries (Admin Only)

- **POST** `/api/bazar/bulk-approve`
- **Access**: Private/Admin
- **Description**: Approve multiple bazar entries at once
- **Body**:
  ```json
  {
    "bazarIds": ["id1", "id2", "id3"],
    "status": "approved"
  }
  ```

### Get Bazar Summary by Category

- **GET** `/api/bazar/summary/category`
- **Access**: Private/Admin
- **Description**: Get bazar summary grouped by category

### Get Bazar Trends

- **GET** `/api/bazar/trends`
- **Access**: Private/Admin
- **Description**: Get bazar spending trends

### Admin Override Routes (Admin Only)

#### Create Bazar Entry for Any User

- **POST** `/api/bazar/admin/create`
- **Access**: Private/Admin
- **Description**: Admin can create bazar entry for any user

#### Update Any Bazar Entry

- **PUT** `/api/bazar/admin/:bazarId`
- **Access**: Private/Admin
- **Description**: Admin can update any bazar entry

#### Delete Any Bazar Entry

- **DELETE** `/api/bazar/admin/:bazarId`
- **Access**: Private/Admin
- **Description**: Admin can delete any bazar entry

#### Bulk Operations

- **POST** `/api/bazar/admin/bulk`
- **Access**: Private/Admin
- **Description**: Admin can perform bulk operations on bazar entries

---

## 5. Dashboard Routes (`/dashboard`)

### Get Dashboard Statistics

- **GET** `/api/dashboard/stats`
- **Access**: Private
- **Description**: Get dashboard statistics

### Get Recent Activities

- **GET** `/api/dashboard/activities`
- **Access**: Private
- **Description**: Get recent user activities

### Get Combined Dashboard Data

- **GET** `/api/dashboard`
- **Access**: Private
- **Description**: Get combined dashboard data including stats and activities

---

## 6. Statistics Routes (`/statistics`)

### Get Complete Statistics

- **GET** `/api/statistics/complete`
- **Access**: Private
- **Description**: Get complete system statistics
- **Query Parameters**:
  - `forceUpdate` (boolean): Force refresh statistics
  - `timeframe` (string): Time period for statistics
  - `type` (string): Type of statistics

### Get Global Statistics

- **GET** `/api/statistics/global`
- **Access**: Private
- **Description**: Get global system statistics
- **Query Parameters**:
  - `forceUpdate` (boolean): Force refresh statistics

### Get Meal Statistics

- **GET** `/api/statistics/meals`
- **Access**: Private
- **Description**: Get meal-related statistics
- **Query Parameters**:
  - `forceUpdate` (boolean): Force refresh statistics

### Get Bazar Statistics

- **GET** `/api/statistics/bazar`
- **Access**: Private
- **Description**: Get bazar-related statistics
- **Query Parameters**:
  - `forceUpdate` (boolean): Force refresh statistics

### Get User Statistics

- **GET** `/api/statistics/users`
- **Access**: Private
- **Description**: Get user-related statistics
- **Query Parameters**:
  - `forceUpdate` (boolean): Force refresh statistics

### Get Activity Statistics

- **GET** `/api/statistics/activity`
- **Access**: Private
- **Description**: Get activity-related statistics
- **Query Parameters**:
  - `forceUpdate` (boolean): Force refresh statistics

### Get Monthly Statistics

- **GET** `/api/statistics/monthly`
- **Access**: Private
- **Description**: Get monthly statistics
- **Query Parameters**:
  - `forceUpdate` (boolean): Force refresh statistics

### Refresh Statistics (Admin Only)

- **POST** `/api/statistics/refresh`
- **Access**: Private/Admin
- **Description**: Manually refresh all statistics

### Get Dashboard Statistics

- **GET** `/api/statistics/dashboard`
- **Access**: Private
- **Description**: Get combined dashboard statistics
- **Query Parameters**:
  - `forceUpdate` (boolean): Force refresh statistics

---

## 7. User Statistics Routes (`/user-stats`)

### Get Comprehensive User Dashboard Statistics

- **GET** `/api/user-stats/dashboard`
- **Access**: Private
- **Description**: Get comprehensive user dashboard statistics including meals, bazar, and payments

### Get User Meal Statistics

- **GET** `/api/user-stats/meals`
- **Access**: Private
- **Description**: Get detailed meal statistics for current user

### Get User Bazar Statistics

- **GET** `/api/user-stats/bazar`
- **Access**: Private
- **Description**: Get detailed bazar statistics for current user

### Get User Payment Statistics

- **GET** `/api/user-stats/payments`
- **Access**: Private
- **Description**: Get payment-related statistics for current user

---

## 8. Activity Routes (`/activity`)

### Get Recent Activities

- **GET** `/api/activity/recent`
- **Access**: Private
- **Description**: Get recent activities with advanced filtering

### Get Current Month Meals

- **GET** `/api/activity/meals/current-month`
- **Access**: Private
- **Description**: Get current month meals with statistics

### Get Activity Statistics

- **GET** `/api/activity/stats`
- **Access**: Private
- **Description**: Get activity statistics

---

## 9. Analytics Routes (`/analytics`)

### Get Analytics Data

- **GET** `/api/analytics`
- **Access**: Private
- **Description**: Get general analytics data

### Get User Analytics

- **GET** `/api/analytics/user/:userId`
- **Access**: Private/Admin
- **Description**: Get analytics for specific user (admin access required)

### Get System Analytics (Admin Only)

- **GET** `/api/analytics/system`
- **Access**: Private/Admin
- **Description**: Get system-wide analytics (admin access required)

---

## 10. Super Admin Routes (`/super-admin`)

### Dashboard & Analytics

#### Get System Overview

- **GET** `/api/super-admin/overview`
- **Access**: Private/Super Admin
- **Description**: Get system overview for super admins

#### Get Detailed Analytics

- **GET** `/api/super-admin/analytics`
- **Access**: Private/Super Admin
- **Description**: Get detailed system analytics

### User Management

#### Get All Users

- **GET** `/api/super-admin/users`
- **Access**: Private/Super Admin
- **Description**: Get all users with pagination and filters

#### Get Specific User Details

- **GET** `/api/super-admin/users/:userId`
- **Access**: Private/Super Admin
- **Description**: Get detailed information about specific user

#### Update User Role and Status

- **PUT** `/api/super-admin/users/:userId`
- **Access**: Private/Super Admin
- **Description**: Update user role and status
- **Body**:
  ```json
  {
    "role": "user|admin|super_admin",
    "status": "active|inactive"
  }
  ```

#### Delete User

- **DELETE** `/api/super-admin/users/:userId`
- **Access**: Private/Super Admin
- **Description**: Delete user account

### System Management

#### Get System Settings

- **GET** `/api/super-admin/system/settings`
- **Access**: Private/Super Admin
- **Description**: Get system configuration settings

#### Update System Settings

- **PUT** `/api/super-admin/system/settings`
- **Access**: Private/Super Admin
- **Description**: Update system configuration settings

#### Get System Logs

- **GET** `/api/super-admin/system/logs`
- **Access**: Private/Super Admin
- **Description**: Get system logs

### Audit & Monitoring

#### Get Audit Logs

- **GET** `/api/super-admin/audit/logs`
- **Access**: Private/Super Admin
- **Description**: Get audit logs

#### Get Performance Metrics

- **GET** `/api/super-admin/performance/metrics`
- **Access**: Private/Super Admin
- **Description**: Get system performance metrics

### Backup & Restore

#### Create System Backup

- **POST** `/api/super-admin/backup/create`
- **Access**: Private/Super Admin
- **Description**: Create system backup

#### Get Backup List

- **GET** `/api/super-admin/backup/list`
- **Access**: Private/Super Admin
- **Description**: Get list of available backups

### Billing & Support

#### Get Billing Information

- **GET** `/api/super-admin/billing/info`
- **Access**: Private/Super Admin
- **Description**: Get billing information

#### Get Support Tickets

- **GET** `/api/super-admin/support/tickets`
- **Access**: Private/Super Admin
- **Description**: Get support tickets

---

## 11. UI Configuration Routes (`/ui-config`)

### Configuration Management

#### Get Active UI Configuration

- **GET** `/api/ui-config/active`
- **Access**: Public
- **Description**: Get active UI configuration

#### Get Configuration by Version

- **GET** `/api/ui-config/version/:appId/:version`
- **Access**: Public
- **Description**: Get specific configuration version

#### Create New Configuration

- **POST** `/api/ui-config`
- **Access**: Private/Super Admin
- **Description**: Create new UI configuration

#### Update Configuration

- **PUT** `/api/ui-config/:configId`
- **Access**: Private/Super Admin
- **Description**: Update existing configuration

#### Clone Configuration

- **POST** `/api/ui-config/:configId/clone`
- **Access**: Private/Super Admin
- **Description**: Clone existing configuration

#### Delete Configuration

- **DELETE** `/api/ui-config/:configId`
- **Access**: Private/Super Admin
- **Description**: Delete configuration

#### Get All Configurations

- **GET** `/api/ui-config`
- **Access**: Private/Super Admin
- **Description**: Get all configurations

#### Get Configuration History

- **GET** `/api/ui-config/:configId/history`
- **Access**: Private/Super Admin
- **Description**: Get configuration version history

#### Validate Configuration

- **GET** `/api/ui-config/:configId/validate`
- **Access**: Private/Super Admin
- **Description**: Validate configuration

### Theme Management

#### Get Theme

- **GET** `/api/ui-config/theme`
- **Access**: Public
- **Description**: Get current theme configuration

#### Update Theme

- **PUT** `/api/ui-config/:configId/theme`
- **Access**: Private/Super Admin
- **Description**: Update theme configuration

### Feature Flags

#### Get Feature Flags

- **GET** `/api/ui-config/features`
- **Access**: Public
- **Description**: Get current feature flags

#### Update Feature Flags

- **PUT** `/api/ui-config/:configId/features`
- **Access**: Private/Super Admin
- **Description**: Update feature flags

#### Toggle Specific Feature

- **POST** `/api/ui-config/:configId/features/toggle`
- **Access**: Private/Super Admin
- **Description**: Toggle specific feature

### Navigation Management

#### Get Navigation

- **GET** `/api/ui-config/navigation`
- **Access**: Public
- **Description**: Get navigation configuration

#### Update Navigation

- **PUT** `/api/ui-config/:configId/navigation`
- **Access**: Private/Super Admin
- **Description**: Update navigation configuration

### Component Configuration

#### Get Component Configuration

- **GET** `/api/ui-config/components`
- **Access**: Public
- **Description**: Get component configuration

#### Update Component Configuration

- **PUT** `/api/ui-config/:configId/components`
- **Access**: Private/Super Admin
- **Description**: Update component configuration

### Content Management

#### Get Content

- **GET** `/api/ui-config/content`
- **Access**: Public
- **Description**: Get content configuration

#### Update Content

- **PUT** `/api/ui-config/:configId/content`
- **Access**: Private/Super Admin
- **Description**: Update content configuration

### Security Settings

#### Get Security Settings

- **GET** `/api/ui-config/security`
- **Access**: Private/Super Admin
- **Description**: Get security settings

#### Update Security Settings

- **PUT** `/api/ui-config/:configId/security`
- **Access**: Private/Super Admin
- **Description**: Update security settings

### Performance Settings

#### Get Performance Settings

- **GET** `/api/ui-config/performance`
- **Access**: Private/Super Admin
- **Description**: Get performance settings

#### Update Performance Settings

- **PUT** `/api/ui-config/:configId/performance`
- **Access**: Private/Super Admin
- **Description**: Update performance settings

---

## 12. Monitoring Routes (`/monitoring`)

### System Health

#### Get System Health Status

- **GET** `/api/monitoring/health`
- **Access**: Private/Admin
- **Description**: Get system health status

#### Get System Metrics

- **GET** `/api/monitoring/metrics`
- **Access**: Private/Admin
- **Description**: Get system performance metrics

#### Get Prometheus Metrics

- **GET** `/api/monitoring/metrics/prometheus`
- **Access**: Public
- **Description**: Get metrics in Prometheus format

### Database Monitoring

#### Get Database Statistics

- **GET** `/api/monitoring/database`
- **Access**: Private/Admin
- **Description**: Get database health and statistics

### Backup Management

#### Get Backup Information

- **GET** `/api/monitoring/backups`
- **Access**: Private/Admin
- **Description**: Get backup information and statistics

#### Create Backup

- **POST** `/api/monitoring/backups`
- **Access**: Private/Admin
- **Description**: Create system backup
- **Body**:
  ```json
  {
    "type": "full|database|files"
  }
  ```

#### Restore from Backup

- **POST** `/api/monitoring/backups/:fileName/restore`
- **Access**: Private/Admin
- **Description**: Restore system from backup
- **Body**:
  ```json
  {
    "confirm": true
  }
  ```

#### Verify Backup

- **GET** `/api/monitoring/backups/:fileName/verify`
- **Access**: Private/Admin
- **Description**: Verify backup integrity

### System Configuration

#### Get System Configuration

- **GET** `/api/monitoring/config`
- **Access**: Private/Admin
- **Description**: Get system configuration (non-sensitive)

#### Get System Logs

- **GET** `/api/monitoring/logs`
- **Access**: Private/Admin
- **Description**: Get system logs
- **Query Parameters**:
  - `level` (string): Log level (default: info)
  - `limit` (number): Number of log entries (default: 100)

### Performance Monitoring

#### Reset Metrics

- **POST** `/api/monitoring/metrics/reset`
- **Access**: Private/Admin
- **Description**: Reset performance metrics

#### Get Performance Dashboard

- **GET** `/api/monitoring/dashboard`
- **Access**: Private/Admin
- **Description**: Get performance dashboard data

#### Get Real-time System Status

- **GET** `/api/monitoring/status`
- **Access**: Private/Admin
- **Description**: Get real-time system status

---

## 13. Health Check Routes

### Basic Health Check

- **GET** `/health`
- **Access**: Public
- **Description**: Basic health check endpoint

### Detailed Health Check

- **GET** `/health/detailed`
- **Access**: Public
- **Description**: Detailed health check with system information

---

## 14. API Documentation

### Get API Documentation

- **GET** `/api/docs`
- **Access**: Public
- **Description**: Get API documentation overview

---

## Error Codes

| Code | Description           |
| ---- | --------------------- |
| 200  | Success               |
| 201  | Created               |
| 400  | Bad Request           |
| 401  | Unauthorized          |
| 403  | Forbidden             |
| 404  | Not Found             |
| 409  | Conflict              |
| 422  | Validation Error      |
| 429  | Too Many Requests     |
| 500  | Internal Server Error |
| 503  | Service Unavailable   |

## Rate Limiting

The API implements rate limiting to prevent abuse:

- **Window**: 15 minutes
- **Max Requests**: 100 requests per window
- **Slow Down**: After 50 requests, additional requests are delayed

## File Upload

For file uploads (e.g., bazar receipts):

- **Max File Size**: 10MB
- **Supported Formats**: JPG, PNG, PDF
- **Field Name**: `receipt`

## Pagination

For endpoints that return lists, pagination is supported:

- **Query Parameters**:
  - `page` (number): Page number (default: 1)
  - `limit` (number): Items per page (default: 10)
  - `sort` (string): Sort field
  - `order` (string): Sort order (asc/desc)

## Filtering

Many endpoints support filtering:

- **Query Parameters**:
  - `status` (string): Filter by status
  - `date` (string): Filter by date
  - `userId` (string): Filter by user ID
  - `category` (string): Filter by category

## Authentication Headers

Include the JWT token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

## CORS Configuration

The API supports CORS with the following configuration:

- **Origins**: Configurable via environment variables
- **Credentials**: Supported
- **Methods**: GET, POST, PUT, DELETE, PATCH, OPTIONS
- **Headers**: Content-Type, Authorization, X-Requested-With, X-API-Key

---

## Integration Notes

### For Client Applications

1. **Authentication Flow**:
   - Register user → Login → Get JWT token
   - Include token in all subsequent requests
   - Use refresh token to get new access token

2. **Error Handling**:
   - Always check the `success` field in responses
   - Handle 401 errors by redirecting to login
   - Handle 429 errors by implementing retry logic

3. **File Uploads**:
   - Use FormData for file uploads
   - Include authentication token in headers
   - Handle upload progress if needed

4. **Real-time Updates**:
   - Poll statistics endpoints for updates
   - Implement WebSocket connection if available
   - Use activity endpoints for recent changes

5. **Caching**:
   - Cache static data like UI configurations
   - Implement client-side caching for frequently accessed data
   - Use ETags for conditional requests

### Environment Variables

The API uses the following environment variables:

- `PORT`: Server port (default: 3000)
- `NODE_ENV`: Environment (development/production)
- `MONGODB_URI`: MongoDB connection string
- `JWT_SECRET`: JWT signing secret
- `CORS_ORIGIN`: Allowed CORS origins
- `API_PREFIX`: API route prefix (default: /api)

### Security Considerations

1. **Token Management**:
   - Store tokens securely (not in localStorage)
   - Implement token refresh logic
   - Clear tokens on logout

2. **Input Validation**:
   - Validate all user inputs
   - Sanitize data before sending to API
   - Handle file uploads securely

3. **Error Handling**:
   - Don't expose sensitive information in error messages
   - Implement proper error boundaries
   - Log errors for debugging

---

This documentation provides a comprehensive overview of all available API endpoints. For specific implementation details, refer to the individual route files in the source code.
