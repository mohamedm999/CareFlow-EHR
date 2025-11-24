import Role from '../models/role.model.js';
import Permission from '../models/permission.model.js';
import { logger } from './logger.js';

const permissions = [
  // User Management
  { name: 'create_users', description: 'Create user accounts', category: 'user_management' },
  { name: 'view_all_users', description: 'View all users', category: 'user_management' },
  { name: 'modify_user_roles', description: 'Modify user roles', category: 'user_management' },
  { name: 'suspend_activate_accounts', description: 'Suspend/activate accounts', category: 'user_management' },
  
  // Patient Records
  { name: 'create_patient_records', description: 'Create patient records', category: 'patient_records' },
  { name: 'view_all_patients', description: 'View all patient records', category: 'patient_records' },
  { name: 'view_assigned_patients', description: 'View assigned patients', category: 'patient_records' },
  { name: 'edit_medical_history', description: 'Edit medical history', category: 'patient_records' },
  { name: 'view_own_record', description: 'View own patient record', category: 'patient_records' },
  
  // Appointments
  { name: 'view_all_appointments', description: 'View all appointments', category: 'appointments' },
  { name: 'view_own_appointments', description: 'View own appointments', category: 'appointments' },
  { name: 'schedule_any_doctor', description: 'Schedule for any doctor', category: 'appointments' },
  { name: 'schedule_own_appointments', description: 'Schedule own appointments', category: 'appointments' },
  { name: 'cancel_any_appointment', description: 'Cancel any appointment', category: 'appointments' },
  { name: 'cancel_own_appointments', description: 'Cancel own appointments', category: 'appointments' },
  { name: 'mark_appointment_complete', description: 'Mark appointment complete', category: 'appointments' },
  
  // Consultations
  { name: 'create_consultations', description: 'Create consultations', category: 'consultations' },
  { name: 'view_all_consultations', description: 'View all consultations', category: 'consultations' },
  { name: 'view_own_consultations', description: 'View own consultations', category: 'consultations' },
  { name: 'edit_consultations', description: 'Edit consultations', category: 'consultations' },
  { name: 'delete_consultations', description: 'Delete consultations', category: 'consultations' },
  
  // Prescriptions
  { name: 'create_prescriptions', description: 'Create prescriptions', category: 'prescriptions' },
  { name: 'view_all_prescriptions', description: 'View all prescriptions', category: 'prescriptions' },
  { name: 'view_own_prescriptions', description: 'View own prescriptions', category: 'prescriptions' },
  { name: 'sign_prescriptions', description: 'Sign prescriptions', category: 'prescriptions' },
  { name: 'send_prescriptions', description: 'Send prescriptions to pharmacy', category: 'prescriptions' },
  { name: 'dispense_prescriptions', description: 'Mark prescriptions as dispensed', category: 'prescriptions' },
  
  // Pharmacy
  { name: 'manage_pharmacies', description: 'Create/edit/delete pharmacies', category: 'pharmacy' },
  { name: 'view_pharmacies', description: 'View pharmacies', category: 'pharmacy' },
  { name: 'view_assigned_prescriptions', description: 'View prescriptions assigned to pharmacy', category: 'pharmacy' },
  { name: 'update_prescription_status', description: 'Update prescription status', category: 'pharmacy' },
  
  // Laboratory
  { name: 'create_lab_orders', description: 'Create laboratory orders', category: 'laboratory' },
  { name: 'view_lab_orders', description: 'View laboratory orders', category: 'laboratory' },
  { name: 'view_all_lab_orders', description: 'View all lab orders', category: 'laboratory' },
  { name: 'view_own_lab_orders', description: 'View own lab orders', category: 'laboratory' },
  { name: 'edit_lab_orders', description: 'Edit laboratory orders', category: 'laboratory' },
  { name: 'cancel_lab_orders', description: 'Cancel laboratory orders', category: 'laboratory' },
  { name: 'collect_specimens', description: 'Collect specimens', category: 'laboratory' },
  { name: 'receive_specimens', description: 'Receive specimens at lab', category: 'laboratory' },
  { name: 'update_lab_order_status', description: 'Update lab order status', category: 'laboratory' },
  { name: 'create_lab_results', description: 'Create lab results', category: 'laboratory' },
  { name: 'view_lab_results', description: 'View lab results', category: 'laboratory' },
  { name: 'edit_lab_results', description: 'Edit lab results', category: 'laboratory' },
  { name: 'upload_lab_results', description: 'Upload lab results', category: 'laboratory' },
  { name: 'validate_lab_results', description: 'Validate lab results', category: 'laboratory' },
  { name: 'upload_lab_reports', description: 'Upload lab PDF reports', category: 'laboratory' },
  { name: 'download_lab_reports', description: 'Download lab reports', category: 'laboratory' },
  
  // Documents
  { name: 'upload_documents', description: 'Upload medical documents', category: 'documents' },
  { name: 'view_all_documents', description: 'View all documents', category: 'documents' },
  { name: 'view_own_documents', description: 'View own documents', category: 'documents' },
  { name: 'edit_documents', description: 'Edit documents metadata', category: 'documents' },
  { name: 'delete_documents', description: 'Delete documents', category: 'documents' },
  { name: 'download_documents', description: 'Download documents', category: 'documents' },
  { name: 'share_documents', description: 'Share documents with other users', category: 'documents' },
  
  // System Management
  { name: 'access_system_settings', description: 'Access system settings', category: 'system_management' },
  { name: 'view_system_logs', description: 'View system logs', category: 'system_management' },
  { name: 'configure_notifications', description: 'Configure notifications', category: 'system_management' },
  { name: 'export_import_data', description: 'Export/import data', category: 'system_management' }
];

// Define roles with descriptions
const roles = [
  { name: 'admin', description: 'System administrator with full access to all features' },
  { name: 'doctor', description: 'Medical practitioner who manages patients and appointments' },
  { name: 'nurse', description: 'Clinical staff with limited patient management capabilities' },
  { name: 'secretary', description: 'Front desk staff managing scheduling and patient intake' },
  { name: 'patient', description: 'End user who accesses their own medical information' },
  { name: 'pharmacist', description: 'Pharmacy staff who manages prescriptions dispensation' },
  { name: 'lab_technician', description: 'Laboratory staff who manages lab orders and results' }
];

// Role permission mapping - which permissions each role has
const rolePermissions = {
  admin: permissions.map(p => p.name), 
  doctor: [
    // Patient Records
    'create_patient_records', 'view_assigned_patients', 'view_all_patients', 'edit_medical_history', 'view_own_record',
    // Appointments
    'view_own_appointments', 'schedule_own_appointments', 'cancel_own_appointments', 'mark_appointment_complete',
    // Consultations
    'create_consultations', 'view_all_consultations', 'edit_consultations',
    // Prescriptions
    'create_prescriptions', 'view_all_prescriptions', 'sign_prescriptions', 'send_prescriptions',
    // Laboratory
    'create_lab_orders', 'view_lab_orders', 'view_all_lab_orders', 'edit_lab_orders', 'cancel_lab_orders',
    'collect_specimens', 'update_lab_order_status', 'view_lab_results', 'validate_lab_results', 'download_lab_reports',
    // Documents
    'upload_documents', 'view_all_documents', 'edit_documents', 'delete_documents', 'download_documents', 'share_documents'
  ],
  nurse: [
    // Patient Records
    'create_patient_records', 'view_assigned_patients', 'edit_medical_history', 'view_own_record',
    // Appointments
    'view_own_appointments', 'schedule_own_appointments', 'cancel_own_appointments', 'mark_appointment_complete',
    // Consultations
    'create_consultations', 'view_all_consultations', 'edit_consultations',
    // Prescriptions
    'view_all_prescriptions',
    // Laboratory
    'view_lab_orders', 'view_all_lab_orders', 'collect_specimens', 'download_lab_reports',
    // Documents
    'upload_documents', 'view_all_documents', 'edit_documents', 'download_documents', 'share_documents'
  ],
  secretary: [
    // Patient Records
    'create_patient_records', 'view_assigned_patients', 'view_own_record',
    // Appointments
    'view_all_appointments', 'view_own_appointments', 'schedule_any_doctor',
    'schedule_own_appointments', 'cancel_any_appointment', 'cancel_own_appointments',
    // Consultations
    'view_all_consultations',
    // Documents
    'upload_documents', 'view_all_documents', 'edit_documents', 'download_documents'
  ],
  patient: [
    // Patient Records
    'view_own_record',
    // Appointments
    'view_own_appointments', 'schedule_own_appointments', 'cancel_own_appointments',
    // Consultations
    'view_own_consultations',
    // Prescriptions
    'view_own_prescriptions',
    // Laboratory
    'view_own_lab_orders', 'download_lab_reports',
    // Documents
    'upload_documents', 'view_own_documents', 'download_documents'
  ],
  pharmacist: [
    // Pharmacy
    'view_pharmacies', 'view_assigned_prescriptions', 'update_prescription_status', 'dispense_prescriptions',
    // Prescriptions
    'view_all_prescriptions'
  ],
  lab_technician: [
    // Laboratory
    'view_lab_orders', 'view_all_lab_orders', 'receive_specimens', 'update_lab_order_status',
    'create_lab_results', 'view_lab_results', 'edit_lab_results', 'validate_lab_results',
    'upload_lab_results', 'upload_lab_reports', 'download_lab_reports',
    // Documents
    'upload_documents', 'view_all_documents', 'edit_documents', 'download_documents'
  ]
};

export async function seedRolesAndPermissions() {
  try {
    const existingPermissions = await Permission.countDocuments();
    if (existingPermissions > 0) {
      logger.info('Roles and permissions already seeded, skipping...');
      return;
    }

    const createdPermissions = await Permission.insertMany(permissions);
    if (!createdPermissions || createdPermissions.length === 0) {
      throw new Error('Failed to create permissions');
    }

    const permissionMap = {};
    createdPermissions.forEach(permission => {
      permissionMap[permission.name] = permission._id;
    });

    const rolePromises = roles.map(role => {
      const rolePermissionIds = rolePermissions[role.name]
        .map(permName => permissionMap[permName])
        .filter(id => id !== undefined);

      if (rolePermissionIds.length === 0) {
        throw new Error(`No valid permissions found for role: ${role.name}`);
      }

      return Role.create({
        name: role.name,
        description: role.description,
        permissions: rolePermissionIds
      });
    });

    await Promise.all(rolePromises);
    logger.info(`Seeded ${createdPermissions.length} permissions and ${roles.length} roles successfully`);
  } catch (error) {
    logger.error('Error seeding roles and permissions:', error);
    throw error;
  }
}
