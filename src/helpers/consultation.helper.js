import Patient from '../models/patient.model.js';
import Permission from '../models/permission.model.js';

export const POPULATE_FIELDS = [
  { 
    path: 'patient', 
    select: 'user dateOfBirth gender bloodType',
    populate: { path: 'user', select: 'firstName lastName email' }
  },
  { path: 'doctor', select: 'firstName lastName email' },
  { path: 'appointment', select: 'dateTime reason status' }
];

// Helper to check if user has a specific permission
const hasPermission = async (user, permissionName) => {
  if (!user.role?.permissions) return false;
  const permissions = await Permission.find({ _id: { $in: user.role.permissions } }).select('name');
  return permissions.some(p => p.name === permissionName);
};

export const canAccessConsultation = async (consultation, user) => {
  const { role } = user;
  
  // Admin has full access
  if (role.name === 'admin') return true;
  
  // Check if user has view_all_consultations permission
  if (await hasPermission(user, 'view_all_consultations')) {
    return true;
  }
  
  // Get doctor ID (handle both populated and unpopulated cases)
  const doctorId = consultation.doctor?._id?.toString() || consultation.doctor?.toString();
  const userId = user._id.toString();
  
  // Doctors and nurses can access their own consultations
  if (role.name === 'doctor' || role.name === 'nurse') {
    return doctorId === userId;
  }
  
  // Patients can only access their own consultations (via view_own_consultations)
  if (role.name === 'patient') {
    const patientRecord = await Patient.findOne({ user: user._id });
    if (!patientRecord) return false;
    const consultationPatientId = consultation.patient?._id?.toString() || consultation.patient?.toString();
    return consultationPatientId === patientRecord._id.toString();
  }
  
  return false;
};
