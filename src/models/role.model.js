import mongoose from 'mongoose';

const roleSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    enum: ['admin', 'doctor', 'nurse', 'secretary', 'patient', 'pharmacist', 'lab_technician'],
    lowercase: true
  },
  description: {
    type: String,
    required: true
  },
  permissions: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Permission'
  }]
}, { timestamps: true });

const Role = mongoose.model('Role', roleSchema);

export default Role;
