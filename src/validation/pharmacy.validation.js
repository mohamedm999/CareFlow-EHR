import Joi from 'joi';

// Validation pour un contact
const contactSchema = Joi.object({
  type: Joi.string().valid('phone', 'mobile', 'fax', 'email', 'emergency').required().messages({
    'any.required': 'Le type de contact est requis',
    'any.only': 'Type de contact invalide'
  }),
  value: Joi.string().trim().required().messages({
    'string.empty': 'La valeur du contact est requise',
    'any.required': 'La valeur du contact est requise'
  }),
  isPrimary: Joi.boolean().default(false)
});

// Validation pour les horaires d'ouverture
const openingHoursSchema = Joi.object({
  day: Joi.string().valid('monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday').required(),
  isOpen: Joi.boolean().default(true),
  openTime: Joi.string().pattern(/^([01]\d|2[0-3]):([0-5]\d)$/).when('isOpen', {
    is: true,
    then: Joi.required(),
    otherwise: Joi.optional()
  }).messages({
    'string.pattern.base': 'Format d\'heure invalide (HH:mm requis)',
    'any.required': 'L\'heure d\'ouverture est requise si la pharmacie est ouverte ce jour'
  }),
  closeTime: Joi.string().pattern(/^([01]\d|2[0-3]):([0-5]\d)$/).when('isOpen', {
    is: true,
    then: Joi.required(),
    otherwise: Joi.optional()
  }).messages({
    'string.pattern.base': 'Format d\'heure invalide (HH:mm requis)',
    'any.required': 'L\'heure de fermeture est requise si la pharmacie est ouverte ce jour'
  }),
  breakStart: Joi.string().pattern(/^([01]\d|2[0-3]):([0-5]\d)$/).optional(),
  breakEnd: Joi.string().pattern(/^([01]\d|2[0-3]):([0-5]\d)$/).optional()
});

// Validation pour l'adresse
const addressSchema = Joi.object({
  street: Joi.string().trim().required().messages({
    'string.empty': 'La rue est requise',
    'any.required': 'La rue est requise'
  }),
  city: Joi.string().trim().required().messages({
    'string.empty': 'La ville est requise',
    'any.required': 'La ville est requise'
  }),
  state: Joi.string().trim().optional(),
  postalCode: Joi.string().trim().required().messages({
    'string.empty': 'Le code postal est requis',
    'any.required': 'Le code postal est requis'
  }),
  country: Joi.string().trim().default('Morocco'),
  coordinates: Joi.object({
    latitude: Joi.number().min(-90).max(90).optional(),
    longitude: Joi.number().min(-180).max(180).optional()
  }).optional()
});

// Validation pour le responsable de la pharmacie
const pharmacyManagerSchema = Joi.object({
  name: Joi.string().trim().required().messages({
    'string.empty': 'Le nom du responsable est requis',
    'any.required': 'Le nom du responsable est requis'
  }),
  licenseNumber: Joi.string().trim().required().messages({
    'string.empty': 'Le numéro de licence du responsable est requis',
    'any.required': 'Le numéro de licence du responsable est requis'
  }),
  email: Joi.string().email().trim().optional(),
  phone: Joi.string().trim().optional()
});

// Validation pour créer une pharmacie
export const createPharmacySchema = Joi.object({
  name: Joi.string().trim().required().min(2).max(200).messages({
    'string.empty': 'Le nom de la pharmacie est requis',
    'any.required': 'Le nom de la pharmacie est requis',
    'string.min': 'Le nom doit contenir au moins 2 caractères'
  }),
  licenseNumber: Joi.string().trim().required().messages({
    'string.empty': 'Le numéro de licence est requis',
    'any.required': 'Le numéro de licence est requis'
  }),
  registrationNumber: Joi.string().trim().optional(),
  address: addressSchema.required(),
  contacts: Joi.array().items(contactSchema).min(1).required().messages({
    'array.min': 'Au moins un contact doit être fourni',
    'any.required': 'Les contacts sont requis'
  }),
  openingHours: Joi.array().items(openingHoursSchema).optional(),
  pharmacyManager: pharmacyManagerSchema.required(),
  assignedUsers: Joi.array().items(
    Joi.string().regex(/^[0-9a-fA-F]{24}$/)
  ).optional(),
  services: Joi.array().items(
    Joi.string().valid(
      'prescription_dispensing',
      'otc_medications',
      'consultation',
      'home_delivery',
      'emergency_service',
      'vaccination',
      'medical_equipment',
      'compounding',
      '24_7_service'
    )
  ).optional(),
  type: Joi.string().valid('community', 'hospital', 'clinic', 'online', 'specialty').default('community'),
  isActive: Joi.boolean().default(true),
  partnershipStatus: Joi.string().valid('active', 'inactive', 'suspended', 'pending').default('active'),
  notes: Joi.string().trim().optional().max(1000),
  specializations: Joi.array().items(Joi.string().trim()).optional(),
  canDispenseControlledSubstances: Joi.boolean().default(false),
  acceptsInsurance: Joi.boolean().default(true),
  insuranceProviders: Joi.array().items(Joi.string().trim()).optional()
});

// Validation pour mettre à jour une pharmacie
export const updatePharmacySchema = Joi.object({
  name: Joi.string().trim().optional().min(2).max(200),
  registrationNumber: Joi.string().trim().optional(),
  address: addressSchema.optional(),
  contacts: Joi.array().items(contactSchema).min(1).optional(),
  openingHours: Joi.array().items(openingHoursSchema).optional(),
  pharmacyManager: pharmacyManagerSchema.optional(),
  assignedUsers: Joi.array().items(
    Joi.string().regex(/^[0-9a-fA-F]{24}$/)
  ).optional(),
  services: Joi.array().items(
    Joi.string().valid(
      'prescription_dispensing',
      'otc_medications',
      'consultation',
      'home_delivery',
      'emergency_service',
      'vaccination',
      'medical_equipment',
      'compounding',
      '24_7_service'
    )
  ).optional(),
  type: Joi.string().valid('community', 'hospital', 'clinic', 'online', 'specialty').optional(),
  isActive: Joi.boolean().optional(),
  partnershipStatus: Joi.string().valid('active', 'inactive', 'suspended', 'pending').optional(),
  notes: Joi.string().trim().optional().max(1000),
  specializations: Joi.array().items(Joi.string().trim()).optional(),
  canDispenseControlledSubstances: Joi.boolean().optional(),
  acceptsInsurance: Joi.boolean().optional(),
  insuranceProviders: Joi.array().items(Joi.string().trim()).optional()
}).min(1).messages({
  'object.min': 'Au moins un champ doit être fourni pour la mise à jour'
});

// Validation pour assigner un utilisateur
export const assignUserSchema = Joi.object({
  userId: Joi.string().regex(/^[0-9a-fA-F]{24}$/).required().messages({
    'string.empty': 'L\'ID de l\'utilisateur est requis',
    'any.required': 'L\'ID de l\'utilisateur est requis',
    'string.pattern.base': 'ID d\'utilisateur invalide'
  })
});

// Validation pour retirer un utilisateur
export const removeUserSchema = Joi.object({
  userId: Joi.string().regex(/^[0-9a-fA-F]{24}$/).required().messages({
    'string.empty': 'L\'ID de l\'utilisateur est requis',
    'any.required': 'L\'ID de l\'utilisateur est requis',
    'string.pattern.base': 'ID d\'utilisateur invalide'
  })
});

// Validation pour la recherche de pharmacies
export const searchPharmaciesSchema = Joi.object({
  query: Joi.string().trim().optional(),
  city: Joi.string().trim().optional(),
  postalCode: Joi.string().trim().optional(),
  type: Joi.string().valid('community', 'hospital', 'clinic', 'online', 'specialty').optional(),
  isActive: Joi.boolean().optional(),
  partnershipStatus: Joi.string().valid('active', 'inactive', 'suspended', 'pending').optional(),
  services: Joi.string().optional(), // Service unique à rechercher
  canDispenseControlledSubstances: Joi.boolean().optional(),
  acceptsInsurance: Joi.boolean().optional(),
  latitude: Joi.number().min(-90).max(90).optional(),
  longitude: Joi.number().min(-180).max(180).optional(),
  maxDistance: Joi.number().min(1).max(100).default(10), // En km
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  sortBy: Joi.string().valid('name', 'createdAt', 'rating.average').default('name'),
  sortOrder: Joi.string().valid('asc', 'desc').default('asc')
});

// Validation pour mettre à jour le rating
export const updateRatingSchema = Joi.object({
  rating: Joi.number().min(0).max(5).required().messages({
    'number.base': 'Le rating doit être un nombre',
    'number.min': 'Le rating doit être entre 0 et 5',
    'number.max': 'Le rating doit être entre 0 et 5',
    'any.required': 'Le rating est requis'
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
