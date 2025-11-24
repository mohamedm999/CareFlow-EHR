import Joi from 'joi';

const vitalSignsSchema = Joi.object({
  bloodPressure: Joi.object({
    systolic: Joi.number().min(50).max(250).optional(),
    diastolic: Joi.number().min(30).max(150).optional()
  }).optional(),
  heartRate: Joi.number().min(30).max(220).optional(),
  temperature: Joi.number().min(35).max(42).optional(),
  weight: Joi.number().min(0.5).max(500).optional(),
  height: Joi.number().min(30).max(250).optional(),
  respiratoryRate: Joi.number().min(5).max(60).optional(),
  oxygenSaturation: Joi.number().min(50).max(100).optional()
});

const diagnosisSchema = Joi.object({
  code: Joi.string().trim().optional(),
  description: Joi.string().trim().required().messages({
    'string.empty': 'La description du diagnostic est requise',
    'any.required': 'La description du diagnostic est requise'
  }),
  type: Joi.string().valid('primary', 'secondary', 'provisional', 'differential').default('primary'),
  notes: Joi.string().trim().optional()
});

const procedureSchema = Joi.object({
  code: Joi.string().trim().optional(),
  name: Joi.string().trim().required().messages({
    'string.empty': 'Le nom de la procédure est requis',
    'any.required': 'Le nom de la procédure est requis'
  }),
  description: Joi.string().trim().optional(),
  duration: Joi.number().min(1).max(1440).optional(), 
  outcome: Joi.string().trim().optional(),
  notes: Joi.string().trim().optional()
});

const physicalExaminationSchema = Joi.object({
  general: Joi.string().trim().optional(),
  cardiovascular: Joi.string().trim().optional(),
  respiratory: Joi.string().trim().optional(),
  abdominal: Joi.string().trim().optional(),
  neurological: Joi.string().trim().optional(),
  musculoskeletal: Joi.string().trim().optional(),
  skin: Joi.string().trim().optional(),
  other: Joi.string().trim().optional()
});

export const createConsultationSchema = Joi.object({
  appointment: Joi.string().regex(/^[0-9a-fA-F]{24}$/).optional().messages({
    'string.pattern.base': 'ID de rendez-vous invalide'
  }),
  appointmentId: Joi.string().regex(/^[0-9a-fA-F]{24}$/).optional().messages({
    'string.pattern.base': 'ID de rendez-vous invalide'
  }),
  patient: Joi.string().regex(/^[0-9a-fA-F]{24}$/).optional().messages({
    'string.pattern.base': 'ID de patient invalide'
  }),
  patientId: Joi.string().regex(/^[0-9a-fA-F]{24}$/).optional().messages({
    'string.pattern.base': 'ID de patient invalide'
  }),
  doctor: Joi.string().regex(/^[0-9a-fA-F]{24}$/).optional(),
  consultationDate: Joi.date().optional(),
  consultationType: Joi.string().valid('initial', 'follow_up', 'emergency', 'routine_checkup', 'specialist').default('routine_checkup'),
  chiefComplaint: Joi.string().trim().required().min(3).max(500).messages({
    'string.empty': 'Le motif de consultation est requis',
    'any.required': 'Le motif de consultation est requis',
    'string.min': 'Le motif de consultation doit contenir au moins 3 caractères',
    'string.max': 'Le motif de consultation ne peut pas dépasser 500 caractères'
  }),
  historyOfPresentIllness: Joi.string().trim().optional().max(2000),
  vitalSigns: vitalSignsSchema.optional(),
  physicalExamination: physicalExaminationSchema.optional(),
  diagnoses: Joi.array().items(diagnosisSchema).optional(),
  procedures: Joi.array().items(procedureSchema).optional(),
  treatmentPlan: Joi.string().trim().optional().max(2000),
  recommendations: Joi.string().trim().optional().max(2000),
  followUpRequired: Joi.boolean().optional(),
  followUpDate: Joi.date().optional().greater('now'),
  followUpInstructions: Joi.string().trim().optional().max(1000),
  privateNotes: Joi.string().trim().optional().max(2000),
  status: Joi.string().valid('draft', 'completed', 'reviewed', 'archived').default('draft')
});

export const updateConsultationSchema = Joi.object({
  consultationDate: Joi.date().optional(),
  consultationType: Joi.string().valid('initial', 'follow_up', 'emergency', 'routine_checkup', 'specialist').optional(),
  chiefComplaint: Joi.string().trim().optional().min(3).max(500),
  historyOfPresentIllness: Joi.string().trim().optional().max(2000),
  vitalSigns: vitalSignsSchema.optional(),
  physicalExamination: physicalExaminationSchema.optional(),
  diagnoses: Joi.array().items(diagnosisSchema).optional(),
  procedures: Joi.array().items(procedureSchema).optional(),
  treatmentPlan: Joi.string().trim().optional().max(2000),
  recommendations: Joi.string().trim().optional().max(2000),
  followUpRequired: Joi.boolean().optional(),
  followUpDate: Joi.date().optional().greater('now'),
  followUpInstructions: Joi.string().trim().optional().max(1000),
  privateNotes: Joi.string().trim().optional().max(2000),
  status: Joi.string().valid('draft', 'completed', 'reviewed', 'archived').optional(),
  reviewedBy: Joi.string().regex(/^[0-9a-fA-F]{24}$/).optional()
}).min(1).messages({
  'object.min': 'Au moins un champ doit être fourni pour la mise à jour'
});

export const consultationQuerySchema = Joi.object({
  patient: Joi.string().regex(/^[0-9a-fA-F]{24}$/).optional(),
  doctor: Joi.string().regex(/^[0-9a-fA-F]{24}$/).optional(),
  consultationType: Joi.string().valid('initial', 'follow_up', 'emergency', 'routine_checkup', 'specialist').optional(),
  status: Joi.string().valid('draft', 'completed', 'reviewed', 'archived').optional(),
  startDate: Joi.date().optional(),
  endDate: Joi.date().optional().greater(Joi.ref('startDate')),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  sortBy: Joi.string().valid('consultationDate', 'createdAt', 'updatedAt').default('consultationDate'),
  sortOrder: Joi.string().valid('asc', 'desc').default('desc')
});

export const mongoIdSchema = Joi.object({
  id: Joi.string().regex(/^[0-9a-fA-F]{24}$/).required().messages({
    'string.empty': 'L\'ID est requis',
    'any.required': 'L\'ID est requis',
    'string.pattern.base': 'ID invalide'
  })
});

export const addDiagnosisSchema = Joi.object({
  diagnosis: diagnosisSchema.required()
});

export const addProcedureSchema = Joi.object({
  procedure: procedureSchema.required()
});

export const updateVitalSignsSchema = Joi.object({
  vitalSigns: vitalSignsSchema.required().messages({
    'any.required': 'Les constantes vitales sont requises'
  })
});

export const updateStatusSchema = Joi.object({
  status: Joi.string().valid('draft', 'completed', 'reviewed', 'archived').required().messages({
    'any.required': 'Le statut est requis',
    'any.only': 'Statut invalide'
  })
});
