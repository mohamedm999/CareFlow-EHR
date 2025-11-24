import Patient from '../models/patient.model.js';

export const POPULATE_FIELDS = [
  { path: 'patient', select: 'firstName lastName dateOfBirth gender' },
  { path: 'doctor', select: 'firstName lastName email' },
  { path: 'appointment', select: 'appointmentDate reason status' }
];

export const canAccessConsultation = async (consultation, user) => {
  const { role } = user;
  if (role.name === 'admin') return true;
  if (role.name === 'doctor' || role.name === 'nurse') {
    return consultation.doctor.toString() === user._id.toString();
  }
  if (role.name === 'patient') {
    const patientRecord = await Patient.findOne({ user: user._id });
    return patientRecord && consultation.patient.toString() === patientRecord._id.toString();
  }
  return false;
};
