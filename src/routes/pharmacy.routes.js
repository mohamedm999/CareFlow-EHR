import express from 'express';
import {
  createPharmacy,
  getPharmacies,
  getNearbyPharmacies,
  getPharmacyById,
  updatePharmacy,
  deletePharmacy,
  assignUserToPharmacy,
  removeUserFromPharmacy,
  checkPharmacyStatus,
  getPharmacyStats
} from '../controllers/pharmacy.controller.js';
import { authenticateToken } from '../middleware/auth.js';
import { checkPermission } from '../middleware/checkPermission.js';
import { validate } from '../middleware/validator.js';
import {
  createPharmacySchema,
  updatePharmacySchema,
  assignUserSchema,
  removeUserSchema,
  searchPharmaciesSchema,
  mongoIdSchema
} from '../validation/pharmacy.validation.js';

const router = express.Router();

/**
 * @route   POST /api/pharmacies
 * @desc    Créer une nouvelle pharmacie
 * @access  Private (admin, manager)
 */
router.post(
  '/',
  authenticateToken,
  checkPermission('manage_pharmacies'),
  validate(createPharmacySchema),
  createPharmacy
);

/**
 * @route   GET /api/pharmacies
 * @desc    Obtenir toutes les pharmacies avec filtres et pagination
 * @access  Private (tous les utilisateurs authentifiés)
 */
router.get(
  '/',
  authenticateToken,
  checkPermission('view_pharmacies'),
  validate(searchPharmaciesSchema, 'query'),
  getPharmacies
);

/**
 * @route   GET /api/pharmacies/stats/overview
 * @desc    Obtenir les statistiques des pharmacies
 * @access  Private (admin, manager)
 */
router.get(
  '/stats/overview',
  authenticateToken,
  checkPermission('view_pharmacies'),
  getPharmacyStats
);

/**
 * @route   GET /api/pharmacies/nearby
 * @desc    Obtenir les pharmacies à proximité
 * @access  Private (tous les utilisateurs authentifiés)
 */
router.get(
  '/nearby',
  authenticateToken,
  checkPermission('view_pharmacies'),
  getNearbyPharmacies
);

/**
 * @route   GET /api/pharmacies/:id
 * @desc    Obtenir une pharmacie par ID
 * @access  Private (tous les utilisateurs authentifiés)
 */
router.get(
  '/:id',
  authenticateToken,
  checkPermission('view_pharmacies'),
  validate(mongoIdSchema, 'params'),
  getPharmacyById
);

/**
 * @route   PUT /api/pharmacies/:id
 * @desc    Mettre à jour une pharmacie
 * @access  Private (admin, manager)
 */
router.put(
  '/:id',
  authenticateToken,
  checkPermission('manage_pharmacies'),
  validate(mongoIdSchema, 'params'),
  validate(updatePharmacySchema),
  updatePharmacy
);

/**
 * @route   DELETE /api/pharmacies/:id
 * @desc    Supprimer une pharmacie (soft delete)
 * @access  Private (admin)
 */
router.delete(
  '/:id',
  authenticateToken,
  checkPermission('manage_pharmacies'),
  validate(mongoIdSchema, 'params'),
  deletePharmacy
);

/**
 * @route   PATCH /api/pharmacies/:id/assign-user
 * @desc    Assigner un utilisateur (pharmacist) à une pharmacie
 * @access  Private (admin, manager)
 */
router.patch(
  '/:id/assign-user',
  authenticateToken,
  checkPermission('manage_pharmacies'),
  validate(mongoIdSchema, 'params'),
  validate(assignUserSchema),
  assignUserToPharmacy
);

/**
 * @route   PATCH /api/pharmacies/:id/remove-user
 * @desc    Retirer un utilisateur d'une pharmacie
 * @access  Private (admin, manager)
 */
router.patch(
  '/:id/remove-user',
  authenticateToken,
  checkPermission('manage_pharmacies'),
  validate(mongoIdSchema, 'params'),
  validate(removeUserSchema),
  removeUserFromPharmacy
);

/**
 * @route   GET /api/pharmacies/:id/status
 * @desc    Vérifier si une pharmacie est ouverte
 * @access  Public (tous les utilisateurs authentifiés)
 */
router.get(
  '/:id/status',
  authenticateToken,
  checkPermission('view_pharmacies'),
  validate(mongoIdSchema, 'params'),
  checkPharmacyStatus
);

export default router;
