import User from '../models/user.model.js';
import Role from '../models/role.model.js';
import { logger } from './logger.js';

/**
 * Seed default admin user
 * This creates a hardcoded admin account for initial system access
 */
export async function seedAdminUser() {
  try {
    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: 'admin@careflow.com' });
    
    if (existingAdmin) {
      logger.info('Admin user already exists, skipping admin seed...');
      return;
    }

    // Find the admin role
    const adminRole = await Role.findOne({ name: 'admin' });
    
    if (!adminRole) {
      throw new Error('Admin role not found. Please run seedRolesAndPermissions first.');
    }

    // Create admin user
    const adminUser = await User.create({
      email: 'admin@careflow.com',
      password: 'Admin@123456',  // Change this in production!
      firstName: 'System',
      lastName: 'Administrator',
      role: adminRole._id,
      isActive: true
    });

    logger.info(`✅ Admin user created successfully!
      Email: admin@careflow.com
      Password: Admin@123456
      ⚠️  Please change the password after first login!
    `);

    return adminUser;

  } catch (error) {
    logger.error('Error seeding admin user:', error);
    throw error;
  }
}
