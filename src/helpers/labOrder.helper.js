export const POPULATE_FIELDS = [
  { path: 'patient', select: 'firstName lastName dateOfBirth gender contactNumber email' },
  { path: 'doctor', select: 'firstName lastName email specialization' },
  { path: 'consultation', select: 'consultationType chiefComplaint diagnosis createdAt' }
];

export const POPULATE_BASIC = [
  { path: 'patient', select: 'firstName lastName dateOfBirth gender' },
  { path: 'doctor', select: 'firstName lastName email' },
  { path: 'consultation', select: 'consultationType chiefComplaint' }
];

export const VALID_STATUS_TRANSITIONS = {
  'ordered': ['collected', 'cancelled'],
  'collected': ['received', 'cancelled'],
  'received': ['in_progress', 'cancelled'],
  'in_progress': ['completed', 'cancelled'],
  'completed': ['validated'],
  'validated': ['reported']
};

export const IMMUTABLE_STATUSES = ['in_progress', 'completed', 'validated', 'reported'];
export const CANCELLABLE_STATUSES = ['completed', 'validated', 'reported', 'cancelled'];

export const buildLabOrderFilter = (query, userId, userRole) => {
  const filter = {};

  if (userRole === 'patient') filter.patient = userId;
  else if (userRole === 'doctor') filter.doctor = userId;

  if (query.patient) filter.patient = query.patient;
  if (query.consultation) filter.consultation = query.consultation;
  if (query.status) filter.status = query.status;
  if (query.priority) filter.priority = query.priority;
  if (query.category) filter['tests.category'] = query.category;
  if (query.orderNumber) filter.orderNumber = { $regex: query.orderNumber, $options: 'i' };

  if (query.startDate || query.endDate) {
    filter.createdAt = {};
    if (query.startDate) filter.createdAt.$gte = new Date(query.startDate);
    if (query.endDate) filter.createdAt.$lte = new Date(query.endDate);
  }

  return filter;
};

// Helper to get ID from either ObjectId or populated object
const getDocId = (doc) => {
  if (!doc) return null;
  return doc._id ? doc._id.toString() : doc.toString();
};

export const canAccessLabOrder = (labOrder, userId, userRole, userPermissions = []) => {
  // Admin always has access
  if (userRole === 'admin') return true;
  
  // Check if user has view_all_lab_orders permission
  const hasViewAll = userPermissions.some(p => 
    (typeof p === 'string' ? p : p.name) === 'view_all_lab_orders'
  );
  if (hasViewAll) return true;
  
  const userIdStr = userId.toString();
  const labOrderDoctorId = getDocId(labOrder.doctor);
  const labOrderPatientId = getDocId(labOrder.patient);
  
  // Doctors can access their own orders
  if (userRole === 'doctor' && labOrderDoctorId === userIdStr) return true;
  
  // Lab technicians can access all lab orders (they have view_lab_orders)
  if (userRole === 'lab_technician') return true;
  
  // Patients can only access their own lab orders
  if (userRole === 'patient') {
    return labOrderPatientId === userIdStr;
  }
  
  return false;
};

export const canModifyLabOrder = (labOrder) => {
  return !IMMUTABLE_STATUSES.includes(labOrder.status);
};

export const canCancelLabOrder = (labOrder) => {
  return !CANCELLABLE_STATUSES.includes(labOrder.status);
};

export const isValidStatusTransition = (currentStatus, newStatus) => {
  const allowedStatuses = VALID_STATUS_TRANSITIONS[currentStatus] || [];
  return allowedStatuses.includes(newStatus);
};

export const appendNotes = (existingNotes, newNotes) => {
  return existingNotes ? `${existingNotes}\n${newNotes}` : newNotes;
};

export const buildStatsAggregation = () => ({
  byStatus: [
    { $group: { _id: '$status', count: { $sum: 1 } } },
    { $sort: { count: -1 } }
  ],
  byPriority: [
    { $group: { _id: '$priority', count: { $sum: 1 } } },
    { $sort: { count: -1 } }
  ],
  byCategory: [
    { $unwind: '$tests' },
    { $group: { _id: '$tests.category', count: { $sum: 1 } } },
    { $sort: { count: -1 } }
  ]
});
