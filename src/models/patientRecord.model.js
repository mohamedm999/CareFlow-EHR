import mongoose from 'mongoose';

const patientRecordSchema = new mongoose.Schema({
  patient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
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

  emergencyContact: {
    name: String,
    relationship: String,
    phone: String
  },

  insurance: {
    provider: String,
    policyNumber: String,
    groupNumber: String,
    validUntil: Date
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
  medicalConditions: [{
    condition: String,
    diagnosedDate: Date,
    status: {
      type: String,
      enum: ['active', 'resolved', 'in_remission', 'recurring']
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
  surgicalHistory: [{
    procedure: String,
    date: Date,
    surgeon: String,
    notes: String
  }],
  
  consents: {
    shareDataForResearch: {
      type: Boolean,
      default: false
    },
    receiveEmailNotifications: {
      type: Boolean,
      default: true
    }
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

const PatientRecord = mongoose.model('PatientRecord', patientRecordSchema);
export default PatientRecord;