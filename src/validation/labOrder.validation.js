import Joi from 'joi';

// Validation pour un test de laboratoire
const labTestSchema = Joi.object({
  testCode: Joi.string().trim().required().messages({
    'string.empty': 'Le code du test est requis',
    'any.required': 'Le code du test est requis'
  }),
  testName: Joi.string().trim().required().messages({
    'string.empty': 'Le nom du test est requis',
    'any.required': 'Le nom du test est requis'
  }),
  category: Joi.string().valid(
    'hematology',
    'biochemistry',
    'microbiology',
    'immunology',
    'pathology',
    'radiology',
    'molecular',
    'toxicology',
    'genetics',
    'other'
  ).required().messages({
    'any.required': 'La catégorie du test est requise',
    'any.only': 'Catégorie de test invalide'
  }),
  specimenType: Joi.string().valid(
    'blood',
    'urine',
    'stool',
    'saliva',
    'tissue',
    'swab',
    'cerebrospinal_fluid',
    'sputum',
    'other'
  ).required().messages({
    'any.required': 'Le type de spécimen est requis',
    'any.only': 'Type de spécimen invalide'
  }),
  fastingRequired: Joi.boolean().default(false),
  instructions: Joi.string().trim().optional().max(500)
});

// Validation pour créer un ordre de laboratoire
export const createLabOrderSchema = Joi.object({
  patient: Joi.string().regex(/^[0-9a-fA-F]{24}$/).required().messages({
    'string.empty': 'L\'ID du patient est requis',
    'any.required': 'L\'ID du patient est requis',
    'string.pattern.base': 'ID patient invalide'
  }),
  consultation: Joi.string().regex(/^[0-9a-fA-F]{24}$/).optional().messages({
    'string.pattern.base': 'ID consultation invalide'
  }),
  tests: Joi.array().items(labTestSchema).min(1).required().messages({
    'array.min': 'Au moins un test doit être spécifié',
    'any.required': 'Les tests sont requis'
  }),
  priority: Joi.string().valid('routine', 'urgent', 'stat', 'asap').default('routine'),
  clinicalNotes: Joi.string().trim().optional().max(1000),
  provisionalDiagnosis: Joi.string().trim().optional().max(500),
  laboratoryInfo: Joi.object({
    laboratoryName: Joi.string().trim().optional(),
    accessionNumber: Joi.string().trim().optional(),
    contactPhone: Joi.string().trim().optional(),
    address: Joi.string().trim().optional()
  }).optional(),
  expectedCompletionDate: Joi.date().optional()
});

// Validation pour mettre à jour un ordre
export const updateLabOrderSchema = Joi.object({
  tests: Joi.array().items(labTestSchema).min(1).optional(),
  priority: Joi.string().valid('routine', 'urgent', 'stat', 'asap').optional(),
  clinicalNotes: Joi.string().trim().optional().max(1000),
  provisionalDiagnosis: Joi.string().trim().optional().max(500),
  laboratoryInfo: Joi.object({
    laboratoryName: Joi.string().trim().optional(),
    accessionNumber: Joi.string().trim().optional(),
    contactPhone: Joi.string().trim().optional(),
    address: Joi.string().trim().optional()
  }).optional(),
  expectedCompletionDate: Joi.date().optional()
}).min(1).messages({
  'object.min': 'Au moins un champ doit être fourni pour la mise à jour'
});

// Validation pour collecter un spécimen
export const collectSpecimenSchema = Joi.object({
  collectedAt: Joi.date().default(Date.now),
  collectedBy: Joi.string().regex(/^[0-9a-fA-F]{24}$/).optional().messages({
    'string.pattern.base': 'ID du collecteur invalide'
  }),
  specimenCondition: Joi.string().valid('good', 'acceptable', 'poor', 'rejected').default('good'),
  collectionNotes: Joi.string().trim().optional().max(500),
  volume: Joi.string().trim().optional(),
  containerType: Joi.string().trim().optional()
});

// Validation pour recevoir au laboratoire
export const receiveSpecimenSchema = Joi.object({
  receivedAt: Joi.date().default(Date.now),
  receivedBy: Joi.string().regex(/^[0-9a-fA-F]{24}$/).optional().messages({
    'string.pattern.base': 'ID du récepteur invalide'
  }),
  specimenCondition: Joi.string().valid('good', 'acceptable', 'poor', 'rejected').default('good'),
  receptionNotes: Joi.string().trim().optional().max(500)
});

// Validation pour mettre à jour le statut
export const updateStatusSchema = Joi.object({
  status: Joi.string().valid(
    'ordered',
    'collected',
    'received',
    'in_progress',
    'completed',
    'validated',
    'reported',
    'cancelled'
  ).required().messages({
    'any.required': 'Le statut est requis',
    'any.only': 'Statut invalide'
  }),
  statusNotes: Joi.string().trim().optional().max(500)
});

// Validation pour annuler un ordre
export const cancelLabOrderSchema = Joi.object({
  cancellationReason: Joi.string().trim().required().min(10).max(500).messages({
    'string.empty': 'La raison d\'annulation est requise',
    'any.required': 'La raison d\'annulation est requise',
    'string.min': 'La raison doit contenir au moins 10 caractères'
  })
});

// Validation pour la recherche d'ordres
export const searchLabOrdersSchema = Joi.object({
  patient: Joi.string().regex(/^[0-9a-fA-F]{24}$/).optional(),
  consultation: Joi.string().regex(/^[0-9a-fA-F]{24}$/).optional(),
  status: Joi.string().valid(
    'ordered',
    'collected',
    'received',
    'in_progress',
    'completed',
    'validated',
    'reported',
    'cancelled'
  ).optional(),
  priority: Joi.string().valid('routine', 'urgent', 'stat', 'asap').optional(),
  category: Joi.string().valid(
    'hematology',
    'biochemistry',
    'microbiology',
    'immunology',
    'pathology',
    'radiology',
    'molecular',
    'toxicology',
    'genetics',
    'other'
  ).optional(),
  orderNumber: Joi.string().trim().optional(),
  startDate: Joi.date().optional(),
  endDate: Joi.date().optional(),
  isOverdue: Joi.boolean().optional(),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  sortBy: Joi.string().valid('createdAt', 'expectedCompletionDate', 'priority', 'status').default('createdAt'),
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
