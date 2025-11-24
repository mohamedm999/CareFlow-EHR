import Joi from 'joi';

export const createPatientSchema = Joi.object({
  userId: Joi.string().required(),
  bloodType: Joi.string().valid('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'),
  allergies: Joi.array().items(Joi.object({
    allergen: Joi.string().required(),
    severity: Joi.string().valid('mild', 'moderate', 'severe').required(),
    notes: Joi.string()
  })),
  medicalHistory: Joi.array().items(Joi.object({
    condition: Joi.string().required(),
    diagnosedDate: Joi.date(),
    status: Joi.string().valid('active', 'resolved', 'chronic').required(),
    notes: Joi.string()
  })),
  emergencyContact: Joi.object({
    name: Joi.string(),
    relationship: Joi.string(),
    phone: Joi.string()
  }),
  insurance: Joi.object({
    provider: Joi.string(),
    policyNumber: Joi.string(),
    expiryDate: Joi.date()
  })
});

export const updatePatientSchema = Joi.object({
  bloodType: Joi.string().valid('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'),
  emergencyContact: Joi.object({
    name: Joi.string(),
    relationship: Joi.string(),
    phone: Joi.string()
  }),
  consents: Joi.object({
    dataSharing: Joi.boolean(),
    treatmentConsent: Joi.boolean(),
    consentDate: Joi.date()
  })
});

export const addAllergySchema = Joi.object({
  allergen: Joi.string().required(),
  severity: Joi.string().valid('mild', 'moderate', 'severe').required(),
  notes: Joi.string()
});

export const addMedicalHistorySchema = Joi.object({
  condition: Joi.string().required(),
  diagnosedDate: Joi.date(),
  status: Joi.string().valid('active', 'resolved', 'chronic').required(),
  notes: Joi.string()
});
