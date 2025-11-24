import request from 'supertest';
import express from 'express';
import authRoutes from '../../routes/auth.routes.js';
import User from '../../models/user.model.js';
import Role from '../../models/role.model.js';

const app = express();
app.use(express.json());
app.set('trust proxy', 1);
app.use('/api/auth', authRoutes);

describe('Auth Integration Tests', () => {
  let adminRole;

  beforeAll(async () => {
    adminRole = await Role.create({
      name: 'admin',
      description: 'Administrator',
      permissions: []
    });
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          password: 'Password123',
          roleName: 'admin'
        });
      expect(response.status).toBe(201);
      
      expect(response.body.success).toBe(true);

      expect(response.body.user).toBeDefined();
    });

    it('should return 400 for invalid data', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          firstName: 'John',
          email: 'invalid-email'
        });

      expect(response.status).toBe(400);
    });

    it('should return 400 for duplicate email', async () => {
      await User.create({
        firstName: 'Jane',
        lastName: 'Doe',
        email: 'jane@example.com',
        password: 'hashed',
        role: adminRole._id
      });

      const response = await request(app)
        .post('/api/auth/register')
        .send({
          firstName: 'Jane',
          lastName: 'Smith',
          email: 'jane@example.com',
          password: 'Password123',
          roleName: 'admin'
        });

      expect(response.status).toBe(400);
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      await User.create({
        firstName: 'Test',
        lastName: 'User',
        email: 'test@example.com',
        password: 'Password123',
        role: adminRole._id
      });
    });

    it('should login with valid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .set('X-Forwarded-For', `192.168.1.${Math.floor(Math.random() * 255)}`)
        .send({
          email: 'test@example.com',
          password: 'Password123'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.accessToken).toBeDefined();
    });

    it('should return 401 for invalid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .set('X-Forwarded-For', `192.168.1.${Math.floor(Math.random() * 255)}`)
        .send({
          email: 'test@example.com',
          password: 'WrongPassword'
        });

      expect(response.status).toBe(401);
    });
  });
});
