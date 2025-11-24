import Prescription from '../models/prescription.model.js';
import Patient from '../models/patient.model.js';
import Pharmacy from '../models/pharmacy.model.js';
import Consultation from '../models/consultation.model.js';
import { POPULATE_FIELDS, POPULATE_BASIC, POPULATE_LIST, buildPrescriptionFilter, applyRoleFilter, canAccessPrescription, canModifyPrescription, canCancelPrescription, sanitizeUpdateData, buildStatsAggregation } from '../helpers/prescription.helper.js';

export const createPrescription = async (prescriptionData, userId) => {
  const validations = [Patient.findById(prescriptionData.patient)];
  if (prescriptionData.pharmacy) validations.push(Pharmacy.findById(prescriptionData.pharmacy));
  if (prescriptionData.consultation) validations.push(Consultation.findById(prescriptionData.consultation));

  const [patient, pharmacy, consultation] = await Promise.all(validations);
  if (!patient) throw { status: 404, message: 'Patient non trouvé' };
  if (prescriptionData.pharmacy && !pharmacy) throw { status: 404, message: 'Pharmacie non trouvée' };
  if (prescriptionData.consultation && !consultation) throw { status: 404, message: 'Consultation non trouvée' };

  const prescription = await Prescription.create({
    ...prescriptionData,
    doctor: prescriptionData.doctor || userId
  });

  await prescription.populate(POPULATE_BASIC);
  return prescription;
};

export const getPrescriptions = async (query, userId, userRole) => {
  let filter = buildPrescriptionFilter(query, userId, userRole);
  filter = await applyRoleFilter(filter, userId, userRole, Patient, Pharmacy);

  const options = {
    page: parseInt(query.page || 1),
    limit: parseInt(query.limit || 10),
    sort: { [query.sortBy || 'prescriptionDate']: query.sortOrder === 'asc' ? 1 : -1 },
    populate: POPULATE_LIST
  };

  return await Prescription.paginate(filter, options);
};

export const getPrescriptionById = async (id, userId, userRole) => {
  const prescription = await Prescription.findById(id).populate(POPULATE_FIELDS);
  if (!prescription) throw { status: 404, message: 'Prescription non trouvée' };

  const hasAccess = await canAccessPrescription(prescription, userId, userRole, Patient, Pharmacy);
  if (!hasAccess) throw { status: 403, message: 'Accès non autorisé à cette prescription' };

  return prescription;
};

export const updatePrescription = async (id, updateData, userId, userRole) => {
  const prescription = await Prescription.findById(id);
  if (!prescription) throw { status: 404, message: 'Prescription non trouvée' };
  if (!canModifyPrescription(prescription, userId, userRole)) throw { status: 403, message: 'Vous n\'êtes pas autorisé à modifier cette prescription' };

  const sanitizedData = sanitizeUpdateData({ ...updateData });
  Object.assign(prescription, sanitizedData);
  await prescription.save();
  await prescription.populate(POPULATE_BASIC);
  return prescription;
};

export const signPrescription = async (id, digitalSignature, userId, userRole) => {
  const prescription = await Prescription.findById(id);
  if (!prescription) throw { status: 404, message: 'Prescription non trouvée' };
  if (userRole !== 'admin' && prescription.doctor.toString() !== userId) throw { status: 403, message: 'Vous n\'êtes pas autorisé à signer cette prescription' };
  if (prescription.status !== 'draft') throw { status: 400, message: 'Seules les prescriptions en brouillon peuvent être signées' };

  prescription.status = 'signed';
  prescription.signedBy = userId;
  prescription.signedAt = new Date();
  if (digitalSignature) prescription.digitalSignature = digitalSignature;
  await prescription.save();
  return prescription;
};

export const sendToPharmacy = async (id, pharmacyId) => {
  const [prescription, pharmacy] = await Promise.all([
    Prescription.findById(id),
    Pharmacy.findById(pharmacyId)
  ]);

  if (!prescription) throw { status: 404, message: 'Prescription non trouvée' };
  if (!pharmacy) throw { status: 404, message: 'Pharmacie non trouvée' };
  if (prescription.status !== 'signed') throw { status: 400, message: 'La prescription doit être signée avant d\'être envoyée' };

  prescription.status = 'sent';
  prescription.pharmacy = pharmacyId;
  prescription.sentToPharmacyAt = new Date();
  prescription.pharmacyNotified = true;
  await prescription.save();
  return prescription;
};

export const dispenseMedication = async (id, dispensationData, userId) => {
  const prescription = await Prescription.findById(id);
  if (!prescription) throw { status: 404, message: 'Prescription non trouvée' };
  if (!['sent', 'partially_dispensed'].includes(prescription.status)) throw { status: 400, message: 'La prescription doit être envoyée à la pharmacie avant dispensation' };

  const medication = prescription.medications.id(dispensationData.medicationId);
  if (!medication) throw { status: 404, message: 'Médicament non trouvé dans cette prescription' };

  prescription.dispensedMedications.push({
    medicationId: dispensationData.medicationId,
    dispensedQuantity: dispensationData.dispensedQuantity,
    dispensedDate: new Date(),
    batchNumber: dispensationData.batchNumber,
    expiryDate: dispensationData.expiryDate,
    notes: dispensationData.notes
  });

  prescription.dispensedBy = userId;

  if (prescription.isFullyDispensed()) {
    prescription.status = 'dispensed';
    prescription.dispensedAt = new Date();
  } else {
    prescription.status = 'partially_dispensed';
  }

  await prescription.save();
  return prescription;
};

export const cancelPrescription = async (id, cancellationReason, userId, userRole) => {
  const prescription = await Prescription.findById(id);
  if (!prescription) throw { status: 404, message: 'Prescription non trouvée' };
  if (!canCancelPrescription(prescription, userId, userRole)) throw { status: 403, message: 'Vous n\'êtes pas autorisé à annuler cette prescription' };

  prescription.status = 'cancelled';
  prescription.cancellationReason = cancellationReason;
  prescription.cancelledBy = userId;
  prescription.cancelledAt = new Date();
  await prescription.save();
  return prescription;
};

export const renewPrescription = async (id, renewalData, userId, userRole) => {
  const originalPrescription = await Prescription.findById(id);
  if (!originalPrescription) throw { status: 404, message: 'Prescription originale non trouvée' };
  if (userRole !== 'admin' && originalPrescription.doctor.toString() !== userId) throw { status: 403, message: 'Vous n\'êtes pas autorisé à renouveler cette prescription' };

  const renewedPrescription = await Prescription.create({
    patient: originalPrescription.patient,
    doctor: userId,
    medications: renewalData.medications || originalPrescription.medications,
    pharmacy: originalPrescription.pharmacy,
    diagnosis: originalPrescription.diagnosis,
    notes: renewalData.notes || `Renouvellement de ${originalPrescription.prescriptionNumber}. ${originalPrescription.notes || ''}`,
    priority: originalPrescription.priority,
    isRenewal: true,
    originalPrescription: originalPrescription._id,
    renewalCount: originalPrescription.renewalCount + 1
  });

  return renewedPrescription;
};

export const getPrescriptionsByPatient = async (patientId, query, userId, userRole) => {
  const patient = await Patient.findById(patientId);
  if (!patient) throw { status: 404, message: 'Patient non trouvé' };

  if (userRole === 'patient') {
    const patientRecord = await Patient.findOne({ user: userId });
    if (!patientRecord || patientRecord._id.toString() !== patientId) throw { status: 403, message: 'Accès non autorisé' };
  }

  const filter = { patient: patientId };
  if (query.status) filter.status = query.status;

  const options = {
    page: parseInt(query.page || 1),
    limit: parseInt(query.limit || 10),
    sort: { prescriptionDate: -1 },
    populate: POPULATE_LIST
  };

  return await Prescription.paginate(filter, options);
};

export const getPrescriptionsByPharmacy = async (pharmacyId, query, userId, userRole) => {
  const pharmacy = await Pharmacy.findById(pharmacyId);
  if (!pharmacy) throw { status: 404, message: 'Pharmacie non trouvée' };

  if (userRole === 'pharmacist') {
    const userPharmacy = await Pharmacy.findOne({ assignedUsers: userId });
    if (!userPharmacy || userPharmacy._id.toString() !== pharmacyId) throw { status: 403, message: 'Accès non autorisé' };
  }

  const filter = { pharmacy: pharmacyId };
  if (query.status) filter.status = query.status;

  const options = {
    page: parseInt(query.page || 1),
    limit: parseInt(query.limit || 10),
    sort: { prescriptionDate: -1 },
    populate: [
      { path: 'patient', select: 'firstName lastName dateOfBirth' },
      { path: 'doctor', select: 'firstName lastName email' }
    ]
  };

  return await Prescription.paginate(filter, options);
};

export const getPrescriptionStats = async (query, userId, userRole) => {
  const filter = {};

  if (query.doctorId) {
    filter.doctor = query.doctorId;
  } else if (userRole === 'doctor') {
    filter.doctor = userId;
  }

  if (query.startDate || query.endDate) {
    filter.prescriptionDate = {};
    if (query.startDate) filter.prescriptionDate.$gte = new Date(query.startDate);
    if (query.endDate) filter.prescriptionDate.$lte = new Date(query.endDate);
  }

  const stats = await Prescription.aggregate(buildStatsAggregation(filter));
  return stats[0];
};
