import Joi from 'joi';

// Validation pour un médicament individuel
const medicationSchema = Joi.object({
  medicationName: Joi.string().trim().required().min(2).max(200).messages({
    'string.empty': 'Le nom du médicament est requis',
    'any.required': 'Le nom du médicament est requis',
    'string.min': 'Le nom du médicament doit contenir au moins 2 caractères'
  }),
  genericName: Joi.string().trim().optional().max(200),
  dosage: Joi.string().trim().required().messages({
    'string.empty': 'Le dosage est requis',
    'any.required': 'Le dosage est requis'
  }),
  strength: Joi.object({
    value: Joi.number().min(0).required(),
    unit: Joi.string().valid('mg', 'g', 'mcg', 'ml', 'L', 'IU', '%').required()
  }).optional(),
  form: Joi.string().valid(
    'tablet', 'capsule', 'liquid', 'injection', 'cream', 'ointment', 
    'inhaler', 'drops', 'patch', 'suppository', 'other'
  ).required().messages({
    'any.required': 'La forme du médicament est requise',
    'any.only': 'Forme de médicament invalide'
  }),
  route: Joi.string().valid(
    'oral', 'sublingual', 'topical', 'intravenous', 'intramuscular', 
    'subcutaneous', 'inhalation', 'rectal', 'ophthalmic', 'otic', 'nasal'
  ).required().messages({
    'any.required': 'La voie d\'administration est requise',
    'any.only': 'Voie d\'administration invalide'
  }),
  frequency: Joi.string().trim().required().min(3).max(100).messages({
    'string.empty': 'La fréquence est requise',
    'any.required': 'La fréquence est requise'
  }),
  duration: Joi.object({
    value: Joi.number().min(1).required(),
    unit: Joi.string().valid('days', 'weeks', 'months', 'as_needed').required()
  }).required().messages({
    'any.required': 'La durée du traitement est requise'
  }),
  quantity: Joi.number().min(1).required().messages({
    'number.base': 'La quantité doit être un nombre',
    'number.min': 'La quantité doit être au moins 1',
    'any.required': 'La quantité est requise'
  }),
  refills: Joi.number().min(0).max(11).default(0),
  instructions: Joi.string().trim().optional().max(500),
  indication: Joi.string().trim().optional().max(300),
  warnings: Joi.string().trim().optional().max(500)
});

// Validation pour créer une prescription
export const createPrescriptionSchema = Joi.object({
  patient: Joi.string().regex(/^[0-9a-fA-F]{24}$/).required().messages({
    'string.empty': 'L\'ID du patient est requis',
    'any.required': 'L\'ID du patient est requis',
    'string.pattern.base': 'ID de patient invalide'
  }),
  doctor: Joi.string().regex(/^[0-9a-fA-F]{24}$/).optional(),
  consultation: Joi.string().regex(/^[0-9a-fA-F]{24}$/).optional(),
  medications: Joi.array().items(medicationSchema).min(1).required().messages({
    'array.min': 'Au moins un médicament doit être prescrit',
    'any.required': 'Les médicaments sont requis'
  }),
  pharmacy: Joi.string().regex(/^[0-9a-fA-F]{24}$/).optional(),
  diagnosis: Joi.string().trim().optional().max(500),
  notes: Joi.string().trim().optional().max(1000),
  priority: Joi.string().valid('routine', 'urgent', 'stat').default('routine'),
  prescriptionDate: Joi.date().optional()
});

// Validation pour mettre à jour une prescription
export const updatePrescriptionSchema = Joi.object({
  medications: Joi.array().items(medicationSchema).min(1).optional(),
  pharmacy: Joi.string().regex(/^[0-9a-fA-F]{24}$/).optional(),
  diagnosis: Joi.string().trim().optional().max(500),
  notes: Joi.string().trim().optional().max(1000),
  priority: Joi.string().valid('routine', 'urgent', 'stat').optional(),
  expiryDate: Joi.date().optional().greater('now')
}).min(1).messages({
  'object.min': 'Au moins un champ doit être fourni pour la mise à jour'
});

// Validation pour changer le statut
export const updateStatusSchema = Joi.object({
  status: Joi.string().valid(
    'draft', 'signed', 'sent', 'dispensed', 'partially_dispensed', 'cancelled', 'expired'
  ).required().messages({
    'any.required': 'Le statut est requis',
    'any.only': 'Statut invalide'
  })
});

// Validation pour signer une prescription
export const signPrescriptionSchema = Joi.object({
  digitalSignature: Joi.string().optional()
});

// Validation pour envoyer à la pharmacie
export const sendToPharmacySchema = Joi.object({
  pharmacyId: Joi.string().regex(/^[0-9a-fA-F]{24}$/).required().messages({
    'string.empty': 'L\'ID de la pharmacie est requis',
    'any.required': 'L\'ID de la pharmacie est requis',
    'string.pattern.base': 'ID de pharmacie invalide'
  })
});

// Validation pour dispenser des médicaments
export const dispenseMedicationSchema = Joi.object({
  medicationId: Joi.string().regex(/^[0-9a-fA-F]{24}$/).required().messages({
    'string.empty': 'L\'ID du médicament est requis',
    'any.required': 'L\'ID du médicament est requis',
    'string.pattern.base': 'ID de médicament invalide'
  }),
  dispensedQuantity: Joi.number().min(1).required().messages({
    'number.min': 'La quantité dispensée doit être au moins 1',
    'any.required': 'La quantité dispensée est requise'
  }),
  batchNumber: Joi.string().trim().optional(),
  expiryDate: Joi.date().optional().greater('now'),
  notes: Joi.string().trim().optional().max(500)
});

// Validation pour annuler une prescription
export const cancelPrescriptionSchema = Joi.object({
  cancellationReason: Joi.string().trim().required().min(10).max(500).messages({
    'string.empty': 'La raison d\'annulation est requise',
    'any.required': 'La raison d\'annulation est requise',
    'string.min': 'La raison doit contenir au moins 10 caractères'
  })
});

// Validation pour les paramètres de requête (filtres)
export const prescriptionQuerySchema = Joi.object({
  patient: Joi.string().regex(/^[0-9a-fA-F]{24}$/).optional(),
  doctor: Joi.string().regex(/^[0-9a-fA-F]{24}$/).optional(),
  pharmacy: Joi.string().regex(/^[0-9a-fA-F]{24}$/).optional(),
  status: Joi.string().valid(
    'draft', 'signed', 'sent', 'dispensed', 'partially_dispensed', 'cancelled', 'expired'
  ).optional(),
  priority: Joi.string().valid('routine', 'urgent', 'stat').optional(),
  startDate: Joi.date().optional(),
  endDate: Joi.date().optional().greater(Joi.ref('startDate')),
  prescriptionNumber: Joi.string().optional(),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  sortBy: Joi.string().valid('prescriptionDate', 'createdAt', 'updatedAt', 'prescriptionNumber').default('prescriptionDate'),
  sortOrder: Joi.string().valid('asc', 'desc').default('desc')
});

// Validation pour l'ID MongoDB
export const mongoIdSchema = Joi.object({
  id: Joi.string().regex(/^[0-9a-fA-F]{24}$/).required().messages({
    'string.empty': 'L\'ID est requis',
    'any.required': 'L\'ID est requis',
    'string.pattern.base': 'ID invalide'
  })
});

// Validation pour renouveler une prescription
export const renewPrescriptionSchema = Joi.object({
  medications: Joi.array().items(medicationSchema).optional(),
  notes: Joi.string().trim().optional().max(1000)
});
