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

export const canAccessPrescription = async (prescription, userId, userRole, Patient, Pharmacy) => {
  if (userRole === 'admin') return true;
  
  if (userRole === 'patient') {
    const patientRecord = await Patient.findOne({ user: userId });
    return patientRecord && prescription.patient._id.toString() === patientRecord._id.toString();
  }
  
  if (userRole === 'doctor') {
    return prescription.doctor._id.toString() === userId;
  }
  
  if (userRole === 'pharmacist') {
    const userPharmacy = await Pharmacy.findOne({ assignedUsers: userId });
    return userPharmacy && prescription.pharmacy && prescription.pharmacy._id.toString() === userPharmacy._id.toString();
  }
  
  return false;
};

export const canModifyPrescription = (prescription, userId, userRole) => {
  if (userRole === 'admin') return true;
  if (prescription.doctor.toString() !== userId) return false;
  return !IMMUTABLE_STATUSES.includes(prescription.status);
};

export const canCancelPrescription = (prescription, userId, userRole) => {
  if (userRole === 'admin') return true;
  if (prescription.doctor.toString() !== userId) return false;
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
