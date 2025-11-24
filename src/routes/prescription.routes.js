import express from 'express';
import {
  createPrescription,
  getPrescriptions,
  getPrescriptionById,
  updatePrescription,
  signPrescription,
  sendToPharmacy,
  dispenseMedication,
  cancelPrescription,
  renewPrescription,
  getPrescriptionsByPatient,
  getPrescriptionsByPharmacy,
  getPrescriptionStats
} from '../controllers/prescription.controller.js';
import { authenticateToken } from '../middleware/auth.js';
import { checkPermission } from '../middleware/checkPermission.js';
import { validate } from '../middleware/validator.js';
import {
  createPrescriptionSchema,
  updatePrescriptionSchema,
  signPrescriptionSchema,
  sendToPharmacySchema,
  dispenseMedicationSchema,
  cancelPrescriptionSchema,
  renewPrescriptionSchema,
  prescriptionQuerySchema,
  mongoIdSchema
} from '../validation/prescription.validation.js';

const router = express.Router();

// Toutes les routes nécessitent une authentification
router.use(authenticateToken);

/**
 * @route   GET /api/prescriptions/stats/overview
 * @desc    Obtenir les statistiques des prescriptions
 * @access  Private (Doctor, Admin)
 */
router.get(
  '/stats/overview',
  checkPermission('view_all_prescriptions'),
  getPrescriptionStats
);

/**
 * @route   POST /api/prescriptions
 * @desc    Créer une nouvelle prescription
 * @access  Private (Doctor)
 */
router.post(
  '/',
  checkPermission('create_prescriptions'),
  validate(createPrescriptionSchema, 'body'),
  createPrescription
);

/**
 * @route   GET /api/prescriptions
 * @desc    Obtenir toutes les prescriptions avec filtres
 * @access  Private
 */
router.get(
  '/',
  validate(prescriptionQuerySchema, 'query'),
  getPrescriptions
);

/**
 * @route   GET /api/prescriptions/patient/:patientId
 * @desc    Obtenir toutes les prescriptions d'un patient
 * @access  Private
 */
router.get(
  '/patient/:patientId',
  validate(mongoIdSchema, 'params'),
  getPrescriptionsByPatient
);

/**
 * @route   GET /api/prescriptions/pharmacy/:pharmacyId
 * @desc    Obtenir toutes les prescriptions d'une pharmacie
 * @access  Private (Pharmacist, Admin)
 */
router.get(
  '/pharmacy/:pharmacyId',
  checkPermission('view_assigned_prescriptions'),
  validate(mongoIdSchema, 'params'),
  getPrescriptionsByPharmacy
);

/**
 * @route   GET /api/prescriptions/:id
 * @desc    Obtenir une prescription par ID
 * @access  Private
 */
router.get(
  '/:id',
  validate(mongoIdSchema, 'params'),
  getPrescriptionById
);

/**
 * @route   PUT /api/prescriptions/:id
 * @desc    Mettre à jour une prescription
 * @access  Private (Doctor)
 */
router.put(
  '/:id',
  checkPermission('create_prescriptions'),
  validate(mongoIdSchema, 'params'),
  validate(updatePrescriptionSchema, 'body'),
  updatePrescription
);

/**
 * @route   PATCH /api/prescriptions/:id/sign
 * @desc    Signer une prescription
 * @access  Private (Doctor)
 */
router.patch(
  '/:id/sign',
  checkPermission('sign_prescriptions'),
  validate(mongoIdSchema, 'params'),
  validate(signPrescriptionSchema, 'body'),
  signPrescription
);

/**
 * @route   PATCH /api/prescriptions/:id/send-to-pharmacy
 * @desc    Envoyer une prescription à une pharmacie
 * @access  Private (Doctor)
 */
router.patch(
  '/:id/send-to-pharmacy',
  checkPermission('send_prescriptions'),
  validate(mongoIdSchema, 'params'),
  validate(sendToPharmacySchema, 'body'),
  sendToPharmacy
);

/**
 * @route   PATCH /api/prescriptions/:id/dispense
 * @desc    Dispenser un médicament (Pharmacien)
 * @access  Private (Pharmacist)
 */
router.patch(
  '/:id/dispense',
  checkPermission('dispense_prescriptions'),
  validate(mongoIdSchema, 'params'),
  validate(dispenseMedicationSchema, 'body'),
  dispenseMedication
);

/**
 * @route   PATCH /api/prescriptions/:id/cancel
 * @desc    Annuler une prescription
 * @access  Private (Doctor, Admin)
 */
router.patch(
  '/:id/cancel',
  checkPermission('create_prescriptions'),
  validate(mongoIdSchema, 'params'),
  validate(cancelPrescriptionSchema, 'body'),
  cancelPrescription
);

/**
 * @route   POST /api/prescriptions/:id/renew
 * @desc    Renouveler une prescription
 * @access  Private (Doctor)
 */
router.post(
  '/:id/renew',
  checkPermission('create_prescriptions'),
  validate(mongoIdSchema, 'params'),
  validate(renewPrescriptionSchema, 'body'),
  renewPrescription
);

export default router;
