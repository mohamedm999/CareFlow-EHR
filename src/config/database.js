import mongoose from 'mongoose';
import { logger } from './logger.js';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/careflow_ehr';

export const connectToDatabase = async () => {
  try {
    await mongoose.connect(MONGODB_URI, {
      autoIndex: true,
    });
    
    logger.info('Connected to MongoDB successfully');
    return mongoose.connection;
  } catch (error) {
    logger.error('Error connecting to MongoDB:', error);
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