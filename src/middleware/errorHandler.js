import { logger } from '../config/logger.js';
import { generateCorrelationId } from '../helpers/response.helper.js';

export const errorHandler = (err, req, res, next) => {
  const correlationId = generateCorrelationId();
  
  const errorResponse = {
    success: false,
    code: err.code || 'INTERNAL_ERROR',
    message: err.message || 'An unexpected error occurred',
    correlationId,
    timestamp: new Date().toISOString()
  };
  
  const status = err.status || err.statusCode || 500;
  
  if (process.env.NODE_ENV === 'development') {
    errorResponse.stack = err.stack;
    errorResponse.details = err;
  }
  
  logger.error('Error:', {
    correlationId,
    status,
    message: err.message,
    path: req.path,
    method: req.method,
    userId: req.user?._id,
    ip: req.ip,
    stack: err.stack
  });
  
  res.status(status).json(errorResponse);
};

export const asyncHandler = (fn) => (req, res, next) => {
  return Promise.resolve(fn(req, res, next)).catch(next);
};
