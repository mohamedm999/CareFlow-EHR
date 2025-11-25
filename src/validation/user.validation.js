import Joi from 'joi';

export const getUsersQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  role: Joi.string().valid('admin', 'doctor', 'nurse', 'secretary', 'patient', 'pharmacist', 'lab_technician').optional(),
  isActive: Joi.boolean().optional(),
  search: Joi.string().trim().optional(),
  sortBy: Joi.string().valid('createdAt', 'email', 'firstName', 'lastName').default('createdAt'),
  sortOrder: Joi.string().valid('asc', 'desc').default('desc')
});

export const updateUserRoleSchema = Joi.object({
  roleId: Joi.string().regex(/^[0-9a-fA-F]{24}$/).required().messages({
    'string.pattern.base': 'Invalid role ID format',
    'any.required': 'Role ID is required'
  })
});

export const toggleUserStatusSchema = Joi.object({
  isActive: Joi.boolean().required().messages({
    'any.required': 'isActive status is required',
    'boolean.base': 'isActive must be a boolean'
  })
});

export const userIdSchema = Joi.object({
  id: Joi.string().regex(/^[0-9a-fA-F]{24}$/).required().messages({
    'string.pattern.base': 'Invalid user ID format',
    'any.required': 'User ID is required'
  })
});
