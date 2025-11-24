export const POPULATE_FIELDS = [
  { path: 'patient', select: 'firstName lastName dateOfBirth gender contactNumber' },
  { path: 'labOrder', select: 'orderNumber tests priority status createdAt' },
  { path: 'performedBy', select: 'firstName lastName email' },
  { path: 'validatedBy', select: 'firstName lastName email' }
];

export const POPULATE_FULL = [
  { path: 'patient', select: 'firstName lastName dateOfBirth gender contactNumber email' },
  { path: 'labOrder', select: 'orderNumber tests priority status clinicalNotes createdAt' },
  { path: 'performedBy', select: 'firstName lastName email' },
  { path: 'validatedBy', select: 'firstName lastName email' },
  { path: 'revisions.revisedBy', select: 'firstName lastName email' }
];

export const POPULATE_BASIC = [
  { path: 'patient', select: 'firstName lastName dateOfBirth gender' },
  { path: 'labOrder', select: 'orderNumber tests priority' },
  { path: 'performedBy', select: 'firstName lastName email' }
];

export const buildLabResultFilter = (query, userId, userRole) => {
  const filter = {};

  if (userRole === 'patient') filter.patient = userId;
  if (query.patient) filter.patient = query.patient;
  if (query.labOrder) filter.labOrder = query.labOrder;
  if (query.status) filter.status = query.status;
  if (query.hasCriticalResults === 'true') filter.hasCriticalResults = true;

  if (query.startDate || query.endDate) {
    filter.createdAt = {};
    if (query.startDate) filter.createdAt.$gte = new Date(query.startDate);
    if (query.endDate) filter.createdAt.$lte = new Date(query.endDate);
  }

  return filter;
};

export const canAccessLabResult = (labResult, userId, userRole) => {
  return userRole !== 'patient' || labResult.patient._id.toString() === userId;
};

export const canModifyLabResult = (labResult) => {
  return labResult.status !== 'final';
};

export const appendValidationNotes = (existingNotes, validationNotes) => {
  return existingNotes ? `${existingNotes}\n${validationNotes}` : validationNotes;
};

export const buildStatsAggregation = () => ({
  byStatus: [
    { $group: { _id: '$status', count: { $sum: 1 } } },
    { $sort: { count: -1 } }
  ],
  avgTests: [
    { $project: { testCount: { $size: '$testResults' } } },
    { $group: { _id: null, avgTests: { $avg: '$testCount' } } }
  ]
});
