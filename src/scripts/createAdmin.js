#!/usr/bin/env node

/**
 * Standalone script to create admin user
 * Usage: node src/scripts/createAdmin.js
 */

import dotenv from 'dotenv';
import { connectToDatabase } from '../config/database.js';
import { seedRolesAndPermissions } from '../config/seedRolesPermissions.js';
import { seedAdminUser } from '../config/seedAdmin.js';
import { logger } from '../config/logger.js';

// Load environment variables
dotenv.config();

async function main() {
  try {
    logger.info('🚀 Starting admin user creation...');
    
    // Connect to database
    await connectToDatabase();
    logger.info('✅ Connected to database');

    // Ensure roles exist
    await seedRolesAndPermissions();
    logger.info('✅ Roles and permissions verified');

    // Create admin user
    await seedAdminUser();
    
    logger.info('🎉 Admin user creation complete!');
    logger.info('');
    logger.info('📧 Email: admin@careflow.com');
    logger.info('🔑 Password: Admin@123456');
    logger.info('');
    logger.info('⚠️  IMPORTANT: Please change the password after first login!');
    
    process.exit(0);
  } catch (error) {
    logger.error('❌ Failed to create admin user:', error);
    process.exit(1);
  }
}

main();
