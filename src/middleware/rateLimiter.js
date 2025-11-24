import rateLimit from 'express-rate-limit';

export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => process.env.NODE_ENV !== 'production'
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: 'Too many login attempts, please try again later',
  standardHeaders: true,
  legacyHeaders: false
});

export const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  message: 'Too many requests to this endpoint, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => process.env.NODE_ENV !== 'production'
});

export const documentLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: 'Too many document uploads, please try again later',
  standardHeaders: true,
  legacyHeaders: false
});

export const searchLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  message: 'Too many search requests, please try again later',
  standardHeaders: true,
  legacyHeaders: false
});
