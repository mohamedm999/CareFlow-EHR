import User from '../models/user.model.js';
import Role from '../models/role.model.js';
import { logger } from '../config/logger.js';
import { verifyRefreshToken } from '../utils/jwt.utils.js';
import { sendError } from '../helpers/response.helper.js';
import { generateTokens, setRefreshTokenCookie, formatUserResponse, hashToken, generateResetToken } from '../helpers/auth.helper.js';

// Patient self-registration (auto-assigns "patient" role)
export const register = async (req, res) => {
  try {
    const { email, password, firstName, lastName } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) return sendError(res, 400, 'User already exists');

    // Auto-assign patient role
    const patientRole = await Role.findOne({ name: 'patient' });
    if (!patientRole) return sendError(res, 500, 'Patient role not found in system');

    const user = await User.create({ 
      email, 
      password, 
      firstName, 
      lastName, 
      role: patientRole._id 
    });

    const { accessToken, refreshToken } = generateTokens({ ...user.toObject(), role: patientRole._id });

    user.refreshToken = refreshToken;
    await user.save();

    setRefreshTokenCookie(res, refreshToken);
    res.status(201).json({
      success: true,
      message: 'Patient account created successfully',
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: {
          name: patientRole.name,
          description: patientRole.description
        },
        isActive: user.isActive
      },
      accessToken
    });
  } catch (error) {
    logger.error('Registration error:', error);
    return sendError(res, 500, 'Server error', error);
  }
};

// Admin-only staff registration
export const registerStaff = async (req, res) => {
  try {
    const { email, password, firstName, lastName, roleName } = req.body;

    // Prevent creating patient accounts through this endpoint
    if (roleName === 'patient') {
      return sendError(res, 400, 'Use /auth/register for patient accounts');
    }

    const [existingUser, role] = await Promise.all([
      User.findOne({ email }),
      Role.findOne({ name: roleName })
    ]);

    if (existingUser) return sendError(res, 400, 'User already exists');
    if (!role) return sendError(res, 400, 'Invalid role');

    const user = await User.create({ 
      email, 
      password, 
      firstName, 
      lastName, 
      role: role._id 
    });

    const { accessToken, refreshToken } = generateTokens({ ...user.toObject(), role: role._id });

    user.refreshToken = refreshToken;
    await user.save();

    setRefreshTokenCookie(res, refreshToken);
    res.status(201).json({
      success: true,
      message: `${roleName.charAt(0).toUpperCase() + roleName.slice(1)} account created successfully`,
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: {
          name: role.name,
          description: role.description
        },
        isActive: user.isActive
      },
      accessToken
    });
  } catch (error) {
    logger.error('Staff registration error:', error);
    return sendError(res, 500, 'Server error', error);
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email })
      .populate({
        path: 'role',
        populate: {
          path: 'permissions',
          select: 'name description category'
        }
      });
      
    if (!user) return sendError(res, 401, 'Invalid credentials');
    if (!user.isActive) return sendError(res, 401, 'Account is deactivated');
    if (!await user.comparePassword(password)) return sendError(res, 401, 'Invalid credentials');

    const { accessToken, refreshToken } = generateTokens(user);

    user.refreshToken = refreshToken;
    await user.save();

    setRefreshTokenCookie(res, refreshToken);
    res.json({
      success: true,
      message: 'Login successful',
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: {
          name: user.role.name,
          description: user.role.description
        },
        isActive: user.isActive
      },
      permissions: user.role.permissions.map(p => ({
        name: p.name,
        category: p.category,
        description: p.description
      })),
      accessToken
    });
  } catch (error) {
    logger.error('Login error:', error);
    return sendError(res, 500, 'Server error', error);
  }
};

export const refreshToken = async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) return sendError(res, 401, 'Refresh token required');

    const user = await User.findById(verifyRefreshToken(refreshToken).userId).populate('role');
    if (!user || user.refreshToken !== refreshToken) return sendError(res, 401, 'Invalid refresh token');
    if (!user.isActive) return sendError(res, 401, 'Account is deactivated');

    const { accessToken: newAccessToken, refreshToken: newRefreshToken } = generateTokens(user);

    user.refreshToken = newRefreshToken;
    await user.save();

    setRefreshTokenCookie(res, newRefreshToken);
    res.json({ success: true, message: 'Token refreshed successfully', accessToken: newAccessToken });
  } catch (error) {
    logger.error('Refresh token error:', error);
    return sendError(res, 401, 'Invalid refresh token', error);
  }
};

export const logout = async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.user.userId, { refreshToken: null });
    res.clearCookie('refreshToken');
    res.json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    logger.error('Logout error:', error);
    return sendError(res, 500, 'Server error', error);
  }
};

export const forgotPassword = async (req, res) => {
  try {
    const user = await User.findOne({ email: req.body.email });
    if (!user) return res.json({ success: true, message: 'If email exists, reset link will be sent' });

    const resetToken = generateResetToken();
    user.resetPasswordToken = hashToken(resetToken);
    user.resetPasswordExpires = Date.now() + 3600000;
    await user.save();

    logger.info(`Password reset requested for user ${user._id}`);
    res.json({ success: true, message: 'Password reset email sent' });
  } catch (error) {
    logger.error('Forgot password error:', error);
    return sendError(res, 500, 'Server error', error);
  }
};

export const resetPassword = async (req, res) => {
  try {
    if (!req.params.token) return sendError(res, 400, 'Reset token is required');
    if (!req.body.password) return sendError(res, 400, 'New password is required');

    const user = await User.findOne({ 
      resetPasswordToken: hashToken(req.params.token), 
      resetPasswordExpires: { $gt: Date.now() } 
    });

    if (!user) return sendError(res, 400, 'Invalid or expired reset token');

    user.password = req.body.password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    logger.info(`Password reset successful for user ${user._id}`);
    res.json({ success: true, message: 'Password reset successful' });
  } catch (error) {
    logger.error('Reset password error:', error);
    return sendError(res, 500, 'Server error', error);
  }
};

// Get current authenticated user with permissions
export const getCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId)
      .populate({
        path: 'role',
        populate: {
          path: 'permissions',
          select: 'name description category'
        }
      })
      .select('-password -refreshToken');

    if (!user) return sendError(res, 404, 'User not found');
    if (!user.isActive) return sendError(res, 401, 'Account is deactivated');

    res.json({
      success: true,
      message: 'User retrieved successfully',
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: {
          name: user.role.name,
          description: user.role.description
        },
        isActive: user.isActive,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      },
      permissions: user.role.permissions.map(p => ({
        name: p.name,
        category: p.category,
        description: p.description
      }))
    });
  } catch (error) {
    logger.error('Get current user error:', error);
    return sendError(res, 500, 'Server error', error);
  }
};
