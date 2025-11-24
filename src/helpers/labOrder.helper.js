export const POPULATE_FIELDS = [
  { path: 'patient', select: 'firstName lastName dateOfBirth gender contactNumber email' },
  { path: 'orderedBy', select: 'firstName lastName email specialization' },
  { path: 'consultation', select: 'consultationType chiefComplaint diagnosis createdAt' }
];

export const POPULATE_BASIC = [
  { path: 'patient', select: 'firstName lastName dateOfBirth gender' },
  { path: 'orderedBy', select: 'firstName lastName email' },
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
  else if (userRole === 'doctor') filter.orderedBy = userId;

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

export const canAccessLabOrder = (labOrder, userId, userRole) => {
  return userRole !== 'patient' || labOrder.patient._id.toString() === userId;
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
