import express from 'express';
import {
  createConsultation,
  getConsultations,
  getConsultationById,
  updateConsultation,
  deleteConsultation,
  getConsultationsByPatient,
  updateVitalSigns,
  updateConsultationStatus,
  getConsultationStats
} from '../controllers/consultation.controller.js';
import { authenticateToken } from '../middleware/auth.js';
import { checkPermission } from '../middleware/checkPermission.js';
import { validate } from '../middleware/validator.js';
import {
  createConsultationSchema,
  updateConsultationSchema,
  consultationQuerySchema,
  mongoIdSchema,
  updateVitalSignsSchema,
  updateStatusSchema
} from '../validation/consultation.validation.js';

const router = express.Router();

// Toutes les routes nécessitent une authentification
router.use(authenticateToken);

/**
 * @route   GET /api/consultations/stats/overview
 * @desc    Obtenir les statistiques des consultations
 * @access  Private (Doctor, Admin)
 */
router.get(
  '/stats/overview',
  checkPermission('view_all_consultations'),
  getConsultationStats
);

/**
 * @route   POST /api/consultations
 * @desc    Créer une nouvelle consultation
 * @access  Private (Doctor, Nurse)
 */
router.post(
  '/',
  checkPermission('create_consultations'),
  validate(createConsultationSchema, 'body'),
  createConsultation
);

/**
 * @route   GET /api/consultations
 * @desc    Obtenir toutes les consultations avec filtres
 * @access  Private
 */
router.get(
  '/',
  validate(consultationQuerySchema, 'query'),
  getConsultations
);

/**
 * @route   GET /api/consultations/patient/:patientId
 * @desc    Obtenir toutes les consultations d'un patient
 * @access  Private
 */
router.get(
  '/patient/:patientId',
  validate(mongoIdSchema, 'params'),
  getConsultationsByPatient
);

/**
 * @route   GET /api/consultations/:id
 * @desc    Obtenir une consultation par ID
 * @access  Private
 */
router.get(
  '/:id',
  validate(mongoIdSchema, 'params'),
  getConsultationById
);

/**
 * @route   PUT /api/consultations/:id
 * @desc    Mettre à jour une consultation
 * @access  Private (Doctor, Nurse)
 */
router.put(
  '/:id',
  checkPermission('edit_consultations'),
  validate(mongoIdSchema, 'params'),
  validate(updateConsultationSchema, 'body'),
  updateConsultation
);

/**
 * @route   PATCH /api/consultations/:id/vital-signs
 * @desc    Mettre à jour les constantes vitales
 * @access  Private (Doctor, Nurse)
 */
router.patch(
  '/:id/vital-signs',
  checkPermission('edit_consultations'),
  validate(mongoIdSchema, 'params'),
  validate(updateVitalSignsSchema, 'body'),
  updateVitalSigns
);

/**
 * @route   PATCH /api/consultations/:id/status
 * @desc    Changer le statut d'une consultation
 * @access  Private (Doctor, Nurse, Admin)
 */
router.patch(
  '/:id/status',
  checkPermission('edit_consultations'),
  validate(mongoIdSchema, 'params'),
  validate(updateStatusSchema, 'body'),
  updateConsultationStatus
);

/**
 * @route   DELETE /api/consultations/:id
 * @desc    Supprimer une consultation
 * @access  Private (Admin, Doctor)
 */
router.delete(
  '/:id',
  checkPermission('delete_consultations'),
  validate(mongoIdSchema, 'params'),
  deleteConsultation
);

export default router;
