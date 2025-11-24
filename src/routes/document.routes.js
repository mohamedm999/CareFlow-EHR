import express from 'express';
import {
  uploadDocument,
  getDocuments,
  getDocumentById,
  updateDocument,
  deleteDocument,
  getDownloadUrl,
  createNewVersion,
  shareDocument,
  revokeShare,
  getAccessLog,
  getDocumentStats
} from '../controllers/document.controller.js';
import { authenticateToken } from '../middleware/auth.js';
import { checkPermission } from '../middleware/checkPermission.js';
import { validate } from '../middleware/validator.js';
import { uploadSingle, handleMulterError } from '../middleware/upload.js';
import {
  createDocumentSchema,
  updateDocumentSchema,
  searchDocumentsSchema,
  shareDocumentSchema,
  revokeShareSchema,
  createVersionSchema,
  mongoIdSchema
} from '../validation/document.validation.js';

const router = express.Router();

/**
 * @route   POST /api/documents
 * @desc    Upload et créer un document
 * @access  Private (doctor, nurse, admin, lab_technician)
 */
router.post(
  '/',
  authenticateToken,
  checkPermission('upload_documents'),
  uploadSingle('document'),
  handleMulterError,
  validate(createDocumentSchema),
  uploadDocument
);

/**
 * @route   GET /api/documents
 * @desc    Obtenir tous les documents avec filtres et pagination
 * @access  Private (tous les utilisateurs authentifiés)
 */
router.get(
  '/',
  authenticateToken,
  checkPermission('view_documents'),
  validate(searchDocumentsSchema, 'query'),
  getDocuments
);

/**
 * @route   GET /api/documents/stats/overview
 * @desc    Obtenir les statistiques des documents
 * @access  Private (admin, manager)
 */
router.get(
  '/stats/overview',
  authenticateToken,
  checkPermission('view_all_documents'),
  getDocumentStats
);

/**
 * @route   GET /api/documents/:id
 * @desc    Obtenir un document par ID
 * @access  Private (tous les utilisateurs authentifiés)
 */
router.get(
  '/:id',
  authenticateToken,
  checkPermission('view_documents'),
  validate(mongoIdSchema, 'params'),
  getDocumentById
);

/**
 * @route   PUT /api/documents/:id
 * @desc    Mettre à jour les métadonnées d'un document
 * @access  Private (uploader, admin)
 */
router.put(
  '/:id',
  authenticateToken,
  checkPermission('edit_documents'),
  validate(mongoIdSchema, 'params'),
  validate(updateDocumentSchema),
  updateDocument
);

/**
 * @route   DELETE /api/documents/:id
 * @desc    Supprimer un document
 * @access  Private (uploader, admin)
 */
router.delete(
  '/:id',
  authenticateToken,
  checkPermission('delete_documents'),
  validate(mongoIdSchema, 'params'),
  deleteDocument
);

/**
 * @route   GET /api/documents/:id/download
 * @desc    Obtenir l'URL de téléchargement d'un document
 * @access  Private (tous les utilisateurs authentifiés avec accès)
 */
router.get(
  '/:id/download',
  authenticateToken,
  checkPermission('download_documents'),
  validate(mongoIdSchema, 'params'),
  getDownloadUrl
);

/**
 * @route   POST /api/documents/:id/versions
 * @desc    Créer une nouvelle version d'un document
 * @access  Private (uploader, admin)
 */
router.post(
  '/:id/versions',
  authenticateToken,
  checkPermission('edit_documents'),
  validate(mongoIdSchema, 'params'),
  uploadSingle('document'),
  handleMulterError,
  validate(createVersionSchema),
  createNewVersion
);

/**
 * @route   POST /api/documents/:id/share
 * @desc    Partager un document avec un utilisateur
 * @access  Private (uploader, admin)
 */
router.post(
  '/:id/share',
  authenticateToken,
  checkPermission('share_documents'),
  validate(mongoIdSchema, 'params'),
  validate(shareDocumentSchema),
  shareDocument
);

/**
 * @route   DELETE /api/documents/:id/share
 * @desc    Révoquer le partage d'un document
 * @access  Private (uploader, admin)
 */
router.delete(
  '/:id/share',
  authenticateToken,
  checkPermission('share_documents'),
  validate(mongoIdSchema, 'params'),
  validate(revokeShareSchema),
  revokeShare
);

/**
 * @route   GET /api/documents/:id/access-log
 * @desc    Obtenir l'historique d'accès d'un document
 * @access  Private (uploader, admin)
 */
router.get(
  '/:id/access-log',
  authenticateToken,
  checkPermission('view_all_documents'),
  validate(mongoIdSchema, 'params'),
  getAccessLog
);

export default router;
