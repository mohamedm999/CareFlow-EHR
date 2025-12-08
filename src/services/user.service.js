import User from '../models/user.model.js';
import Role from '../models/role.model.js';
import { logger } from '../config/logger.js';

export const getAllUsers = async (query) => {
  const filter = {};
  
  if (query.role) {
    const role = await Role.findOne({ name: query.role }).select('_id');
    if (role) filter.role = role._id;
  }
  
  if (query.isActive !== undefined) {
    filter.isActive = query.isActive;
  }
  
  if (query.search) {
    filter.$or = [
      { email: { $regex: query.search, $options: 'i' } },
      { firstName: { $regex: query.search, $options: 'i' } },
      { lastName: { $regex: query.search, $options: 'i' } }
    ];
  }

  const users = await User.paginate(filter, {
    page: parseInt(query.page || 1),
    limit: parseInt(query.limit || 10),
    sort: { [query.sortBy || 'createdAt']: query.sortOrder === 'asc' ? 1 : -1 },
    populate: { path: 'role', select: 'name description' },
    select: '-password -refreshToken'
  });

  return users;
};

// Public endpoint for getting doctors list (any authenticated user)
export const getDoctorsList = async (query) => {
  const doctorRole = await Role.findOne({ name: 'doctor' }).select('_id');
  if (!doctorRole) return { docs: [], totalDocs: 0, page: 1, totalPages: 0 };

  const filter = {
    role: doctorRole._id,
    isActive: true // Only active doctors
  };
  
  if (query.search) {
    filter.$or = [
      { firstName: { $regex: query.search, $options: 'i' } },
      { lastName: { $regex: query.search, $options: 'i' } }
    ];
  }

  const doctors = await User.paginate(filter, {
    page: parseInt(query.page || 1),
    limit: parseInt(query.limit || 100),
    sort: { firstName: 1, lastName: 1 },
    populate: { path: 'role', select: 'name description' },
    select: 'firstName lastName email specialization licenseNumber' // Only return necessary fields
  });

  return doctors;
};

export const getUserById = async (userId) => {
  const user = await User.findById(userId)
    .populate('role', 'name description permissions')
    .select('-password -refreshToken');
  
  if (!user) throw { status: 404, message: 'User not found' };
  return user;
};

export const updateUserRole = async (userId, roleId, requestingUserId) => {
  const user = await User.findById(userId);
  if (!user) throw { status: 404, message: 'User not found' };

  const role = await Role.findById(roleId);
  if (!role) throw { status: 404, message: 'Role not found' };

  if (userId === requestingUserId.toString()) {
    throw { status: 403, message: 'Cannot modify your own role' };
  }

  user.role = roleId;
  await user.save();

  await user.populate('role', 'name description');
  logger.info(`User role updated: ${user.email} -> ${role.name}`);

  return user;
};

export const toggleUserStatus = async (userId, isActive, requestingUserId) => {
  const user = await User.findById(userId);
  if (!user) throw { status: 404, message: 'User not found' };

  if (userId === requestingUserId.toString()) {
    throw { status: 403, message: 'Cannot modify your own account status' };
  }

  user.isActive = isActive;
  await user.save();

  logger.info(`User status updated: ${user.email} -> ${isActive ? 'Active' : 'Inactive'}`);
  return user;
};
