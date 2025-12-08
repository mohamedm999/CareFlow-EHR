import mongoose from 'mongoose';
import mongoosePaginate from 'mongoose-paginate-v2';

const labTestSchema = new mongoose.Schema({
  testCode: {
    type: String,
    required: true,
    trim: true
  },
  testName: {
    type: String,
    required: true,
    trim: true
  },
  category: {
    type: String,
    enum: [
      'hematology',
      'biochemistry',
      'microbiology',
      'immunology',
      'serology',
      'urinalysis',
      'toxicology',
      'genetics',
      'pathology',
      'radiology',
      'other'
    ],
    required: true
  },
  priority: {
    type: String,
    enum: ['routine', 'urgent', 'stat'],
    default: 'routine'
  },
  specimenType: {
    type: String,
    enum: ['blood', 'urine', 'stool', 'saliva', 'tissue', 'swab', 'csf', 'other'],
    required: true
  },
  instructions: {
    type: String,
    trim: true
  },
  fastingRequired: {
    type: Boolean,
    default: false
  },
  notes: {
    type: String,
    trim: true
  }
}, { _id: true });

const labOrderSchema = new mongoose.Schema({
  orderNumber: {
    type: String,
    unique: true
    // Auto-generated in pre-save hook, not required on input
  },
  
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
  
  orderDate: {
    type: Date,
    default: Date.now,
    required: true
  },
  
  tests: {
    type: [labTestSchema],
    validate: {
      validator: function(v) {
        return v && v.length > 0;
      },
      message: 'Au moins un test doit être commandé'
    }
  },
  
  clinicalDiagnosis: {
    type: String,
    trim: true
  },
  
  clinicalInfo: {
    symptoms: { type: String, trim: true },
    medicalHistory: { type: String, trim: true },
    currentMedications: { type: String, trim: true },
    allergies: { type: String, trim: true }
  },
  
  priority: {
    type: String,
    enum: ['routine', 'urgent', 'stat'],
    default: 'routine',
    index: true
  },
  
  status: {
    type: String,
    enum: [
      'ordered',
      'specimen_collected',
      'received',
      'in_progress',
      'completed',
      'validated',
      'reported',
      'cancelled',
      'rejected'
    ],
    default: 'ordered',
    required: true,
    index: true
  },
  
  specimenCollection: {
    collectedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    collectionDate: { type: Date },
    collectionSite: { type: String, trim: true },
    collectionMethod: { type: String, trim: true },
    notes: { type: String, trim: true }
  },
  
  laboratoryInfo: {
    receivedAt: { type: Date },
    receivedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    laboratoryName: { type: String, trim: true },
    laboratoryId: { type: String, trim: true },
    accessionNumber: { type: String, trim: true }
  },
  
  results: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'LabResult'
  },
  
  expectedCompletionDate: {
    type: Date
  },
  
  completedAt: {
    type: Date
  },
  
  validatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  validatedAt: {
    type: Date
  },
  
  reportSentAt: {
    type: Date
  },
  reportSentTo: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  
  cancellationReason: {
    type: String,
    trim: true
  },
  rejectionReason: {
    type: String,
    trim: true
  },
  
  notes: {
    type: String,
    trim: true
  },
  
  hasCriticalResults: {
    type: Boolean,
    default: false
  },
  
  patientNotified: {
    type: Boolean,
    default: false
  },
  doctorNotified: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

labOrderSchema.index({ patient: 1, orderDate: -1 });
labOrderSchema.index({ doctor: 1, orderDate: -1 });
labOrderSchema.index({ status: 1, priority: 1 });

labOrderSchema.pre('save', async function(next) {
  if (this.isNew && !this.orderNumber) {
    const year = new Date().getFullYear();
    const count = await mongoose.model('LabOrder').countDocuments();
    this.orderNumber = `LAB-${year}-${String(count + 1).padStart(6, '0')}`;
  }
  
  if (this.isNew && !this.expectedCompletionDate) {
    const now = new Date();
    if (this.priority === 'stat') {
      this.expectedCompletionDate = new Date(now.getTime() + 2 * 60 * 60 * 1000);
    } else if (this.priority === 'urgent') {
      this.expectedCompletionDate = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    } else {
      this.expectedCompletionDate = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
    }
  }
  
  if (this.isModified('status')) {
    if (this.status === 'completed' && !this.completedAt) {
      this.completedAt = new Date();
    }
    
    if (this.status === 'validated' && !this.validatedAt) {
      this.validatedAt = new Date();
    }
    
    if (this.status === 'reported' && !this.reportSentAt) {
      this.reportSentAt = new Date();
    }
  }
  
  next();
});

labOrderSchema.methods.isOverdue = function() {
  if (this.status === 'completed' || this.status === 'validated' || this.status === 'reported') {
    return false;
  }
  return new Date() > this.expectedCompletionDate;
};

labOrderSchema.methods.getTotalTestsCount = function() {
  return this.tests.length;
};

labOrderSchema.methods.getTestsByCategory = function() {
  const categories = {};
  this.tests.forEach(test => {
    if (!categories[test.category]) {
      categories[test.category] = [];
    }
    categories[test.category].push(test);
  });
  return categories;
};

labOrderSchema.methods.getUrgentTests = function() {
  return this.tests.filter(test => test.priority === 'urgent' || test.priority === 'stat');
};

labOrderSchema.statics.findOverdue = function() {
  return this.find({
    expectedCompletionDate: { $lt: new Date() },
    status: { $nin: ['completed', 'validated', 'reported', 'cancelled', 'rejected'] }
  });
};

labOrderSchema.set('toJSON', { virtuals: true });
labOrderSchema.set('toObject', { virtuals: true });

labOrderSchema.plugin(mongoosePaginate);

const LabOrder = mongoose.model('LabOrder', labOrderSchema);

export default LabOrder;
