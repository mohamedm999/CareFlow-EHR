import mongoose from 'mongoose';

const permissionSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  description: {
    type: String,
    required: true
  },
  category: {
    type: String,
    required: true,
    enum: [
      'user_management',
      'patient_records',
      'appointments',
      'consultations',
      'prescriptions',
      'pharmacy',
      'laboratory',
      'documents',
      'system_management'
    ]
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

const Permission = mongoose.model('Permission', permissionSchema);

export default Permission;
