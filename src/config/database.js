import mongoose from 'mongoose';
import { logger } from './logger.js';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/careflow_ehr';

const MAX_RETRIES = 5;
const RETRY_DELAY = 5000;

export const connectToDatabase = async (retryCount = 0) => {
  try {
    await mongoose.connect(MONGODB_URI, {
      autoIndex: true,
      socketTimeoutMS: 45000,
      connectTimeoutMS: 10000,
      serverSelectionTimeoutMS: 10000,
      retryWrites: true,
      maxPoolSize: 10
    });
    
    logger.info('Connected to MongoDB successfully');
    
    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected');
    });
    
    mongoose.connection.on('error', (error) => {
      logger.error('MongoDB connection error:', error);
    });
    
    return mongoose.connection;
  } catch (error) {
    if (retryCount < MAX_RETRIES) {
      logger.warn(`MongoDB connection failed. Retrying in ${RETRY_DELAY / 1000}s (${retryCount + 1}/${MAX_RETRIES})...`);
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
      return connectToDatabase(retryCount + 1);
    }
    
    logger.error('Failed to connect to MongoDB after max retries:', error);
    process.exit(1);
  }
};

export const disconnectFromDatabase = async () => {
  try {
    await mongoose.disconnect();
    logger.info('Disconnected from MongoDB');
  } catch (error) {
    logger.error('Error disconnecting from MongoDB:', error);
  }
};
