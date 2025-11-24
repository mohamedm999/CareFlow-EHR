import mongoose from 'mongoose';
import mongoosePaginate from 'mongoose-paginate-v2';

const testResultSchema = new mongoose.Schema({
  testId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
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
    required: true
  },
  
  resultValue: {
    type: String,
    required: true,
    trim: true
  },
  resultUnit: {
    type: String,
    trim: true
  },
  
  referenceRange: {
    min: { type: Number },
    max: { type: Number },
    text: { type: String, trim: true }
  },
  
  flag: {
    type: String,
    enum: ['normal', 'low', 'high', 'critical_low', 'critical_high', 'abnormal', 'positive', 'negative'],
    default: 'normal'
  },
  
  interpretation: {
    type: String,
    trim: true
  },
  
  notes: {
    type: String,
    trim: true
  },
  
  method: {
    type: String,
    trim: true
  },
  
  status: {
    type: String,
    enum: ['preliminary', 'final', 'corrected', 'cancelled'],
    default: 'preliminary'
  },
  
  resultDateTime: {
    type: Date,
    default: Date.now
  },
  
  performedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, { _id: true });

const labResultSchema = new mongoose.Schema({
  labOrder: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'LabOrder',
    required: true,
    unique: true,
    index: true
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
  
  testResults: {
    type: [testResultSchema],
    validate: {
      validator: function(v) {
        return v && v.length > 0;
      },
      message: 'Au moins un résultat de test doit être fourni'
    }
  },
  
  reportDocument: {
    s3Key: { type: String }, // Clé S3 du document
    fileName: { type: String },
    fileSize: { type: Number },
    mimeType: { type: String },
    uploadedAt: { type: Date }
  },
  
  reportSummary: {
    type: String,
    trim: true
  },
  overallInterpretation: {
    type: String,
    trim: true
  },
  recommendations: {
    type: String,
    trim: true
  },
  
  hasCriticalResults: {
    type: Boolean,
    default: false,
    index: true
  },
  criticalResultsDescription: {
    type: String,
    trim: true
  },
  
  status: {
    type: String,
    enum: ['preliminary', 'final', 'corrected', 'cancelled', 'amended'],
    default: 'preliminary',
    required: true,
    index: true
  },
  
  validatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  validatedAt: {
    type: Date
  },
  validationNotes: {
    type: String,
    trim: true
  },
  
  revisions: [{
    revisedAt: { type: Date, default: Date.now },
    revisedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    reason: { type: String, trim: true },
    changes: { type: String, trim: true }
  }],
  
  resultDate: {
    type: Date,
    default: Date.now,
    required: true
  },
  
  communicatedToDoctor: {
    date: { type: Date },
    method: { type: String, enum: ['email', 'phone', 'portal', 'fax', 'in_person'] },
    acknowledgedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  communicatedToPatient: {
    date: { type: Date },
    method: { type: String, enum: ['email', 'phone', 'portal', 'sms', 'in_person'] }
  },
  
  laboratoryInfo: {
    name: { type: String, trim: true },
    address: { type: String, trim: true },
    phone: { type: String, trim: true },
    email: { type: String, trim: true },
    licenseNumber: { type: String, trim: true },
    directorName: { type: String, trim: true },
    accreditationInfo: { type: String, trim: true }
  },
  
  technicalNotes: {
    type: String,
    trim: true
  },
  
  specimenQuality: {
    type: String,
    enum: ['adequate', 'adequate_with_limitations', 'inadequate', 'rejected'],
    default: 'adequate'
  },
  specimenQualityNotes: {
    type: String,
    trim: true
  },
  
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

labResultSchema.index({ patient: 1, resultDate: -1 });
labResultSchema.index({ doctor: 1, resultDate: -1 });
labResultSchema.index({ hasCriticalResults: 1, status: 1 });

labResultSchema.pre('save', function(next) {
  const hasCritical = this.testResults.some(result => 
    result.flag === 'critical_low' || result.flag === 'critical_high'
  );
  
  this.hasCriticalResults = hasCritical;
  if (this.isModified('status') && 
      (this.status === 'final' || this.status === 'validated') && 
      !this.validatedAt) {
    this.validatedAt = new Date();
  }
  
  next();
});

labResultSchema.methods.getAbnormalResults = function() {
  return this.testResults.filter(result => 
    result.flag !== 'normal' && result.flag !== 'negative'
  );
};

labResultSchema.methods.getCriticalResults = function() {
  return this.testResults.filter(result => 
    result.flag === 'critical_low' || result.flag === 'critical_high'
  );
};

labResultSchema.methods.getResultsByCategory = function() {
  const categories = {};
  this.testResults.forEach(result => {
    if (!categories[result.category]) {
      categories[result.category] = [];
    }
    categories[result.category].push(result);
  });
  return categories;
};

labResultSchema.methods.getFlagsSummary = function() {
  const summary = {
    total: this.testResults.length,
    normal: 0,
    abnormal: 0,
    critical: 0
  };
  
  this.testResults.forEach(result => {
    if (result.flag === 'normal' || result.flag === 'negative') {
      summary.normal++;
    } else if (result.flag === 'critical_low' || result.flag === 'critical_high') {
      summary.critical++;
    } else {
      summary.abnormal++;
    }
  });
  
  return summary;
};

labResultSchema.methods.addRevision = function(revisedBy, reason, changes) {
  this.revisions.push({
    revisedAt: new Date(),
    revisedBy,
    reason,
    changes
  });
  this.status = 'amended';
};

labResultSchema.statics.findUncommunicatedCritical = function() {
  return this.find({
    hasCriticalResults: true,
    'communicatedToDoctor.date': { $exists: false }
  });
};

labResultSchema.set('toJSON', { virtuals: true });
labResultSchema.set('toObject', { virtuals: true });

labResultSchema.plugin(mongoosePaginate);

const LabResult = mongoose.model('LabResult', labResultSchema);

export default LabResult;
