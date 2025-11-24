import mongoose from 'mongoose';
import mongoosePaginate from 'mongoose-paginate-v2';

const medicationSchema = new mongoose.Schema({
  medicationName: {
    type: String,
    required: true,
    trim: true
  },
  genericName: {
    type: String,
    trim: true
  },
  dosage: {
    type: String,
    required: true,
    trim: true
  },
  strength: {
    value: { type: Number },
    unit: { 
      type: String, 
      enum: ['mg', 'g', 'mcg', 'ml', 'L', 'IU', '%']
    }
  },
  form: {
    type: String,
    enum: ['tablet', 'capsule', 'liquid', 'injection', 'cream', 'ointment', 'inhaler', 'drops', 'patch', 'suppository', 'other'],
    required: true
  },
  route: {
    type: String,
    enum: ['oral', 'sublingual', 'topical', 'intravenous', 'intramuscular', 'subcutaneous', 'inhalation', 'rectal', 'ophthalmic', 'otic', 'nasal'],
    required: true
  },
  frequency: {
    type: String,
    required: true,
    trim: true
  },
  duration: {
    value: { type: Number, required: true },
    unit: { 
      type: String, 
      enum: ['days', 'weeks', 'months', 'as_needed'],
      required: true
    }
  },
  quantity: {
    type: Number,
    required: true
  },
  refills: {
    type: Number,
    default: 0,
    min: 0,
    max: 11
  },
  instructions: {
    type: String,
    trim: true
  },
  indication: {
    type: String,
    trim: true
  },
  warnings: {
    type: String,
    trim: true
  }
}, { _id: true });

const prescriptionSchema = new mongoose.Schema({
  patient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    required: true,
    index: true
  },
  doctor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  consultation: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Consultation'
  },
  
  prescriptionNumber: {
    type: String,
    unique: true,
    required: true
  },
  
  prescriptionDate: {
    type: Date,
    default: Date.now,
    required: true
  },
  
  medications: {
    type: [medicationSchema],
    validate: {
      validator: function(v) {
        return v && v.length > 0;
      },
      message: 'Au moins un médicament doit être prescrit'
    }
  },
  
  pharmacy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Pharmacy'
  },
  
  diagnosis: {
    type: String,
    trim: true
  },
  
  notes: {
    type: String,
    trim: true
  },
  
  status: {
    type: String,
    enum: ['draft', 'signed', 'sent', 'dispensed', 'partially_dispensed', 'cancelled', 'expired'],
    default: 'draft',
    required: true,
    index: true
  },
  
  signedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  signedAt: {
    type: Date
  },
  digitalSignature: {
    type: String
  },
  
  sentToPharmacyAt: {
    type: Date
  },
  
  dispensedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  dispensedAt: {
    type: Date
  },
  dispensedMedications: [{
    medicationId: { type: mongoose.Schema.Types.ObjectId },
    dispensedQuantity: { type: Number },
    dispensedDate: { type: Date },
    batchNumber: { type: String },
    expiryDate: { type: Date },
    notes: { type: String }
  }],
  
  expiryDate: {
    type: Date
  },
  
  isRenewal: {
    type: Boolean,
    default: false
  },
  originalPrescription: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Prescription'
  },
  renewalCount: {
    type: Number,
    default: 0
  },
  
  cancellationReason: {
    type: String,
    trim: true
  },
  cancelledBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  cancelledAt: {
    type: Date
  },
  
  priority: {
    type: String,
    enum: ['routine', 'urgent', 'stat'],
    default: 'routine'
  },
  
  patientNotified: {
    type: Boolean,
    default: false
  },
  pharmacyNotified: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

prescriptionSchema.index({ patient: 1, prescriptionDate: -1 });
prescriptionSchema.index({ doctor: 1, prescriptionDate: -1 });
prescriptionSchema.index({ pharmacy: 1, status: 1 });

prescriptionSchema.pre('save', async function(next) {
  if (this.isNew && !this.prescriptionNumber) {
    const year = new Date().getFullYear();
    const count = await mongoose.model('Prescription').countDocuments();
    this.prescriptionNumber = `RX-${year}-${String(count + 1).padStart(6, '0')}`;
  }
  
  if (this.isNew && !this.expiryDate) {
    const expiryDate = new Date(this.prescriptionDate);
    expiryDate.setFullYear(expiryDate.getFullYear() + 1);
    this.expiryDate = expiryDate;
  }
  
  if (this.isModified('status')) {
    if (this.status === 'signed' && !this.signedAt) {
      this.signedAt = new Date();
      this.signedBy = this.signedBy || this.doctor;
    }
    
    if (this.status === 'sent' && !this.sentToPharmacyAt) {
      this.sentToPharmacyAt = new Date();
    }
    
    if (this.status === 'dispensed' && !this.dispensedAt) {
      this.dispensedAt = new Date();
    }
    
    if (new Date() > this.expiryDate && this.status !== 'expired' && this.status !== 'cancelled') {
      this.status = 'expired';
    }
  }
  
  next();
});

prescriptionSchema.methods.isValid = function() {
  const now = new Date();
  return (
    this.status !== 'cancelled' &&
    this.status !== 'expired' &&
    this.expiryDate > now
  );
};

prescriptionSchema.methods.getTotalMedicationsCount = function() {
  return this.medications.length;
};

prescriptionSchema.methods.getDispensedMedicationsCount = function() {
  return this.dispensedMedications.length;
};

prescriptionSchema.methods.isFullyDispensed = function() {
  return this.getDispensedMedicationsCount() === this.getTotalMedicationsCount();
};

prescriptionSchema.statics.findExpired = function() {
  return this.find({
    expiryDate: { $lt: new Date() },
    status: { $nin: ['expired', 'cancelled', 'dispensed'] }
  });
};

prescriptionSchema.set('toJSON', { virtuals: true });
prescriptionSchema.set('toObject', { virtuals: true });

prescriptionSchema.plugin(mongoosePaginate);

const Prescription = mongoose.model('Prescription', prescriptionSchema);

export default Prescription;
