import Joi from 'joi';

// Validation pour un résultat de test
const testResultSchema = Joi.object({
  testCode: Joi.string().trim().required().messages({
    'string.empty': 'Le code du test est requis',
    'any.required': 'Le code du test est requis'
  }),
  testName: Joi.string().trim().required().messages({
    'string.empty': 'Le nom du test est requis',
    'any.required': 'Le nom du test est requis'
  }),
  resultValue: Joi.string().trim().required().messages({
    'string.empty': 'La valeur du résultat est requise',
    'any.required': 'La valeur du résultat est requise'
  }),
  unit: Joi.string().trim().optional(),
  referenceRange: Joi.string().trim().optional(),
  flag: Joi.string().valid('normal', 'low', 'high', 'critical_low', 'critical_high', 'abnormal').optional(),
  notes: Joi.string().trim().optional().max(500)
});

// Validation pour créer un résultat de laboratoire
export const createLabResultSchema = Joi.object({
  labOrder: Joi.string().regex(/^[0-9a-fA-F]{24}$/).required().messages({
    'string.empty': 'L\'ID de l\'ordre est requis',
    'any.required': 'L\'ID de l\'ordre est requis',
    'string.pattern.base': 'ID ordre invalide'
  }),
  testResults: Joi.array().items(testResultSchema).min(1).required().messages({
    'array.min': 'Au moins un résultat de test doit être fourni',
    'any.required': 'Les résultats de test sont requis'
  }),
  performedBy: Joi.string().regex(/^[0-9a-fA-F]{24}$/).optional().messages({
    'string.pattern.base': 'ID du technicien invalide'
  }),
  performedAt: Joi.date().default(Date.now),
  methodology: Joi.string().trim().optional().max(500),
  equipmentUsed: Joi.string().trim().optional().max(200),
  interpretation: Joi.string().trim().optional().max(2000),
  recommendations: Joi.string().trim().optional().max(1000),
  laboratoryComments: Joi.string().trim().optional().max(1000)
});

// Validation pour mettre à jour un résultat
export const updateLabResultSchema = Joi.object({
  testResults: Joi.array().items(testResultSchema).min(1).optional(),
  performedBy: Joi.string().regex(/^[0-9a-fA-F]{24}$/).optional(),
  performedAt: Joi.date().optional(),
  methodology: Joi.string().trim().optional().max(500),
  equipmentUsed: Joi.string().trim().optional().max(200),
  interpretation: Joi.string().trim().optional().max(2000),
  recommendations: Joi.string().trim().optional().max(1000),
  laboratoryComments: Joi.string().trim().optional().max(1000)
}).min(1).messages({
  'object.min': 'Au moins un champ doit être fourni pour la mise à jour'
});

// Validation pour valider un résultat
export const validateLabResultSchema = Joi.object({
  validatedBy: Joi.string().regex(/^[0-9a-fA-F]{24}$/).optional().messages({
    'string.pattern.base': 'ID du validateur invalide'
  }),
  validatedAt: Joi.date().default(Date.now),
  validationNotes: Joi.string().trim().optional().max(500)
});

// Validation pour ajouter une révision
export const addRevisionSchema = Joi.object({
  reason: Joi.string().trim().required().min(10).max(500).messages({
    'string.empty': 'La raison de la révision est requise',
    'any.required': 'La raison de la révision est requise',
    'string.min': 'La raison doit contenir au moins 10 caractères'
  }),
  changes: Joi.string().trim().required().max(1000).messages({
    'string.empty': 'Les changements sont requis',
    'any.required': 'Les changements sont requis'
  }),
  testResults: Joi.array().items(testResultSchema).optional()
});

// Validation pour upload de PDF
export const uploadPdfSchema = Joi.object({
  fileName: Joi.string().trim().required().messages({
    'string.empty': 'Le nom du fichier est requis',
    'any.required': 'Le nom du fichier est requis'
  }),
  s3Key: Joi.string().trim().required().messages({
    'string.empty': 'La clé S3 est requise',
    'any.required': 'La clé S3 est requise'
  }),
  fileSize: Joi.number().integer().positive().optional(),
  mimeType: Joi.string().valid('application/pdf').default('application/pdf')
});

// Validation pour la recherche de résultats
export const searchLabResultsSchema = Joi.object({
  patient: Joi.string().regex(/^[0-9a-fA-F]{24}$/).optional(),
  labOrder: Joi.string().regex(/^[0-9a-fA-F]{24}$/).optional(),
  status: Joi.string().valid('pending', 'preliminary', 'final', 'amended', 'cancelled').optional(),
  hasCriticalResults: Joi.boolean().optional(),
  startDate: Joi.date().optional(),
  endDate: Joi.date().optional(),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  sortBy: Joi.string().valid('createdAt', 'performedAt', 'validatedAt').default('createdAt'),
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
