# Uniform Utilities Guide

This guide explains how to use the uniform response, CRUD operations, and logging utilities in your Mess Manager API.

## Table of Contents

1. [Response Handler](#response-handler)
2. [CRUD Operations](#crud-operations)
3. [Logging Utilities](#logging-utilities)
4. [Middleware](#middleware)
5. [Usage Examples](#usage-examples)
6. [Best Practices](#best-practices)

## Response Handler

The `responseHandler.js` provides uniform API response functions for consistent responses across your application.

### Available Functions

#### Success Responses

```javascript
const { 
  sendSuccess, 
  sendCreated, 
  sendNoContent, 
  sendPaginated 
} = require('../utils/responseHandler');

// Basic success response
sendSuccess(res, 200, 'Operation successful', data, options);

// Created response (201)
sendCreated(res, 'Resource created successfully', data, options);

// No content response (204)
sendNoContent(res, options);

// Paginated response
sendPaginated(res, 'Data retrieved successfully', data, pagination, options);
```

#### Error Responses

```javascript
const { 
  sendError, 
  sendValidationError, 
  sendNotFound, 
  sendUnauthorized, 
  sendForbidden, 
  sendConflict, 
  sendServerError 
} = require('../utils/responseHandler');

// Basic error response
sendError(res, 400, 'Error message', 'ERROR_CODE', options);

// Validation error
sendValidationError(res, validationErrors, options);

// Not found
sendNotFound(res, 'Resource not found', options);

// Unauthorized
sendUnauthorized(res, 'Unauthorized access', options);

// Forbidden
sendForbidden(res, 'Access forbidden', options);

// Conflict
sendConflict(res, 'Resource conflict', options);

// Server error
sendServerError(res, 'Internal server error', options);
```

#### Utility Functions

```javascript
const { 
  generateRequestId, 
  getRequestContext 
} = require('../utils/responseHandler');

// Generate unique request ID
const requestId = generateRequestId();

// Get request context
const context = getRequestContext(req);
```

### Response Structure

All responses follow this uniform structure:

```json
{
  "success": true/false,
  "message": "Human-readable message",
  "data": {}, // Optional
  "timestamp": "2024-01-01T00:00:00.000Z",
  "requestId": "req_1234567890_abc123",
  "pagination": {}, // Optional, for paginated responses
  "metadata": {}, // Optional
  "errorCode": "ERROR_CODE", // Optional, for error responses
  "errors": [], // Optional, for validation errors
  "stack": "" // Optional, in development mode
}
```

## CRUD Operations

The `crudOperations.js` provides uniform database operations with built-in logging and error handling.

### Available Functions

#### Create Operations

```javascript
const { createResource } = require('../utils/crudOperations');

// Create a new resource
const user = await createResource(User, {
  name: 'John Doe',
  email: 'john@example.com',
  password: 'password123'
}, {
  context: getRequestContext(req),
  logData: false // Don't log sensitive data
});
```

#### Read Operations

```javascript
const { 
  findResources, 
  findResourceById, 
  countResources, 
  resourceExists 
} = require('../utils/crudOperations');

// Find resources with pagination
const result = await findResources(User, filter, {
  page: 1,
  limit: 10,
  sort: { createdAt: -1 },
  select: '-password',
  populate: 'profile',
  context: getRequestContext(req)
});

// Find single resource
const user = await findResourceById(User, userId, {
  select: '-password',
  populate: 'profile',
  context: getRequestContext(req)
});

// Count resources
const count = await countResources(User, filter, {
  context: getRequestContext(req)
});

// Check if resource exists
const exists = await resourceExists(User, { email }, {
  context: getRequestContext(req)
});
```

#### Update Operations

```javascript
const { updateResource, bulkUpdateResources } = require('../utils/crudOperations');

// Update single resource
const updatedUser = await updateResource(User, userId, updateData, {
  context: getRequestContext(req),
  logData: false
});

// Bulk update resources
const result = await bulkUpdateResources(User, filter, updateData, {
  context: getRequestContext(req)
});
```

#### Delete Operations

```javascript
const { 
  deleteResource, 
  softDeleteResource, 
  bulkDeleteResources 
} = require('../utils/crudOperations');

// Delete single resource
const deletedUser = await deleteResource(User, userId, {
  context: getRequestContext(req)
});

// Soft delete resource
const softDeletedUser = await softDeleteResource(User, userId, {
  context: getRequestContext(req)
});

// Bulk delete resources
const result = await bulkDeleteResources(User, filter, {
  context: getRequestContext(req)
});
```

## Logging Utilities

The enhanced `logger.js` provides uniform logging functions for different types of events.

### Available Functions

#### API Logging

```javascript
const logger = require('../utils/logger');

// Log API request
logger.logApiRequest(req, {
  requestId: 'req_123',
  logBody: true,
  logQuery: true,
  logParams: true
});

// Log API response
logger.logApiResponse(req, res, responseTime, {
  requestId: 'req_123'
});

// Log API error
logger.logApiError(req, error, {
  requestId: 'req_123',
  logStack: true
});
```

#### Database Logging

```javascript
// Log database operation
logger.logDatabaseOperation('create', 'User', {
  data: 'user data'
}, {
  userId: 'user_123',
  requestId: 'req_123',
  duration: 150
});
```

#### Business Event Logging

```javascript
// Log authentication event
logger.logAuthEvent('login', user, {
  ip: '192.168.1.1',
  userAgent: 'Mozilla/5.0...',
  requestId: 'req_123',
  success: true
});

// Log business event
logger.logBusinessEvent('user_registered', {
  userId: 'user_123',
  email: 'user@example.com'
}, {
  userId: 'user_123',
  requestId: 'req_123',
  severity: 'info'
});
```

#### Performance and Security Logging

```javascript
// Log performance metric
logger.logPerformanceMetric('response_time', 150, 'ms', {
  requestId: 'req_123',
  endpoint: 'GET /api/users'
});

// Log security event
logger.logSecurityEvent('failed_login', {
  email: 'user@example.com',
  attempts: 3
}, {
  ip: '192.168.1.1',
  userAgent: 'Mozilla/5.0...',
  severity: 'warn'
});
```

## Middleware

The `requestLogger.js` provides middleware for automatic request logging and context management.

### Available Middleware

```javascript
const { 
  requestLogger, 
  errorLogger, 
  databaseLogger, 
  businessEventLogger 
} = require('../middleware/requestLogger');

// Request logger middleware
app.use(requestLogger({
  logBody: process.env.NODE_ENV === 'development',
  logQuery: process.env.NODE_ENV === 'development',
  logParams: process.env.NODE_ENV === 'development'
}));

// Database logger middleware
app.use(databaseLogger({
  logData: process.env.NODE_ENV === 'development'
}));

// Business event logger middleware
app.use(businessEventLogger());

// Error logger middleware
app.use(errorLogger());
```

## Usage Examples

### Complete Route Example

```javascript
const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');

// Import uniform utilities
const {
  sendSuccess,
  sendCreated,
  sendError,
  sendNotFound,
  getRequestContext,
} = require('../utils/responseHandler');

const {
  createResource,
  findResources,
  findResourceById,
  updateResource,
  deleteResource,
} = require('../utils/crudOperations');

// Create user
router.post('/users', protect, authorize('admin'), async (req, res, next) => {
  try {
    const { name, email, password, role = 'member' } = req.body;
    const context = getRequestContext(req);

    // Log business event
    req.logBusinessEvent('user_creation_attempt', {
      email,
      role,
      adminId: req.user.id,
    });

    // Check if user exists
    const exists = await resourceExists(User, { email }, { context });
    if (exists) {
      return sendError(res, 409, 'User already exists', 'USER_EXISTS', {
        ...context,
        endpoint: 'POST /api/users',
      });
    }

    // Create user
    const user = await createResource(User, {
      name,
      email,
      password,
      role,
    }, {
      context,
      logData: false,
    });

    // Log success
    req.logBusinessEvent('user_created', {
      userId: user._id,
      email: user.email,
      role: user.role,
    });

    // Send response
    sendCreated(res, 'User created successfully', {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    }, {
      ...context,
      endpoint: 'POST /api/users',
    });

  } catch (error) {
    next(error);
  }
});

// Get users with pagination
router.get('/users', protect, authorize('admin'), async (req, res, next) => {
  try {
    const { page = 1, limit = 10, search, role } = req.query;
    const context = getRequestContext(req);

    // Build filter
    const filter = {};
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }
    if (role) filter.role = role;

    // Find users
    const result = await findResources(User, filter, {
      page: parseInt(page),
      limit: parseInt(limit),
      sort: { createdAt: -1 },
      select: '-password',
      context,
    });

    // Log business event
    req.logBusinessEvent('users_retrieved', {
      count: result.resources.length,
      total: result.pagination.total,
      filters: { search, role },
    });

    // Send paginated response
    sendPaginated(res, 'Users retrieved successfully', result.resources, result.pagination, {
      ...context,
      endpoint: 'GET /api/users',
    });

  } catch (error) {
    next(error);
  }
});

module.exports = router;
```

## Best Practices

### 1. Always Use Request Context

```javascript
const context = getRequestContext(req);

// Pass context to all operations
const user = await createResource(User, data, { context });
sendSuccess(res, 200, 'Success', data, { ...context, endpoint: 'POST /api/users' });
```

### 2. Don't Log Sensitive Data

```javascript
// Good - don't log passwords
const user = await createResource(User, userData, {
  context,
  logData: false, // Don't log sensitive data
});

// Good - don't log full request body in production
logger.logApiRequest(req, {
  logBody: process.env.NODE_ENV === 'development',
});
```

### 3. Use Appropriate Error Responses

```javascript
// Use specific error functions
if (!user) {
  return sendNotFound(res, 'User not found', { ...context, endpoint });
}

if (req.user.role !== 'admin') {
  return sendForbidden(res, 'Access denied', { ...context, endpoint });
}
```

### 4. Log Business Events

```javascript
// Log important business events
req.logBusinessEvent('user_registered', {
  userId: user._id,
  email: user.email,
  registrationMethod: 'email',
});
```

### 5. Use Pagination for Large Datasets

```javascript
// Always use pagination for list endpoints
const result = await findResources(User, filter, {
  page: parseInt(page),
  limit: parseInt(limit),
  context,
});

sendPaginated(res, 'Users retrieved', result.resources, result.pagination, {
  ...context,
  endpoint,
});
```

### 6. Handle Errors Gracefully

```javascript
try {
  const user = await createResource(User, data, { context });
  sendCreated(res, 'User created', user, { ...context, endpoint });
} catch (error) {
  // Let the global error handler deal with it
  next(error);
}
```

## Configuration

### Environment Variables

```bash
# Logging configuration
LOG_LEVEL=info
NODE_ENV=development

# Request logging (development only)
LOG_REQUEST_BODY=true
LOG_REQUEST_QUERY=true
LOG_REQUEST_PARAMS=true

# Database logging (development only)
LOG_DATABASE_DATA=true
```

### Customizing Response Format

You can customize the response format by modifying the `responseHandler.js` file:

```javascript
// Add custom fields to all responses
const response = {
  success: true,
  message,
  timestamp: new Date().toISOString(),
  requestId: options.requestId || generateRequestId(),
  // Add your custom fields here
  version: process.env.npm_package_version,
  environment: process.env.NODE_ENV,
};
```

## Migration Guide

### From Old Response Format

**Before:**
```javascript
res.status(200).json({
  success: true,
  message: 'Success',
  data: user
});
```

**After:**
```javascript
sendSuccess(res, 200, 'Success', user, {
  ...getRequestContext(req),
  endpoint: 'GET /api/users',
});
```

### From Old CRUD Operations

**Before:**
```javascript
const user = await User.create(userData);
logger.info(`User created: ${user.email}`);
```

**After:**
```javascript
const user = await createResource(User, userData, {
  context: getRequestContext(req),
  logData: false,
});
```

### From Old Logging

**Before:**
```javascript
logger.info(`User ${user.email} logged in`);
```

**After:**
```javascript
logger.logAuthEvent('login', user, {
  ip: req.ip,
  userAgent: req.get('User-Agent'),
  requestId: req.requestId,
  success: true,
});
```

This uniform approach ensures consistency across your entire API and makes it easier to maintain, debug, and monitor your application. 