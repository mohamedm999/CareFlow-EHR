import { logger } from '../config/logger.js';
import { sendError } from '../helpers/response.helper.js';
import * as userService from '../services/user.service.js';

export const getAllUsers = async (req, res) => {
  try {
    const users = await userService.getAllUsers(req.query);
    res.status(200).json({
      success: true,
      message: 'Users retrieved successfully',
      data: users
    });
  } catch (error) {
    logger.error('Get all users error:', error);
    return sendError(res, error.status || 500, error.message || 'Error retrieving users', error);
  }
};

export const getUserById = async (req, res) => {
  try {
    const user = await userService.getUserById(req.params.id);
    res.status(200).json({
      success: true,
      message: 'User retrieved successfully',
      data: user
    });
  } catch (error) {
    logger.error('Get user by ID error:', error);
    return sendError(res, error.status || 500, error.message || 'Error retrieving user', error);
  }
};

export const updateUserRole = async (req, res) => {
  try {
    const user = await userService.updateUserRole(req.params.id, req.body.roleId, req.user.userId);
    logger.info(`User role updated: ${user.email} by ${req.user.email || 'admin'}`);
    res.status(200).json({
      success: true,
      message: 'User role updated successfully',
      data: user
    });
  } catch (error) {
    logger.error('Update user role error:', error);
    return sendError(res, error.status || 500, error.message || 'Error updating user role', error);
  }
};

export const toggleUserStatus = async (req, res) => {
  try {
    const user = await userService.toggleUserStatus(req.params.id, req.body.isActive, req.user.userId);
    logger.info(`User status toggled: ${user.email} -> ${user.isActive ? 'Active' : 'Inactive'} by ${req.user.email || 'admin'}`);
    res.status(200).json({
      success: true,
      message: `User ${user.isActive ? 'activated' : 'deactivated'} successfully`,
      data: user
    });
  } catch (error) {
    logger.error('Toggle user status error:', error);
    return sendError(res, error.status || 500, error.message || 'Error toggling user status', error);
  }
};
