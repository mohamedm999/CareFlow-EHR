import Joi from 'joi';

// Validation pour les métadonnées médicales
const medicalInfoSchema = Joi.object({
  provider: Joi.string().regex(/^[0-9a-fA-F]{24}$/).optional().messages({
    'string.pattern.base': 'ID du fournisseur invalide'
  }),
  facility: Joi.string().trim().optional().max(200),
  studyDate: Joi.date().optional(),
  modality: Joi.string().trim().optional().max(50),
  bodyPart: Joi.string().trim().optional().max(100),
  findings: Joi.string().trim().optional().max(2000),
  impressions: Joi.string().trim().optional().max(2000)
});

// Validation pour créer un document
export const createDocumentSchema = Joi.object({
  patient: Joi.string().regex(/^[0-9a-fA-F]{24}$/).required().messages({
    'string.empty': 'L\'ID du patient est requis',
    'any.required': 'L\'ID du patient est requis',
    'string.pattern.base': 'ID patient invalide'
  }),
  consultation: Joi.string().regex(/^[0-9a-fA-F]{24}$/).optional().messages({
    'string.pattern.base': 'ID consultation invalide'
  }),
  labOrder: Joi.string().regex(/^[0-9a-fA-F]{24}$/).optional().messages({
    'string.pattern.base': 'ID ordre laboratoire invalide'
  }),
  prescription: Joi.string().regex(/^[0-9a-fA-F]{24}$/).optional().messages({
    'string.pattern.base': 'ID prescription invalide'
  }),
  category: Joi.string().valid(
    'imaging',
    'lab_report',
    'prescription',
    'consent_form',
    'medical_record',
    'discharge_summary',
    'operative_report',
    'pathology_report',
    'radiology_report',
    'progress_note',
    'other'
  ).required().messages({
    'any.required': 'La catégorie est requise',
    'any.only': 'Catégorie de document invalide'
  }),
  title: Joi.string().trim().required().min(3).max(200).messages({
    'string.empty': 'Le titre est requis',
    'any.required': 'Le titre est requis',
    'string.min': 'Le titre doit contenir au moins 3 caractères'
  }),
  description: Joi.string().trim().optional().max(1000),
  tags: Joi.any().optional(),
  medicalInfo: medicalInfoSchema.optional(),
  isConfidential: Joi.boolean().default(false),
  expiresAt: Joi.date().optional()
});

// Validation pour mettre à jour un document (métadonnées uniquement)
export const updateDocumentSchema = Joi.object({
  title: Joi.string().trim().optional().min(3).max(200),
  description: Joi.string().trim().optional().max(1000),
  category: Joi.string().valid(
    'imaging',
    'lab_report',
    'prescription',
    'consent_form',
    'medical_record',
    'discharge_summary',
    'operative_report',
    'pathology_report',
    'radiology_report',
    'progress_note',
    'other'
  ).optional(),
  tags: Joi.array().items(Joi.string().trim().max(50)).optional(),
  medicalInfo: medicalInfoSchema.optional(),
  isConfidential: Joi.boolean().optional(),
  expiresAt: Joi.date().optional()
}).min(1).messages({
  'object.min': 'Au moins un champ doit être fourni pour la mise à jour'
});

// Validation pour la recherche de documents
export const searchDocumentsSchema = Joi.object({
  patient: Joi.string().regex(/^[0-9a-fA-F]{24}$/).optional(),
  consultation: Joi.string().regex(/^[0-9a-fA-F]{24}$/).optional(),
  labOrder: Joi.string().regex(/^[0-9a-fA-F]{24}$/).optional(),
  prescription: Joi.string().regex(/^[0-9a-fA-F]{24}$/).optional(),
  category: Joi.string().valid(
    'imaging',
    'lab_report',
    'prescription',
    'consent_form',
    'medical_record',
    'discharge_summary',
    'operative_report',
    'pathology_report',
    'radiology_report',
    'progress_note',
    'other'
  ).optional(),
  query: Joi.string().trim().optional(),
  tags: Joi.string().optional(), // Tag unique à rechercher
  uploadedBy: Joi.string().regex(/^[0-9a-fA-F]{24}$/).optional(),
  isConfidential: Joi.boolean().optional(),
  startDate: Joi.date().optional(),
  endDate: Joi.date().optional(),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  sortBy: Joi.string().valid('createdAt', 'uploadedAt', 'title', 'category').default('createdAt'),
  sortOrder: Joi.string().valid('asc', 'desc').default('desc')
});

// Validation pour partager un document
export const shareDocumentSchema = Joi.object({
  sharedWith: Joi.string().regex(/^[0-9a-fA-F]{24}$/).required().messages({
    'string.empty': 'L\'ID de l\'utilisateur est requis',
    'any.required': 'L\'ID de l\'utilisateur est requis',
    'string.pattern.base': 'ID utilisateur invalide'
  }),
  accessLevel: Joi.string().valid('view', 'download', 'edit').default('view'),
  expiresAt: Joi.date().optional()
});

// Validation pour révoquer un partage
export const revokeShareSchema = Joi.object({
  userId: Joi.string().regex(/^[0-9a-fA-F]{24}$/).required().messages({
    'string.empty': 'L\'ID de l\'utilisateur est requis',
    'any.required': 'L\'ID de l\'utilisateur est requis',
    'string.pattern.base': 'ID utilisateur invalide'
  })
});

// Validation pour créer une nouvelle version
export const createVersionSchema = Joi.object({
  versionNotes: Joi.string().trim().required().min(10).max(500).messages({
    'string.empty': 'Les notes de version sont requises',
    'any.required': 'Les notes de version sont requises',
    'string.min': 'Les notes doivent contenir au moins 10 caractères'
  })
});

// Validation pour l'ID MongoDB
export const mongoIdSchema = Joi.object({
  id: Joi.string().regex(/^[0-9a-fA-F]{24}$/).required().messages({
    'string.empty': 'L\'ID est requis',
    'any.required': 'L\'ID est requis',
    'string.pattern.base': 'ID invalide'
  })
});
