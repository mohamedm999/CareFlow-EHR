import { generateAccessToken, generateRefreshToken } from '../utils/jwt.utils.js';
import crypto from 'crypto';

export const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000
};

export const createTokenPayload = (user) => ({
  userId: user._id,
  roleId: user.role._id || user.role,
  email: user.email
});

export const generateTokens = (user) => {
  const tokenPayload = createTokenPayload(user);
  return {
    accessToken: generateAccessToken(tokenPayload),
    refreshToken: generateRefreshToken(tokenPayload)
  };
};

export const setRefreshTokenCookie = (res, refreshToken) => {
  res.cookie('refreshToken', refreshToken, COOKIE_OPTIONS);
};

export const formatUserResponse = (user, roleName) => ({
  id: user._id,
  email: user.email,
  firstName: user.firstName,
  lastName: user.lastName,
  role: roleName
});

export const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');

export const generateResetToken = () => crypto.randomBytes(32).toString('hex');
