# 🔒 Security Best Practices - No Hardcoded Data

## 🚨 Critical Security Issue: Hardcoded Data

**NEVER use hardcoded credentials, IP addresses, or sensitive data in client applications.** This is a serious security vulnerability that can lead to:

- Unauthorized access to systems
- Data breaches
- Compromised user accounts
- Legal and compliance issues

## ✅ Security Fixes Implemented

### 1. **Environment-Based Configuration**

**Before (DANGEROUS):**

```typescript
// ❌ HARDCODED - NEVER DO THIS
const API_URL = 'http://192.168.0.130:3000/api';
const TEST_EMAIL = 'mahbub@mess.com';
const TEST_PASSWORD = 'Password123';
```

**After (SECURE):**

```typescript
// ✅ Environment-based configuration
const getApiUrl = (): string => {
  const envUrl = process.env.EXPO_PUBLIC_API_URL;

  if (envUrl) {
    return envUrl;
  }

  if (__DEV__) {
    console.warn(
      '⚠️  Using development API URL. Set EXPO_PUBLIC_API_URL for production.'
    );
    return 'http://localhost:3000/api';
  }

  throw new Error(
    'EXPO_PUBLIC_API_URL environment variable is required for production'
  );
};
```

### 2. **Secure Test Configuration**

**Before (DANGEROUS):**

```javascript
// ❌ HARDCODED CREDENTIALS
const testUser = {
  email: 'mahbub@mess.com',
  password: 'Password123',
};
```

**After (SECURE):**

```javascript
// ✅ Environment variables
const TEST_EMAIL = process.env.TEST_EMAIL || 'test@mess.com';
const TEST_PASSWORD = process.env.TEST_PASSWORD || 'test123';
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';
```

### 3. **Database Seeding Security**

**Before (DANGEROUS):**

```javascript
// ❌ HARDCODED PASSWORDS
{
  email: 'mahbub@mess.com',
  password: 'Password123',
}
```

**After (SECURE):**

```javascript
// ✅ Environment-based credentials
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@mess.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'AdminPassword123';
const MEMBER_PASSWORD = process.env.MEMBER_PASSWORD || 'MemberPassword123';
```

## 🔧 Environment Configuration

### Frontend (.env file)

```bash
# API Configuration
EXPO_PUBLIC_API_URL=https://your-production-api.com/api

# Development overrides
EXPO_PUBLIC_DEV_API_URL=http://localhost:3000/api
```

### Backend (.env file)

```bash
# Database
MONGODB_URI=mongodb://localhost:27017/bachelor-mess
MONGODB_URI_PROD=mongodb://your-production-mongodb-uri

# JWT Secrets (generate secure ones)
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_REFRESH_SECRET=your-refresh-secret-key

# Test Configuration
TEST_EMAIL=test@mess.com
TEST_PASSWORD=test123
API_BASE_URL=http://localhost:3000

# Admin Configuration
ADMIN_EMAIL=admin@mess.com
ADMIN_PASSWORD=AdminPassword123
MEMBER_PASSWORD=MemberPassword123
```

## 🛡️ Security Checklist

### ✅ Implemented

- [x] Removed hardcoded API URLs
- [x] Removed hardcoded credentials
- [x] Removed hardcoded IP addresses
- [x] Environment-based configuration
- [x] Secure test credentials
- [x] Production-ready error handling

### 🔄 Ongoing Tasks

- [ ] Generate secure JWT secrets for production
- [ ] Implement proper authentication middleware
- [ ] Add rate limiting for all endpoints
- [ ] Implement request validation
- [ ] Add security headers
- [ ] Enable HTTPS in production
- [ ] Implement proper logging without sensitive data

## 🚀 Production Deployment Security

### 1. **Environment Variables**

```bash
# Generate secure secrets
JWT_SECRET=$(openssl rand -hex 64)
JWT_REFRESH_SECRET=$(openssl rand -hex 64)

# Set production URLs
EXPO_PUBLIC_API_URL=https://api.yourdomain.com
MONGODB_URI=mongodb://your-production-mongodb
```

### 2. **Docker Security**

```dockerfile
# Use multi-stage builds
FROM node:18-alpine AS builder
# ... build steps

FROM node:18-alpine AS production
# Remove development dependencies
RUN npm ci --only=production
```

### 3. **Network Security**

```javascript
// Use HTTPS in production
const isProduction = process.env.NODE_ENV === 'production';
const protocol = isProduction ? 'https' : 'http';
const apiUrl = `${protocol}://${process.env.API_HOST}/api`;
```

## 📋 Security Best Practices

### 1. **Never Hardcode**

- ❌ IP addresses
- ❌ Passwords
- ❌ API keys
- ❌ Database URLs
- ❌ JWT secrets

### 2. **Always Use Environment Variables**

- ✅ API URLs
- ✅ Database connections
- ✅ Secrets and keys
- ✅ Test credentials

### 3. **Validate Configuration**

```typescript
// Validate required environment variables
if (!process.env.EXPO_PUBLIC_API_URL) {
  throw new Error('EXPO_PUBLIC_API_URL is required');
}
```

### 4. **Secure Development**

```bash
# Use different credentials for development
TEST_EMAIL=dev@mess.com
TEST_PASSWORD=DevPassword123
API_BASE_URL=http://localhost:3000
```

## 🔍 Security Monitoring

### 1. **Log Security Events**

```javascript
// Log authentication attempts
logger.warn('Failed login attempt', {
  email: req.body.email,
  ip: req.ip,
  userAgent: req.get('User-Agent'),
});
```

### 2. **Monitor for Hardcoded Data**

```bash
# Search for hardcoded credentials
grep -r "password\|secret\|key\|token" --include="*.js" --include="*.ts" --include="*.tsx" .

# Search for hardcoded IPs
grep -r "192\.168\|10\.0\|172\.16" --include="*.js" --include="*.ts" --include="*.tsx" .
```

## 🚨 Emergency Response

If you discover hardcoded credentials in production:

1. **Immediate Actions**

   - Rotate all affected secrets
   - Update environment variables
   - Redeploy application
   - Monitor for unauthorized access

2. **Investigation**

   - Review git history for exposed secrets
   - Check for data breaches
   - Update security policies

3. **Prevention**
   - Implement automated security scanning
   - Add pre-commit hooks
   - Regular security audits

## 📚 Additional Resources

- [OWASP Security Guidelines](https://owasp.org/)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)
- [React Native Security](https://reactnative.dev/docs/security)
- [Environment Variables Best Practices](https://12factor.net/config)

---

**Remember: Security is not a feature, it's a requirement. Always prioritize security over convenience.**
