import express from 'express';
import { 
  getAllPermissions, 
  getPermissionsByCategory, 
  getAllRoles,
  getRoleByName 
} from '../controllers/permission.controller.js';
import { authenticateToken } from '../middleware/auth.js';
import { checkPermission } from '../middleware/checkPermission.js';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Get all permissions (admin only)
router.get(
  '/permissions',
  checkPermission('access_system_settings'),
  getAllPermissions
);

// Get permissions grouped by category (admin only)
router.get(
  '/permissions/by-category',
  checkPermission('access_system_settings'),
  getPermissionsByCategory
);

// Get all roles with permissions (accessible to all authenticated users)
router.get('/roles', getAllRoles);

// Get specific role by name
router.get('/roles/:roleName', getRoleByName);

export default router;
