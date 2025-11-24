import { logger } from './logger.js';

const REQUIRED_ENV_VARS = [
  'NODE_ENV',
  'PORT',
  'MONGODB_URI',
  'JWT_SECRET',
  'JWT_REFRESH_SECRET',
  'S3_ENDPOINT',
  'S3_ACCESS_KEY',
  'S3_SECRET_KEY',
  'S3_REGION'
];

const OPTIONAL_ENV_VARS = {
  'CORS_ORIGIN': 'http://localhost:3000',
  'S3_BUCKET_NAME': 'careflow-documents',
  'JWT_EXPIRY': '15m',
  'JWT_REFRESH_EXPIRY': '7d',
  'LOG_LEVEL': 'info'
};

export const validateEnvironment = () => {
  const missing = [];
  const invalid = [];
  
  for (const envVar of REQUIRED_ENV_VARS) {
    if (!process.env[envVar]) {
      missing.push(envVar);
    }
  }
  
  if (process.env.NODE_ENV && !['development', 'production', 'test'].includes(process.env.NODE_ENV)) {
    invalid.push('NODE_ENV must be: development, production, or test');
  }
  
  if (process.env.PORT && isNaN(parseInt(process.env.PORT))) {
    invalid.push('PORT must be a valid number');
  }
  
  if (missing.length > 0) {
    logger.error('Missing required environment variables:', missing.join(', '));
    process.exit(1);
  }
  
  if (invalid.length > 0) {
    logger.error('Invalid environment variable values:', invalid.join('; '));
    process.exit(1);
  }
  
  for (const [key, defaultValue] of Object.entries(OPTIONAL_ENV_VARS)) {
    if (!process.env[key]) {
      process.env[key] = defaultValue;
      logger.info(`Using default for ${key}: ${defaultValue}`);
    }
  }
  
  logger.info('Environment validation successful');
};
