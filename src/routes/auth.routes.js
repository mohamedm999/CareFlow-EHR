import express from 'express';
import rateLimit from 'express-rate-limit';
import { register, login, refreshToken, logout, registerStaff, getCurrentUser } from '../controllers/auth.controller.js';
import { authenticateToken } from '../middleware/auth.js';
import { checkPermission } from '../middleware/checkPermission.js';
import { validateRegistration, validateLogin } from '../middleware/validator.js';

const router = express.Router();

/**
 * @swagger
 * /auth/register:
 *   post:
 *     tags: [Authentication]
 *     summary: Register a new user
 *     description: Create a new user account with role assignment
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - firstName
 *               - lastName
 *               - email
 *               - password
 *               - role
 *             properties:
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 format: password
 *               role:
 *                 type: string
 *                 enum: [admin, doctor, nurse, secretary, patient, pharmacist]
 *     responses:
 *       201:
 *         description: User registered successfully
 *       400:
 *         description: Validation error
 *       409:
 *         description: User already exists
 */

/**
 * @swagger
 * /auth/login:
 *   post:
 *     tags: [Authentication]
 *     summary: Login user
 *     description: Authenticate user and return JWT tokens
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 format: password
 *     responses:
 *       200:
 *         description: Login successful
 *       401:
 *         description: Invalid credentials
 *       429:
 *         description: Too many attempts
 */

/**
 * @swagger
 * /auth/refresh-token:
 *   post:
 *     tags: [Authentication]
 *     summary: Refresh access token
 *     description: Get new access token using refresh token
 *     responses:
 *       200:
 *         description: Token refreshed successfully
 *       401:
 *         description: Invalid refresh token
 */

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     tags: [Authentication]
 *     summary: Logout user
 *     description: Invalidate refresh token
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Logout successful
 *       401:
 *         description: Unauthorized
 */

const authLimiter = rateLimit({
  windowMs:  60 * 1000,
  max: 100, // Increased for development
  message: { success: false, message: 'Too many attempts, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
  skipFailedRequests: false
});

const refreshLimiter = rateLimit({
  windowMs:  60 * 1000,
  max: 100,
  message: { success: false, message: 'Too many refresh attempts' },
  standardHeaders: true,
  legacyHeaders: false
});

// Patient self-registration (public)
router.post('/register', authLimiter, validateRegistration, register);

// Staff registration (admin only)
router.post('/register-staff', authenticateToken, checkPermission('create_users'), authLimiter, validateRegistration, registerStaff);

// Authentication
router.post('/login', authLimiter, validateLogin, login);
router.post('/refresh-token', refreshLimiter, refreshToken);
router.post('/logout', authenticateToken, logout);

// Get current authenticated user with permissions
router.get('/me', authenticateToken, getCurrentUser);

export default router;
