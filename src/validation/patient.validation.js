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

export const createPatientWithUserSchema = Joi.object({
  // User fields
  firstName: Joi.string().trim().required().min(1).max(50).messages({
    'string.empty': 'First name is required',
    'any.required': 'First name is required'
  }),
  lastName: Joi.string().trim().required().min(1).max(50).messages({
    'string.empty': 'Last name is required',
    'any.required': 'Last name is required'
  }),
  email: Joi.string().email().required().messages({
    'string.email': 'Invalid email format',
    'any.required': 'Email is required'
  }),
  password: Joi.string().min(8).required().messages({
    'string.min': 'Password must be at least 8 characters',
    'any.required': 'Password is required'
  }),
  // Patient fields
  dateOfBirth: Joi.date().required().messages({
    'any.required': 'Date of birth is required'
  }),
  gender: Joi.string().valid('male', 'female', 'other').required().messages({
    'any.only': 'Gender must be male, female, or other',
    'any.required': 'Gender is required'
  }),
  phone: Joi.string().trim().optional(),
  address: Joi.object({
    street: Joi.string().optional(),
    city: Joi.string().optional(),
    state: Joi.string().optional(),
    zipCode: Joi.string().optional(),
    country: Joi.string().optional()
  }).optional(),
  bloodType: Joi.string().valid('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-').optional(),
  allergies: Joi.array().items(Joi.object({
    allergen: Joi.string().required(),
    severity: Joi.string().valid('mild', 'moderate', 'severe').required(),
    notes: Joi.string().optional()
  })).optional(),
  emergencyContact: Joi.object({
    name: Joi.string().optional(),
    relationship: Joi.string().optional(),
    phone: Joi.string().optional()
  }).optional()
});
