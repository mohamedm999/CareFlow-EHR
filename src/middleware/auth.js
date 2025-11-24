import { verifyAccessToken } from '../utils/jwt.utils.js';
import User from '../models/user.model.js';
import { logger } from '../config/logger.js';

export const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || req.headers.Authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Access token required' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyAccessToken(token);

    const user = await User.findById(decoded.userId)
      .populate('role')
      .select('-password -refreshToken');

    if (!user) return res.status(401).json({ message: 'User not found' });
    if (!user.isActive) return res.status(401).json({ message: 'Account is deactivated' });

    req.user = {
      _id: user._id,
      userId: user._id,
      email: user.email,
      role: user.role,
      disabledPermissions: user.disabledPermissions || []
    };

    next();
  } catch (error) {
    logger.error('Authentication error:', error);
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};
