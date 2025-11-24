import mongoose from 'mongoose';
import mongoosePaginate from 'mongoose-paginate-v2';

const openingHoursSchema = new mongoose.Schema({
  day: {
    type: String,
    enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
    required: true
  },
  isOpen: {
    type: Boolean,
    default: true
  },
  openTime: {
    type: String, 
    validate: {
      validator: function(v) {
        return /^([01]\d|2[0-3]):([0-5]\d)$/.test(v);
      },
      message: props => `${props.value} n'est pas un format d'heure valide (HH:mm)`
    }
  },
  closeTime: {
    type: String,
    validate: {
      validator: function(v) {
        return /^([01]\d|2[0-3]):([0-5]\d)$/.test(v);
      },
      message: props => `${props.value} n'est pas un format d'heure valide (HH:mm)`
    }
  },
  breakStart: {
    type: String 
  },
  breakEnd: {
    type: String 
  }
}, { _id: false });

const contactSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['phone', 'mobile', 'fax', 'email', 'emergency'],
    required: true
  },
  value: {
    type: String,
    required: true,
    trim: true
  },
  isPrimary: {
    type: Boolean,
    default: false
  }
}, { _id: false });

const pharmacySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  licenseNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  registrationNumber: {
    type: String,
    trim: true
  },

  address: {
    street: { type: String, required: true, trim: true },
    city: { type: String, required: true, trim: true },
    state: { type: String, trim: true },
    postalCode: { type: String, required: true, trim: true },
    country: { type: String, default: 'Morocco', trim: true },
    coordinates: {
      latitude: { type: Number },
      longitude: { type: Number }
    }
  },
 
  contacts: {
    type: [contactSchema],
    validate: {
      validator: function(v) {
        return v && v.length > 0;
      },
      message: 'Au moins un contact doit être fourni'
    }
  },
 
  openingHours: {
    type: [openingHoursSchema],
    default: () => {
      return [
        { day: 'monday', isOpen: true, openTime: '08:00', closeTime: '18:00' },
        { day: 'tuesday', isOpen: true, openTime: '08:00', closeTime: '18:00' },
        { day: 'wednesday', isOpen: true, openTime: '08:00', closeTime: '18:00' },
        { day: 'thursday', isOpen: true, openTime: '08:00', closeTime: '18:00' },
        { day: 'friday', isOpen: true, openTime: '08:00', closeTime: '18:00' },
        { day: 'saturday', isOpen: true, openTime: '09:00', closeTime: '13:00' },
        { day: 'sunday', isOpen: false }
      ];
    }
  },
 
  pharmacyManager: {
    name: { type: String, required: true, trim: true },
    licenseNumber: { type: String, required: true, trim: true },
    email: { type: String, trim: true },
    phone: { type: String, trim: true }
  },
 
  assignedUsers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],

  services: [{
    type: String,
    enum: [
      'prescription_dispensing',
      'otc_medications',
      'consultation',
      'home_delivery',
      'emergency_service',
      'vaccination',
      'medical_equipment',
      'compounding',
      '24_7_service'
    ]
  }],

  type: {
    type: String,
    enum: ['community', 'hospital', 'clinic', 'online', 'specialty'],
    default: 'community'
  },

  isActive: {
    type: Boolean,
    default: true,
    index: true
  },
 
  partnerSince: {
    type: Date,
    default: Date.now
  },
  partnershipStatus: {
    type: String,
    enum: ['active', 'inactive', 'suspended', 'pending'],
    default: 'active'
  },
 
  notes: {
    type: String,
    trim: true
  },
  specializations: [{
    type: String,
    trim: true
  }],

  rating: {
    average: { type: Number, min: 0, max: 5, default: 0 },
    count: { type: Number, default: 0 }
  },

  canDispenseControlledSubstances: {
    type: Boolean,
    default: false
  },
  acceptsInsurance: {
    type: Boolean,
    default: true
  },
  insuranceProviders: [{
    type: String,
    trim: true
  }],

  totalPrescriptionsDispensed: {
    type: Number,
    default: 0
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

pharmacySchema.index({ name: 'text' });
pharmacySchema.index({ 'address.city': 1 });
pharmacySchema.index({ 'address.postalCode': 1 });
pharmacySchema.index({ isActive: 1, partnershipStatus: 1 });
pharmacySchema.index({ 'address.coordinates.latitude': 1, 'address.coordinates.longitude': 1 });

pharmacySchema.methods.isOpenNow = function() {
  const now = new Date();
  const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const currentDay = dayNames[now.getDay()];
  const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  
  const todaySchedule = this.openingHours.find(h => h.day === currentDay);
  
  if (!todaySchedule || !todaySchedule.isOpen) {
    return false;
  }
  
  const isAfterOpen = currentTime >= todaySchedule.openTime;
  const isBeforeClose = currentTime < todaySchedule.closeTime;
  
  if (todaySchedule.breakStart && todaySchedule.breakEnd) {
    const isDuringBreak = currentTime >= todaySchedule.breakStart && currentTime < todaySchedule.breakEnd;
    return isAfterOpen && isBeforeClose && !isDuringBreak;
  }
  
  return isAfterOpen && isBeforeClose;
};

pharmacySchema.methods.getPrimaryContact = function() {
  return this.contacts.find(c => c.isPrimary) || this.contacts[0];
};

pharmacySchema.methods.calculateDistance = function(latitude, longitude) {
  if (!this.address.coordinates.latitude || !this.address.coordinates.longitude) {
    return null;
  }
  
  const R = 6371;
  const dLat = (latitude - this.address.coordinates.latitude) * Math.PI / 180;
  const dLon = (longitude - this.address.coordinates.longitude) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(this.address.coordinates.latitude * Math.PI / 180) * 
    Math.cos(latitude * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c;
  
  return parseFloat(distance.toFixed(2));
};

pharmacySchema.statics.findNearby = function(latitude, longitude, maxDistance = 10) {
  return this.find({
    isActive: true,
    'address.coordinates.latitude': { $exists: true },
    'address.coordinates.longitude': { $exists: true }
  }).then(pharmacies => {
    return pharmacies
      .map(pharmacy => ({
        pharmacy,
        distance: pharmacy.calculateDistance(latitude, longitude)
      }))
      .filter(item => item.distance !== null && item.distance <= maxDistance)
      .sort((a, b) => a.distance - b.distance);
  });
};

pharmacySchema.set('toJSON', { virtuals: true });
pharmacySchema.set('toObject', { virtuals: true });

pharmacySchema.index({ 'address.coordinates': '2dsphere' });

pharmacySchema.plugin(mongoosePaginate);

const Pharmacy = mongoose.model('Pharmacy', pharmacySchema);

export default Pharmacy;
