import mongoose from 'mongoose';

const appointmentSchema = new mongoose.Schema({
  patient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  doctor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  dateTime: {
    type: Date,
    required: true
  },
  duration: {
    type: Number,
    required: true,
    default: 30 
  },
  reason: {
    type: String,
    required: true
  },
  notes: String,
  status: {
    type: String,
    enum: ['scheduled', 'completed', 'cancelled', 'no_show'],
    default: 'scheduled'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  reminderSent: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

appointmentSchema.index({ doctor: 1, status: 1, dateTime: 1 });

const Appointment = mongoose.model('Appointment', appointmentSchema);
export default Appointment;