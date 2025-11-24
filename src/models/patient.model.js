import mongoose from 'mongoose';

const patientSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  dateOfBirth: Date,
  gender: {
    type: String,
    enum: ['male', 'female', 'other', 'prefer_not_to_say']
  },
  bloodType: {
    type: String,
    enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'unknown']
  },
  allergies: [{
    allergen: String,
    reaction: String,
    severity: {
      type: String,
      enum: ['mild', 'moderate', 'severe', 'life-threatening']
    },
    notes: String
  }],
  medicalHistory: [{
    condition: String,
    diagnosedDate: Date,
    status: {
      type: String,
      enum: ['active', 'resolved', 'chronic', 'in_remission', 'recurring']
    },
    notes: String
  }],
  medications: [{
    name: String,
    dosage: String,
    frequency: String,
    startDate: Date,
    endDate: Date,
    prescribedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }],
  emergencyContact: {
    name: String,
    relationship: String,
    phone: String
  },
  insurance: {
    provider: String,
    policyNumber: String,
    groupNumber: String,
    expiryDate: Date
  },
  surgicalHistory: [{
    procedure: String,
    date: Date,
    surgeon: String,
    notes: String
  }],
  consents: {
    dataSharing: { type: Boolean, default: false },
    treatmentConsent: { type: Boolean, default: false },
    receiveEmailNotifications: { type: Boolean, default: true },
    consentDate: Date
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  lastUpdatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, { timestamps: true });

patientSchema.index({ user: 1 }, { unique: true });
patientSchema.index({ bloodType: 1 });
patientSchema.index({ 'allergies.allergen': 1, 'allergies.severity': 1 });
patientSchema.index({ 'medicalHistory.condition': 1, 'medicalHistory.status': 1 });
patientSchema.index({ createdAt: -1 });

export default mongoose.model('Patient', patientSchema);
