const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../server');
const User = require('../src/models/User');
const { generateToken } = require('../src/utils/auth');

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  await mongoose.connect(mongoUri);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

beforeEach(async () => {
  await User.deleteMany({});
});

describe('Profile API Tests', () => {
  let testUser;
  let authToken;

  beforeEach(async () => {
    // Create test user
    testUser = await User.create({
      name: 'Test User',
      email: 'test@example.com',
      password: 'Password123',
      phone: '+880 1712-345678',
      role: 'member',
    });

    // Generate auth token
    authToken = generateToken(testUser);
  });

  describe('GET /api/users/profile', () => {
    it('should get current user profile successfully', async () => {
      const response = await request(app)
        .get('/api/users/profile')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data.name).toBe('Test User');
      expect(response.body.data.email).toBe('test@example.com');
      expect(response.body.data).not.toHaveProperty('password');
    });

    it('should return 401 without authentication', async () => {
      const response = await request(app).get('/api/users/profile');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('should return 401 with invalid token', async () => {
      const response = await request(app)
        .get('/api/users/profile')
        .set('Authorization', 'Bearer invalid-token');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe('PUT /api/users/profile', () => {
    it('should update profile successfully', async () => {
      const updateData = {
        name: 'Updated Name',
        phone: '+880 1712-345679',
      };

      const response = await request(app)
        .put('/api/users/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('Updated Name');
      expect(response.body.data.phone).toBe('+880 1712-345679');
    });

    it('should update password successfully', async () => {
      const updateData = {
        currentPassword: 'Password123',
        newPassword: 'NewPassword123',
        confirmPassword: 'NewPassword123',
      };

      const response = await request(app)
        .put('/api/users/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      // Verify password was changed by trying to login with new password
      const loginResponse = await request(app).post('/api/auth/login').send({
        email: 'test@example.com',
        password: 'NewPassword123',
      });

      expect(loginResponse.status).toBe(200);
    });

    it('should return 400 for invalid name', async () => {
      const updateData = {
        name: 'A', // Too short
      };

      const response = await request(app)
        .put('/api/users/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should return 400 for invalid phone number', async () => {
      const updateData = {
        phone: 'invalid-phone',
      };

      const response = await request(app)
        .put('/api/users/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should return 400 when changing password without current password', async () => {
      const updateData = {
        newPassword: 'NewPassword123',
        confirmPassword: 'NewPassword123',
      };

      const response = await request(app)
        .put('/api/users/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Current password is required');
    });

    it('should return 400 when current password is incorrect', async () => {
      const updateData = {
        currentPassword: 'WrongPassword',
        newPassword: 'NewPassword123',
        confirmPassword: 'NewPassword123',
      };

      const response = await request(app)
        .put('/api/users/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Current password is incorrect');
    });

    it('should return 400 when password confirmation does not match', async () => {
      const updateData = {
        currentPassword: 'Password123',
        newPassword: 'NewPassword123',
        confirmPassword: 'DifferentPassword',
      };

      const response = await request(app)
        .put('/api/users/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain(
        'Password confirmation does not match'
      );
    });

    it('should return 400 for weak new password', async () => {
      const updateData = {
        currentPassword: 'Password123',
        newPassword: 'weak',
        confirmPassword: 'weak',
      };

      const response = await request(app)
        .put('/api/users/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .put('/api/users/profile')
        .send({ name: 'Updated Name' });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe('Profile Validation Tests', () => {
    it('should validate name length', async () => {
      const testCases = [
        { name: '', expected: 400 },
        { name: 'A', expected: 400 },
        { name: 'AB', expected: 200 },
        { name: 'A'.repeat(50), expected: 200 },
        { name: 'A'.repeat(51), expected: 400 },
      ];

      for (const testCase of testCases) {
        const response = await request(app)
          .put('/api/users/profile')
          .set('Authorization', `Bearer ${authToken}`)
          .send({ name: testCase.name });

        expect(response.status).toBe(testCase.expected);
      }
    });

    it('should validate phone number format', async () => {
      const testCases = [
        { phone: '+880 1712-345678', expected: 200 },
        { phone: '+8801712345678', expected: 200 },
        { phone: '8801712345678', expected: 200 },
        { phone: 'invalid-phone', expected: 400 },
        { phone: '123', expected: 400 },
        { phone: '+880 1712-3456789', expected: 400 }, // Too long
      ];

      for (const testCase of testCases) {
        const response = await request(app)
          .put('/api/users/profile')
          .set('Authorization', `Bearer ${authToken}`)
          .send({ phone: testCase.phone });

        expect(response.status).toBe(testCase.expected);
      }
    });

    it('should validate password requirements', async () => {
      const testCases = [
        { password: 'weak', expected: 400 },
        { password: 'weak123', expected: 400 },
        { password: 'Weak123', expected: 200 },
        { password: 'StrongPassword123', expected: 200 },
      ];

      for (const testCase of testCases) {
        const response = await request(app)
          .put('/api/users/profile')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            currentPassword: 'Password123',
            newPassword: testCase.password,
            confirmPassword: testCase.password,
          });

        expect(response.status).toBe(testCase.expected);
      }
    });
  });

  describe('Profile Security Tests', () => {
    it('should not allow updating email through profile endpoint', async () => {
      const response = await request(app)
        .put('/api/users/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          email: 'newemail@example.com',
        });

      expect(response.status).toBe(200);
      // Email should remain unchanged
      expect(response.body.data.email).toBe('test@example.com');
    });

    it('should not allow updating role through profile endpoint', async () => {
      const response = await request(app)
        .put('/api/users/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          role: 'admin',
        });

      expect(response.status).toBe(200);
      // Role should remain unchanged
      expect(response.body.data.role).toBe('member');
    });

    it('should not allow updating status through profile endpoint', async () => {
      const response = await request(app)
        .put('/api/users/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          status: 'inactive',
        });

      expect(response.status).toBe(200);
      // Status should remain unchanged
      expect(response.body.data.status).toBe('active');
    });
  });
});
