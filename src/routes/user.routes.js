import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { checkPermission } from '../middleware/checkPermission.js';
import { validate } from '../middleware/validator.js';
import {
  getAllUsers,
  getUserById,
  updateUserRole,
  toggleUserStatus,
  getDoctorsList
} from '../controllers/user.controller.js';
import {
  getUsersQuerySchema,
  userIdSchema,
  updateUserRoleSchema,
  toggleUserStatusSchema
} from '../validation/user.validation.js';

const router = express.Router();

router.use(authenticateToken);

// Public endpoint for getting doctors list (for appointment booking)
// Any authenticated user can access this
router.get('/doctors', getDoctorsList);

router.get(
  '/',
  checkPermission('view_all_users'),
  validate(getUsersQuerySchema, 'query'),
  getAllUsers
);

router.get(
  '/:id',
  checkPermission('view_all_users'),
  validate(userIdSchema, 'params'),
  getUserById
);

router.patch(
  '/:id/role',
  checkPermission('modify_user_roles'),
  validate(userIdSchema, 'params'),
  validate(updateUserRoleSchema, 'body'),
  updateUserRole
);

router.patch(
  '/:id/status',
  checkPermission('suspend_activate_accounts'),
  validate(userIdSchema, 'params'),
  validate(toggleUserStatusSchema, 'body'),
  toggleUserStatus
);

export default router;
