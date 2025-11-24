import { logAudit } from '../services/audit.service.js';

const getResourceInfo = (req) => {
  const patternMap = {
    patients: { type: 'Patient', idIndex: 2 },
    appointments: { type: 'Appointment', idIndex: 2 },
    consultations: { type: 'Consultation', idIndex: 2 },
    prescriptions: { type: 'Prescription', idIndex: 2 },
    documents: { type: 'Document', idIndex: 2 },
    'lab-orders': { type: 'Lab', idIndex: 2 },
    'lab-results': { type: 'Lab', idIndex: 2 },
    pharmacies: { type: 'Pharmacy', idIndex: 2 }
  };
  
  const path = req.path.split('/').filter(Boolean);
  
  for (const [key, value] of Object.entries(patternMap)) {
    if (path.includes(key)) {
      return {
        resourceType: value.type,
        resourceId: path[value.idIndex] || req.params.id
      };
    }
  }
  
  return null;
};

const getAction = (method) => {
  const methodMap = {
    POST: 'CREATE',
    GET: 'READ',
    PUT: 'UPDATE',
    PATCH: 'UPDATE',
    DELETE: 'DELETE'
  };
  return methodMap[method] || 'READ';
};

export const auditMiddleware = async (req, res, next) => {
  const originalJson = res.json;
  
  res.json = async function(data) {
    if (req.user && res.statusCode < 400) {
      const resourceInfo = getResourceInfo(req);
      
      if (resourceInfo) {
        try {
          await logAudit({
            userId: req.user._id,
            action: getAction(req.method),
            resourceType: resourceInfo.resourceType,
            resourceId: resourceInfo.resourceId,
            resourceName: data.data?.firstName || data.data?.name || data.data?.title,
            ipAddress: req.ip,
            userAgent: req.get('user-agent'),
            status: 'SUCCESS'
          });
        } catch (error) {
          console.error('Audit logging error:', error);
        }
      }
    }
    
    return originalJson.call(this, data);
  };
  
  next();
};
