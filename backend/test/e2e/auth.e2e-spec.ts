import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { TestHelper, setupTestEnvironment, teardownTestEnvironment, TestDataFactory } from '../test-helper';

describe('Auth API (E2E)', () => {
  let app: INestApplication;
  let testData: any;

  beforeAll(async () => {
    app = await setupTestEnvironment();
  });

  afterAll(async () => {
    await teardownTestEnvironment();
  });

  beforeEach(async () => {
    // Clean and reseed data for each test
    await TestHelper.cleanDatabase();
    testData = await TestHelper.seedTestData();
  });

  describe('POST /auth/login', () => {
    it('should login with valid credentials', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'password123',
      };

      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send(loginData)
        .expect(201);

      expect(response.body).toHaveProperty('access_token');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user).toHaveProperty('id');
      expect(response.body.user).toHaveProperty('email', 'test@example.com');
      expect(response.body.user).toHaveProperty('firstName', 'Test');
      expect(response.body.user).toHaveProperty('lastName', 'User');
      expect(response.body.user).toHaveProperty('role', 'admin');
      expect(response.body.user).not.toHaveProperty('password');
    });

    it('should login with demo user credentials', async () => {
      const demoLoginData = {
        email: 'admin@cmpc-libros.com',
        password: 'admin123',
      };

      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send(demoLoginData)
        .expect(201);

      expect(response.body).toHaveProperty('access_token');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user).toHaveProperty('email', 'admin@cmpc-libros.com');
      expect(response.body.user).toHaveProperty('role', 'admin');
    });

    it('should return 401 with invalid email', async () => {
      const invalidLogin = {
        email: 'nonexistent@example.com',
        password: 'password123',
      };

      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send(invalidLogin)
        .expect(401);

      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('Invalid credentials');
    });

    it('should return 401 with invalid password', async () => {
      const invalidLogin = {
        email: 'test@example.com',
        password: 'wrongpassword',
      };

      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send(invalidLogin)
        .expect(401);

      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('Invalid credentials');
    });

    it('should return 400 with missing credentials', async () => {
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({})
        .expect(400);
    });

    it('should return 400 with invalid email format', async () => {
      const invalidEmail = {
        email: 'invalid-email',
        password: 'password123',
      };

      await request(app.getHttpServer())
        .post('/auth/login')
        .send(invalidEmail)
        .expect(400);
    });

    it('should return 400 with short password', async () => {
      const shortPassword = {
        email: 'test@example.com',
        password: '123',
      };

      await request(app.getHttpServer())
        .post('/auth/login')
        .send(shortPassword)
        .expect(400);
    });
  });

  describe('POST /auth/register', () => {
    it('should register a new user', async () => {
      const newUserData = TestDataFactory.createUserData({
        email: 'newuser@example.com',
        firstName: 'New',
        lastName: 'User',
      });

      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send(newUserData)
        .expect(201);

      expect(response.body).toHaveProperty('access_token');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user).toHaveProperty('email', 'newuser@example.com');
      expect(response.body.user).toHaveProperty('firstName', 'New');
      expect(response.body.user).toHaveProperty('lastName', 'User');
      expect(response.body.user).toHaveProperty('role', 'user');
      expect(response.body.user).not.toHaveProperty('password');
    });

    it('should return 400 for duplicate email', async () => {
      const duplicateUser = TestDataFactory.createUserData({
        email: 'test@example.com', // Already exists from seed data
      });

      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send(duplicateUser)
        .expect(400);

      expect(response.body).toHaveProperty('message');
    });

    it('should return 400 with missing required fields', async () => {
      const incompleteUser = {
        email: 'incomplete@example.com',
        // Missing password, firstName, lastName
      };

      await request(app.getHttpServer())
        .post('/auth/register')
        .send(incompleteUser)
        .expect(400);
    });

    it('should return 400 with invalid email format', async () => {
      const invalidEmailUser = TestDataFactory.createUserData({
        email: 'invalid-email-format',
      });

      await request(app.getHttpServer())
        .post('/auth/register')
        .send(invalidEmailUser)
        .expect(400);
    });

    it('should return 400 with weak password', async () => {
      const weakPasswordUser = TestDataFactory.createUserData({
        password: '123', // Too short
      });

      await request(app.getHttpServer())
        .post('/auth/register')
        .send(weakPasswordUser)
        .expect(400);
    });

    it('should set default role to "user" when not specified', async () => {
      const userWithoutRole = {
        email: 'norole@example.com',
        password: 'password123',
        firstName: 'No',
        lastName: 'Role',
        // No role specified
      };

      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send(userWithoutRole)
        .expect(201);

      expect(response.body.user).toHaveProperty('role', 'user');
    });
  });

  describe('POST /auth/change-password', () => {
    let authToken: string;

    beforeEach(async () => {
      authToken = await TestHelper.getAuthToken(app);
    });

    it('should change password with valid current password', async () => {
      const changePasswordData = {
        currentPassword: 'password123',
        newPassword: 'newpassword123',
      };

      await request(app.getHttpServer())
        .post('/auth/change-password')
        .set(TestHelper.createAuthHeaders(authToken))
        .send(changePasswordData)
        .expect(200);

      // Verify old password no longer works
      const oldPasswordLogin = {
        email: 'test@example.com',
        password: 'password123',
      };

      await request(app.getHttpServer())
        .post('/auth/login')
        .send(oldPasswordLogin)
        .expect(401);

      // Verify new password works
      const newPasswordLogin = {
        email: 'test@example.com',
        password: 'newpassword123',
      };

      await request(app.getHttpServer())
        .post('/auth/login')
        .send(newPasswordLogin)
        .expect(201);
    });

    it('should return 400 with incorrect current password', async () => {
      const wrongCurrentPassword = {
        currentPassword: 'wrongpassword',
        newPassword: 'newpassword123',
      };

      const response = await request(app.getHttpServer())
        .post('/auth/change-password')
        .set(TestHelper.createAuthHeaders(authToken))
        .send(wrongCurrentPassword)
        .expect(400);

      expect(response.body).toHaveProperty('message');
    });

    it('should return 400 with weak new password', async () => {
      const weakNewPassword = {
        currentPassword: 'password123',
        newPassword: '123',
      };

      await request(app.getHttpServer())
        .post('/auth/change-password')
        .set(TestHelper.createAuthHeaders(authToken))
        .send(weakNewPassword)
        .expect(400);
    });

    it('should return 401 without authentication', async () => {
      const changePasswordData = {
        currentPassword: 'password123',
        newPassword: 'newpassword123',
      };

      await request(app.getHttpServer())
        .post('/auth/change-password')
        .send(changePasswordData)
        .expect(401);
    });

    it('should return 400 with missing fields', async () => {
      const incompleteData = {
        currentPassword: 'password123',
        // Missing newPassword
      };

      await request(app.getHttpServer())
        .post('/auth/change-password')
        .set(TestHelper.createAuthHeaders(authToken))
        .send(incompleteData)
        .expect(400);
    });
  });

  describe('GET /auth/profile', () => {
    let authToken: string;

    beforeEach(async () => {
      authToken = await TestHelper.getAuthToken(app);
    });

    it('should return user profile with valid token', async () => {
      const response = await request(app.getHttpServer())
        .get('/auth/profile')
        .set(TestHelper.createAuthHeaders(authToken))
        .expect(200);

      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('email', 'test@example.com');
      expect(response.body).toHaveProperty('firstName', 'Test');
      expect(response.body).toHaveProperty('lastName', 'User');
      expect(response.body).toHaveProperty('role', 'admin');
      expect(response.body).not.toHaveProperty('password');
    });

    it('should return 401 without authentication token', async () => {
      await request(app.getHttpServer())
        .get('/auth/profile')
        .expect(401);
    });

    it('should return 401 with invalid token', async () => {
      await request(app.getHttpServer())
        .get('/auth/profile')
        .set({ Authorization: 'Bearer invalid-token' })
        .expect(401);
    });

    it('should return 401 with malformed token', async () => {
      await request(app.getHttpServer())
        .get('/auth/profile')
        .set({ Authorization: 'InvalidFormat token' })
        .expect(401);
    });
  });

  describe('POST /auth/logout', () => {
    let authToken: string;

    beforeEach(async () => {
      authToken = await TestHelper.getAuthToken(app);
    });

    it('should logout successfully with valid token', async () => {
      await request(app.getHttpServer())
        .post('/auth/logout')
        .set(TestHelper.createAuthHeaders(authToken))
        .expect(200);
    });

    it('should return 401 without authentication token', async () => {
      await request(app.getHttpServer())
        .post('/auth/logout')
        .expect(401);
    });
  });

  describe('JWT Token Protection', () => {
    it('should protect routes with JWT guard', async () => {
      // Test that protected routes require authentication
      const protectedRoutes = [
        { method: 'get', path: '/books' },
        { method: 'post', path: '/books' },
        { method: 'get', path: '/auth/profile' },
        { method: 'post', path: '/auth/logout' },
      ];

      for (const route of protectedRoutes) {
        const response = await request(app.getHttpServer())
          [route.method](route.path)
          .expect(401);

        expect(response.body).toHaveProperty('message');
      }
    });

    it('should allow access with valid JWT token', async () => {
      const authToken = await TestHelper.getAuthToken(app);

      const response = await request(app.getHttpServer())
        .get('/auth/profile')
        .set(TestHelper.createAuthHeaders(authToken))
        .expect(200);

      expect(response.body).toHaveProperty('email');
    });

    it('should handle expired tokens gracefully', async () => {
      // This would require mocking JWT service to create expired tokens
      // For now, we test with an obviously invalid token
      const expiredToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.expired.token';

      await request(app.getHttpServer())
        .get('/auth/profile')
        .set({ Authorization: `Bearer ${expiredToken}` })
        .expect(401);
    });
  });

  describe('Rate Limiting and Security', () => {
    it('should handle multiple login attempts', async () => {
      const invalidLogin = {
        email: 'test@example.com',
        password: 'wrongpassword',
      };

      // Make multiple failed login attempts
      for (let i = 0; i < 3; i++) {
        await request(app.getHttpServer())
          .post('/auth/login')
          .send(invalidLogin)
          .expect(401);
      }

      // Should still respond (not rate limited in test environment)
      await request(app.getHttpServer())
        .post('/auth/login')
        .send(invalidLogin)
        .expect(401);
    });

    it('should sanitize error messages', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'nonexistent@example.com', password: 'wrongpassword' })
        .expect(401);

      // Should not reveal whether email exists or not
      expect(response.body.message).toBe('Invalid credentials');
    });
  });

  describe('User Registration Flow', () => {
    it('should complete full registration and login flow', async () => {
      const newUserData = TestDataFactory.createUserData({
        email: 'fullflow@example.com',
        firstName: 'Full',
        lastName: 'Flow',
      });

      // Step 1: Register
      const registerResponse = await request(app.getHttpServer())
        .post('/auth/register')
        .send(newUserData)
        .expect(201);

      expect(registerResponse.body).toHaveProperty('access_token');
      const registrationToken = registerResponse.body.access_token;

      // Step 2: Use registration token to access profile
      const profileResponse = await request(app.getHttpServer())
        .get('/auth/profile')
        .set(TestHelper.createAuthHeaders(registrationToken))
        .expect(200);

      expect(profileResponse.body.email).toBe('fullflow@example.com');

      // Step 3: Login separately with credentials
      const loginResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: newUserData.email,
          password: newUserData.password,
        })
        .expect(201);

      expect(loginResponse.body).toHaveProperty('access_token');

      // Step 4: Use login token
      await request(app.getHttpServer())
        .get('/auth/profile')
        .set(TestHelper.createAuthHeaders(loginResponse.body.access_token))
        .expect(200);
    });
  });
});