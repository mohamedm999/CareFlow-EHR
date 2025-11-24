import express from 'express';
import {
  createLabResult,
  getLabResults,
  getLabResultById,
  updateLabResult,
  validateLabResult,
  addRevision,
  uploadPdfReport,
  getReportDownloadUrl,
  getAbnormalResults,
  getLabResultStats
} from '../controllers/labResult.controller.js';
import { authenticateToken } from '../middleware/auth.js';
import { checkPermission } from '../middleware/checkPermission.js';
import { validate } from '../middleware/validator.js';
import { uploadSingle, handleMulterError } from '../middleware/upload.js';
import {
  createLabResultSchema,
  updateLabResultSchema,
  validateLabResultSchema,
  addRevisionSchema,
  searchLabResultsSchema,
  mongoIdSchema
} from '../validation/labResult.validation.js';

const router = express.Router();

/**
 * @route   POST /api/lab-results
 * @desc    Créer un résultat de laboratoire
 * @access  Private (lab_technician)
 */
router.post(
  '/',
  authenticateToken,
  checkPermission('create_lab_results'),
  validate(createLabResultSchema),
  createLabResult
);

/**
 * @route   GET /api/lab-results
 * @desc    Obtenir tous les résultats avec filtres et pagination
 * @access  Private (tous les utilisateurs authentifiés)
 */
router.get(
  '/',
  authenticateToken,
  checkPermission('view_lab_results'),
  validate(searchLabResultsSchema, 'query'),
  getLabResults
);

/**
 * @route   GET /api/lab-results/stats/overview
 * @desc    Obtenir les statistiques des résultats
 * @access  Private (admin, manager, lab_technician)
 */
router.get(
  '/stats/overview',
  authenticateToken,
  checkPermission('view_lab_results'),
  getLabResultStats
);

/**
 * @route   GET /api/lab-results/:id
 * @desc    Obtenir un résultat par ID
 * @access  Private (tous les utilisateurs authentifiés)
 */
router.get(
  '/:id',
  authenticateToken,
  checkPermission('view_lab_results'),
  validate(mongoIdSchema, 'params'),
  getLabResultById
);

/**
 * @route   PUT /api/lab-results/:id
 * @desc    Mettre à jour un résultat
 * @access  Private (lab_technician)
 */
router.put(
  '/:id',
  authenticateToken,
  checkPermission('edit_lab_results'),
  validate(mongoIdSchema, 'params'),
  validate(updateLabResultSchema),
  updateLabResult
);

/**
 * @route   PATCH /api/lab-results/:id/validate
 * @desc    Valider un résultat de laboratoire
 * @access  Private (lab_technician, doctor)
 */
router.patch(
  '/:id/validate',
  authenticateToken,
  checkPermission('validate_lab_results'),
  validate(mongoIdSchema, 'params'),
  validate(validateLabResultSchema),
  validateLabResult
);

/**
 * @route   POST /api/lab-results/:id/revisions
 * @desc    Ajouter une révision à un résultat
 * @access  Private (lab_technician)
 */
router.post(
  '/:id/revisions',
  authenticateToken,
  checkPermission('edit_lab_results'),
  validate(mongoIdSchema, 'params'),
  validate(addRevisionSchema),
  addRevision
);

/**
 * @route   POST /api/lab-results/:id/upload-report
 * @desc    Upload du rapport PDF
 * @access  Private (lab_technician)
 */
router.post(
  '/:id/upload-report',
  authenticateToken,
  checkPermission('upload_lab_reports'),
  validate(mongoIdSchema, 'params'),
  uploadSingle('report'),
  handleMulterError,
  uploadPdfReport
);

/**
 * @route   GET /api/lab-results/:id/download-report
 * @desc    Obtenir l'URL de téléchargement du rapport PDF
 * @access  Private (tous les utilisateurs authentifiés)
 */
router.get(
  '/:id/download-report',
  authenticateToken,
  checkPermission('view_lab_results'),
  validate(mongoIdSchema, 'params'),
  getReportDownloadUrl
);

/**
 * @route   GET /api/lab-results/:id/abnormal
 * @desc    Obtenir les résultats anormaux
 * @access  Private (doctor, lab_technician)
 */
router.get(
  '/:id/abnormal',
  authenticateToken,
  checkPermission('view_lab_results'),
  validate(mongoIdSchema, 'params'),
  getAbnormalResults
);

export default router;
