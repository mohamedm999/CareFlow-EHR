import express from 'express';
import { register, login, refreshToken, logout } from '../controllers/auth.controller.js';
import { authenticateToken } from '../middleware/auth.js';
import { validateRegistration, validateLogin } from '../middleware/validator.js';

const router = express.Router();


router.post('/register', validateRegistration, register);


router.post('/login', validateLogin, login);


router.post('/refresh-token', refreshToken);


router.post('/logout', authenticateToken, logout);

export default router;