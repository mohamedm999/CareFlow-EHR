export const POPULATE_FIELDS = [
  { path: 'patient', select: 'firstName lastName dateOfBirth gender allergies' },
  { path: 'doctor', select: 'firstName lastName email' },
  { path: 'pharmacy', select: 'name address contacts openingHours' },
  { path: 'consultation', select: 'consultationDate chiefComplaint diagnoses' },
  { path: 'signedBy', select: 'firstName lastName email' },
  { path: 'dispensedBy', select: 'firstName lastName email' }
];

export const POPULATE_BASIC = [
  { path: 'patient', select: 'firstName lastName dateOfBirth' },
  { path: 'doctor', select: 'firstName lastName email' },
  { path: 'pharmacy', select: 'name address contacts' },
  { path: 'consultation', select: 'consultationDate chiefComplaint' }
];

export const POPULATE_LIST = [
  { path: 'patient', select: 'firstName lastName dateOfBirth' },
  { path: 'doctor', select: 'firstName lastName email' },
  { path: 'pharmacy', select: 'name address contacts' }
];

export const IMMUTABLE_STATUSES = ['signed', 'sent', 'dispensed', 'partially_dispensed', 'cancelled'];
export const CANCELLABLE_STATUSES = ['dispensed', 'cancelled'];
export const PROTECTED_FIELDS = ['patient', 'doctor', 'prescriptionNumber'];

export const buildPrescriptionFilter = (query, userId, userRole) => {
  const filter = {};

  if (query.patient) filter.patient = query.patient;
  if (query.doctor) filter.doctor = query.doctor;
  if (query.pharmacy) filter.pharmacy = query.pharmacy;
  if (query.status) filter.status = query.status;
  if (query.priority) filter.priority = query.priority;
  if (query.prescriptionNumber) filter.prescriptionNumber = new RegExp(query.prescriptionNumber, 'i');

  if (query.startDate || query.endDate) {
    filter.prescriptionDate = {};
    if (query.startDate) filter.prescriptionDate.$gte = new Date(query.startDate);
    if (query.endDate) filter.prescriptionDate.$lte = new Date(query.endDate);
  }

  return filter;
};

export const applyRoleFilter = async (filter, userId, userRole, Patient, Pharmacy) => {
  if (userRole === 'patient') {
    const patientRecord = await Patient.findOne({ user: userId });
    if (patientRecord) filter.patient = patientRecord._id;
  } else if (userRole === 'doctor') {
    filter.doctor = userId;
  } else if (userRole === 'pharmacist') {
    const userPharmacy = await Pharmacy.findOne({ assignedUsers: userId });
    if (userPharmacy) filter.pharmacy = userPharmacy._id;
  }
  return filter;
};

// Helper to get ID from either ObjectId or populated object
const getDocId = (doc) => {
  if (!doc) return null;
  return doc._id ? doc._id.toString() : doc.toString();
};

export const canAccessPrescription = async (prescription, userId, userRole, Patient, Pharmacy, userPermissions = []) => {
  // Admin always has access
  if (userRole === 'admin') return true;
  
  // Check if user has view_all_prescriptions permission
  const hasViewAll = userPermissions.some(p => 
    (typeof p === 'string' ? p : p.name) === 'view_all_prescriptions'
  );
  if (hasViewAll) return true;
  
  const userIdStr = userId.toString();
  
  if (userRole === 'patient') {
    const patientRecord = await Patient.findOne({ user: userId });
    const prescriptionPatientId = getDocId(prescription.patient);
    return patientRecord && prescriptionPatientId === patientRecord._id.toString();
  }
  
  if (userRole === 'doctor' || userRole === 'nurse') {
    const prescriptionDoctorId = getDocId(prescription.doctor);
    return prescriptionDoctorId === userIdStr;
  }
  
  if (userRole === 'pharmacist') {
    const userPharmacy = await Pharmacy.findOne({ assignedUsers: userId });
    const prescriptionPharmacyId = getDocId(prescription.pharmacy);
    return userPharmacy && prescriptionPharmacyId && prescriptionPharmacyId === userPharmacy._id.toString();
  }
  
  return false;
};

export const canModifyPrescription = (prescription, userId, userRole) => {
  if (userRole === 'admin') return true;
  const prescriptionDoctorId = getDocId(prescription.doctor);
  if (prescriptionDoctorId !== userId.toString()) return false;
  return !IMMUTABLE_STATUSES.includes(prescription.status);
};

export const canCancelPrescription = (prescription, userId, userRole) => {
  if (userRole === 'admin') return true;
  const prescriptionDoctorId = getDocId(prescription.doctor);
  if (prescriptionDoctorId !== userId.toString()) return false;
  return !CANCELLABLE_STATUSES.includes(prescription.status);
};

export const sanitizeUpdateData = (updateData) => {
  PROTECTED_FIELDS.forEach(field => delete updateData[field]);
  return updateData;
};

export const buildStatsAggregation = (filter) => [
  { $match: filter },
  {
    $facet: {
      byStatus: [{ $group: { _id: '$status', count: { $sum: 1 } } }],
      byPriority: [{ $group: { _id: '$priority', count: { $sum: 1 } } }],
      total: [{ $count: 'total' }],
      totalMedications: [{ $unwind: '$medications' }, { $count: 'total' }]
    }
  }
];
