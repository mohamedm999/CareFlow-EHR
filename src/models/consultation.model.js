import mongoose from 'mongoose';
import mongoosePaginate from 'mongoose-paginate-v2';

const vitalSignsSchema = new mongoose.Schema({
  bloodPressure: {
    systolic: { type: Number },
    diastolic: { type: Number }
  },
  heartRate: { type: Number },
  temperature: { type: Number },
  weight: { type: Number },
  height: { type: Number },
  respiratoryRate: { type: Number },
  oxygenSaturation: { type: Number },
  bmi: { type: Number }
}, { _id: false });

const diagnosisSchema = new mongoose.Schema({
  code: { type: String },
  description: { type: String, required: true },
  type: { 
    type: String, 
    enum: ['primary', 'secondary', 'provisional', 'differential'],
    default: 'primary'
  },
  notes: { type: String }
}, { _id: false });

const procedureSchema = new mongoose.Schema({
  code: { type: String },
  name: { type: String, required: true },
  description: { type: String },
  duration: { type: Number },
  outcome: { type: String },
  notes: { type: String }
}, { _id: false });

const consultationSchema = new mongoose.Schema({
  appointment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Appointment',
    required: false
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
  
  consultationDate: {
    type: Date,
    default: Date.now,
    required: true
  },
  consultationType: {
    type: String,
    enum: ['initial', 'follow_up', 'emergency', 'routine_checkup', 'specialist'],
    default: 'routine_checkup'
  },
  
  chiefComplaint: {
    type: String,
    required: true,
    trim: true
  },
  historyOfPresentIllness: {
    type: String,
    trim: true
  },
  
  vitalSigns: {
    type: vitalSignsSchema,
    required: false
  },
  
  physicalExamination: {
    general: { type: String },
    cardiovascular: { type: String },
    respiratory: { type: String },
    abdominal: { type: String },
    neurological: { type: String },
    musculoskeletal: { type: String },
    skin: { type: String },
    other: { type: String }
  },
  
  diagnoses: [diagnosisSchema],
  
  procedures: [procedureSchema],
  
  treatmentPlan: {
    type: String,
    trim: true
  },
  recommendations: {
    type: String,
    trim: true
  },
  
  followUpRequired: {
    type: Boolean,
    default: false
  },
  followUpDate: {
    type: Date
  },
  followUpInstructions: {
    type: String
  },
  
  privateNotes: {
    type: String,
    trim: true
  },
  
  status: {
    type: String,
    enum: ['draft', 'completed', 'reviewed', 'archived'],
    default: 'draft'
  },
  
  completedAt: {
    type: Date
  },
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  reviewedAt: {
    type: Date
  }
}, {
  timestamps: true
});

consultationSchema.index({ patient: 1, consultationDate: -1 });
consultationSchema.index({ doctor: 1, consultationDate: -1 });
consultationSchema.index({ appointment: 1 });
consultationSchema.index({ status: 1 });

consultationSchema.pre('save', function(next) {
  if (this.vitalSigns && this.vitalSigns.weight && this.vitalSigns.height) {
    const heightInMeters = this.vitalSigns.height / 100;
    this.vitalSigns.bmi = parseFloat(
      (this.vitalSigns.weight / (heightInMeters * heightInMeters)).toFixed(2)
    );
  }
  
  if (this.isModified('status') && this.status === 'completed' && !this.completedAt) {
    this.completedAt = new Date();
  }
  
  next();
});

consultationSchema.virtual('duration').get(function() {
  if (this.completedAt && this.consultationDate) {
    return Math.round((this.completedAt - this.consultationDate) / (1000 * 60));
  }
  return null;
});

consultationSchema.methods.getSummary = function() {
  return {
    id: this._id,
    patient: this.patient,
    doctor: this.doctor,
    date: this.consultationDate,
    type: this.consultationType,
    chiefComplaint: this.chiefComplaint,
    diagnosesCount: this.diagnoses.length,
    proceduresCount: this.procedures.length,
    status: this.status
  };
};

consultationSchema.set('toJSON', { virtuals: true });
consultationSchema.set('toObject', { virtuals: true });

consultationSchema.plugin(mongoosePaginate);

const Consultation = mongoose.model('Consultation', consultationSchema);

export default Consultation;
