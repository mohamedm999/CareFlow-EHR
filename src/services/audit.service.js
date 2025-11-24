import AuditLog from '../models/auditLog.model.js';
import { logger } from '../config/logger.js';

export const logAudit = async (auditData) => {
  try {
    const log = new AuditLog({
      userId: auditData.userId,
      action: auditData.action,
      resourceType: auditData.resourceType,
      resourceId: auditData.resourceId,
      resourceName: auditData.resourceName,
      changes: auditData.changes,
      ipAddress: auditData.ipAddress,
      userAgent: auditData.userAgent,
      status: auditData.status || 'SUCCESS',
      reason: auditData.reason
    });
    
    await log.save();
  } catch (error) {
    logger.error('Failed to log audit event:', error);
  }
};

export const getAuditLogs = async (filters = {}, page = 1, limit = 20) => {
  try {
    const skip = (page - 1) * limit;
    
    const query = {};
    if (filters.userId) query.userId = filters.userId;
    if (filters.resourceType) query.resourceType = filters.resourceType;
    if (filters.action) query.action = filters.action;
    if (filters.startDate || filters.endDate) {
      query.timestamp = {};
      if (filters.startDate) query.timestamp.$gte = new Date(filters.startDate);
      if (filters.endDate) query.timestamp.$lte = new Date(filters.endDate);
    }
    
    const [logs, total] = await Promise.all([
      AuditLog.find(query)
        .populate('userId', 'firstName lastName email')
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      AuditLog.countDocuments(query)
    ]);
    
    return {
      logs,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    };
  } catch (error) {
    logger.error('Error fetching audit logs:', error);
    throw error;
  }
};

export const getResourceAuditHistory = async (resourceType, resourceId) => {
  try {
    return await AuditLog.find({ resourceType, resourceId })
      .populate('userId', 'firstName lastName email')
      .sort({ timestamp: -1 })
      .lean();
  } catch (error) {
    logger.error('Error fetching resource audit history:', error);
    throw error;
  }
};
