import mongoose from 'mongoose';
import mongoosePaginate from 'mongoose-paginate-v2';

const documentSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  
  category: {
    type: String,
    enum: [
      'imaging',
      'lab_report',
      'prescription',
      'consultation_note',
      'discharge_summary',
      'operative_report',
      'pathology_report',
      'consent_form',
      'insurance',
      'referral',
      'vaccination_record',
      'medical_certificate',
      'other'
    ],
    required: true,
    index: true
  },
  
  subCategory: {
    type: String,
    trim: true
  },
  
  patient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    required: true,
    index: true
  },
  
  consultation: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Consultation'
  },
  labOrder: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'LabOrder'
  },
  prescription: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Prescription'
  },
  
  storage: {
    s3Key: {
      type: String,
      required: true,
      unique: true
    },
    bucket: {
      type: String,
      required: true
    },
    region: {
      type: String
    },
    url: {
      type: String
    }
  },
  
  file: {
    originalName: {
      type: String,
      required: true
    },
    mimeType: {
      type: String,
      required: true,
      enum: [
        'application/pdf',
        'image/jpeg',
        'image/jpg',
        'image/png',
        'text/csv',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      ]
    },
    size: {
      type: Number,
      required: true
    },
    checksum: {
      type: String
    }
  },
  
  documentDate: {
    type: Date,
    default: Date.now
  },
  
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  medicalInfo: {
    provider: { type: String, trim: true },
    facility: { type: String, trim: true },
    department: { type: String, trim: true },
    studyDate: { type: Date },
    modality: { type: String, trim: true }
  },
  
  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  
  visibility: {
    type: String,
    enum: ['public', 'private', 'restricted'],
    default: 'private'
  },
  authorizedUsers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  
  status: {
    type: String,
    enum: ['active', 'archived', 'deleted', 'superseded'],
    default: 'active',
    index: true
  },
  
  replacesDocument: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Document'
  },
  replacedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Document'
  },
  
  version: {
    type: Number,
    default: 1
  },
  
  verified: {
    isVerified: { type: Boolean, default: false },
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    verifiedAt: { type: Date },
    verificationNotes: { type: String, trim: true }
  },
  
  confidentiality: {
    level: {
      type: String,
      enum: ['normal', 'confidential', 'very_confidential'],
      default: 'normal'
    },
    notes: { type: String, trim: true }
  },
  
  accessLog: [{
    accessedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    accessedAt: { type: Date, default: Date.now },
    action: { 
      type: String, 
      enum: ['view', 'download', 'share', 'update', 'delete'] 
    },
    ipAddress: { type: String }
  }],
  
  downloadCount: {
    type: Number,
    default: 0
  },
  
  notes: {
    type: String,
    trim: true
  },
  
  deletedAt: {
    type: Date
  },
  deletedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  deletionReason: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

documentSchema.index({ patient: 1, documentDate: -1 });
documentSchema.index({ patient: 1, category: 1 });
documentSchema.index({ uploadedBy: 1, createdAt: -1 });
documentSchema.index({ status: 1, category: 1 });
documentSchema.index({ tags: 1 });

documentSchema.index({ 
  title: 'text', 
  description: 'text', 
  tags: 'text',
  'medicalInfo.provider': 'text'
});

documentSchema.pre('save', function(next) {
  if (this.isModified('status') && this.status === 'deleted' && !this.deletedAt) {
    this.deletedAt = new Date();
  }
  
  next();
});

documentSchema.methods.logAccess = function(userId, action, ipAddress = null) {
  this.accessLog.push({
    accessedBy: userId,
    accessedAt: new Date(),
    action,
    ipAddress
  });
  
  if (action === 'download') {
    this.downloadCount++;
  }
  
  if (this.accessLog.length > 100) {
    this.accessLog = this.accessLog.slice(-100);
  }
};

documentSchema.methods.hasAccess = function(userId) {
  if (this.visibility === 'public') {
    return true;
  }
  
  if (this.uploadedBy.toString() === userId.toString()) {
    return true;
  }
  
  if (this.patient.toString() === userId.toString()) {
    return true;
  }
  
  if (this.visibility === 'restricted') {
    return this.authorizedUsers.some(id => id.toString() === userId.toString());
  }
  
  return false;
};

documentSchema.methods.getFormattedSize = function() {
  const bytes = this.file.size;
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
};

documentSchema.methods.createNewVersion = async function(newS3Key, newFileInfo, uploadedBy) {
  const newVersion = new this.constructor({
    title: this.title,
    description: this.description,
    category: this.category,
    subCategory: this.subCategory,
    patient: this.patient,
    consultation: this.consultation,
    labOrder: this.labOrder,
    prescription: this.prescription,
    storage: {
      s3Key: newS3Key,
      bucket: this.storage.bucket,
      region: this.storage.region
    },
    file: newFileInfo,
    documentDate: this.documentDate,
    uploadedBy: uploadedBy,
    medicalInfo: this.medicalInfo,
    tags: this.tags,
    visibility: this.visibility,
    authorizedUsers: this.authorizedUsers,
    version: this.version + 1,
    replacesDocument: this._id
  });
  
  this.replacedBy = newVersion._id;
  this.status = 'superseded';
  await this.save();
  
  return newVersion;
};

documentSchema.statics.searchDocuments = function(query, filters = {}) {
  const searchQuery = {
    status: { $ne: 'deleted' },
    ...filters
  };
  
  if (query) {
    searchQuery.$text = { $search: query };
  }
  
  return this.find(searchQuery).sort({ documentDate: -1 });
};

documentSchema.set('toJSON', { virtuals: true });
documentSchema.set('toObject', { virtuals: true });

documentSchema.plugin(mongoosePaginate);

const Document = mongoose.model('Document', documentSchema);

export default Document;
