import Permission from '../models/permission.model.js';
import Role from '../models/role.model.js';
import { logger } from '../config/logger.js';
import { sendError } from '../helpers/response.helper.js';

// Get all permissions
export const getAllPermissions = async (req, res) => {
  try {
    const permissions = await Permission.find().sort({ category: 1, name: 1 });
    
    res.json({
      success: true,
      message: 'Permissions retrieved successfully',
      data: permissions.map(p => ({
        id: p._id,
        name: p.name,
        description: p.description,
        category: p.category
      })),
      total: permissions.length
    });
  } catch (error) {
    logger.error('Get all permissions error:', error);
    return sendError(res, 500, 'Server error', error);
  }
};

// Get permissions grouped by category
export const getPermissionsByCategory = async (req, res) => {
  try {
    const permissions = await Permission.find().sort({ category: 1, name: 1 });
    
   const groupedPermissions = permissions.reduce((acc, perm) => {
      if (!acc[perm.category]) {
        acc[perm.category] = [];
      }
      acc[perm.category].push({
        id: perm._id,
        name: perm.name,
        description: perm.description
      });
      return acc;
    }, {});

    res.json({
      success: true,
      message: 'Permissions grouped by category',
      data: groupedPermissions,
      categories: Object.keys(groupedPermissions)
    });
  } catch (error) {
    logger.error('Get permissions by category error:', error);
    return sendError(res, 500, 'Server error', error);
  }
};

// Get all roles with their permissions
export const getAllRoles = async (req, res) => {
  try {
    const roles = await Role.find()
      .populate('permissions', 'name description category')
      .sort({ name: 1 });
    
    res.json({
      success: true,
      message: 'Roles retrieved successfully',
      data: roles.map(role => ({
        id: role._id,
        name: role.name,
        description: role.description,
        permissions: role.permissions.map(p => ({
          name: p.name,
          category: p.category,
          description: p.description
        })),
        permissionCount: role.permissions.length
      })),
      total: roles.length
    });
  } catch (error) {
    logger.error('Get all roles error:', error);
    return sendError(res, 500, 'Server error', error);
  }
};

// Get single role by name
export const getRoleByName = async (req, res) => {
  try {
    const { roleName } = req.params;
    
    const role = await Role.findOne({ name: roleName })
      .populate('permissions', 'name description category');
    
    if (!role) return sendError(res, 404, 'Role not found');
    
    res.json({
      success: true,
      message: 'Role retrieved successfully',
      data: {
        id: role._id,
        name: role.name,
        description: role.description,
        permissions: role.permissions.map(p => ({
          name: p.name,
          category: p.category,
          description: p.description
        })),
        permissionCount: role.permissions.length
      }
    });
  } catch (error) {
    logger.error('Get role by name error:', error);
    return sendError(res, 500, 'Server error', error);
  }
};
