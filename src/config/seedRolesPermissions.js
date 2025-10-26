import Role from '../models/role.model.js';
import Permission from '../models/permission.model.js';
import mongoose from 'mongoose';
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
  { name: 'patient', description: 'End user who accesses their own medical information' }
];



// Role permission mapping - which permissions each role has
const rolePermissions = {
  admin: permissions.map(p => p.name), 
  doctor: [
    'create_patient_records', 'view_assigned_patients', 'view_all_patients', 'edit_medical_history', 'view_own_record',
    'view_own_appointments', 'schedule_own_appointments', 'cancel_own_appointments', 'mark_appointment_complete'
  ],
  nurse: [
    'create_patient_records', 'view_assigned_patients', 'edit_medical_history', 'view_own_record',
    'view_own_appointments', 'schedule_own_appointments', 'cancel_own_appointments', 'mark_appointment_complete'
  ],
  secretary: [
    'create_patient_records', 'view_assigned_patients', 'view_own_record',
    'view_all_appointments', 'view_own_appointments', 'schedule_any_doctor',
    'schedule_own_appointments', 'cancel_any_appointment', 'cancel_own_appointments'
  ],
  patient: [
    'view_own_record', 'view_own_appointments', 'schedule_own_appointments', 'cancel_own_appointments'
  ]
};

// Function to seed the database
export async function seedRolesAndPermissions() {
  try {
   
    await Permission.deleteMany({});
    await Role.deleteMany({});
    
    
    const createdPermissions = await Permission.insertMany(permissions);
 
    const permissionMap = {};
    createdPermissions.forEach(permission => {
      permissionMap[permission.name] = permission._id;
    });

    for (const role of roles) {
      const rolePermissionIds = rolePermissions[role.name].map(permName => permissionMap[permName]);
      
      await Role.create({
        name: role.name,
        description: role.description,
        permissions: rolePermissionIds
      });
    }
    
    logger.info('Roles and permissions seeded successfully');
  } catch (error) {
    logger.error('Error seeding roles and permissions:', error);
    throw error;
  }
}