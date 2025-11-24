import crypto from 'crypto';

export const POPULATE_FIELDS = [
  { path: 'patient', select: 'firstName lastName dateOfBirth gender contactNumber' },
  { path: 'uploadedBy', select: 'firstName lastName email' },
  { path: 'consultation', select: 'consultationType chiefComplaint diagnosis createdAt' },
  { path: 'labOrder', select: 'orderNumber tests status' },
  { path: 'prescription', select: 'prescriptionNumber medications status' }
];

export const POPULATE_VERSIONS = { path: 'versions.uploadedBy', select: 'firstName lastName email' };

export const calculateChecksum = (buffer) => crypto.createHash('sha256').update(buffer).digest('hex');

export const generateFileName = (category, originalName) => `${category}-${Date.now()}-${originalName}`;

export const buildDocumentFilter = (query, userId, userRole) => {
  const filter = {};
  
  if (userRole === 'patient') filter.patient = userId;
  if (query.patient) filter.patient = query.patient;
  if (query.consultation) filter.consultation = query.consultation;
  if (query.labOrder) filter.labOrder = query.labOrder;
  if (query.prescription) filter.prescription = query.prescription;
  if (query.category) filter.category = query.category;
  if (query.uploadedBy) filter.uploadedBy = query.uploadedBy;
  if (query.isConfidential !== undefined) filter.isConfidential = query.isConfidential === 'true';
  if (query.tags) filter.tags = query.tags;

  if (query.query) {
    filter.$or = [
      { title: { $regex: query.query, $options: 'i' } },
      { description: { $regex: query.query, $options: 'i' } },
      { 'file.originalName': { $regex: query.query, $options: 'i' } }
    ];
  }

  if (query.startDate || query.endDate) {
    filter.createdAt = {};
    if (query.startDate) filter.createdAt.$gte = new Date(query.startDate);
    if (query.endDate) filter.createdAt.$lte = new Date(query.endDate);
  }

  filter.$or = [
    { expiresAt: { $exists: false } },
    { expiresAt: null },
    { expiresAt: { $gt: new Date() } }
  ];

  return filter;
};

export const canModifyDocument = (document, userId, userRole) => {
  return userRole === 'admin' || document.uploadedBy.toString() === userId;
};

export const canAccessDocument = (document, userId, userRole) => {
  if (userRole === 'patient' && document.patient.toString() !== userId) return false;
  return document.hasAccess(userId);
};

export const buildStorageData = (s3Key) => ({
  s3Key,
  bucket: process.env.AWS_S3_BUCKET || 'careflow-documents',
  region: process.env.AWS_REGION || 'us-east-1'
});

export const buildFileData = (file, checksum, fileName) => ({
  originalName: file.originalname,
  fileName,
  mimeType: file.mimetype,
  size: file.size,
  checksum
});
