import Permission from '../models/permission.model.js';
import { logger } from '../config/logger.js';

export const checkPermission = (requiredPermission) => {
  return async (req, res, next) => {
    try {
      const { role, disabledPermissions = [] } = req.user;
      
      if (!role || !role.permissions) {
        return res.status(403).json({ message: 'Access denied - no permissions' });
      }

      const rolePermissions = await Permission.find({
        _id: { $in: role.permissions }
      }).select('name');

      const permissionNames = rolePermissions.map(p => p.name);

      const hasPermission = permissionNames.includes(requiredPermission);
      const isDisabled = disabledPermissions.some(
        disabledId => rolePermissions.find(p => p._id.equals(disabledId) && p.name === requiredPermission)
      );

      if (!hasPermission || isDisabled) {
        return res.status(403).json({ 
          message: `Access denied - missing permission: ${requiredPermission}` 
        });
      }

      next();
    } catch (error) {
      logger.error('Permission check error:', error);
      res.status(500).json({ message: 'Server error during permission check' });
    }
  };
};

