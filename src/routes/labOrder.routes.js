import express from 'express';
import {
  createLabOrder,
  getLabOrders,
  getLabOrderById,
  updateLabOrder,
  collectSpecimen,
  receiveSpecimen,
  updateLabOrderStatus,
  cancelLabOrder,
  getLabOrderStats
} from '../controllers/labOrder.controller.js';
import { authenticateToken } from '../middleware/auth.js';
import { checkPermission } from '../middleware/checkPermission.js';
import { validate } from '../middleware/validator.js';
import {
  createLabOrderSchema,
  updateLabOrderSchema,
  collectSpecimenSchema,
  receiveSpecimenSchema,
  updateStatusSchema,
  cancelLabOrderSchema,
  searchLabOrdersSchema,
  mongoIdSchema
} from '../validation/labOrder.validation.js';

const router = express.Router();

/**
 * @route   POST /api/lab-orders
 * @desc    Créer un nouvel ordre de laboratoire
 * @access  Private (doctor, admin)
 */
router.post(
  '/',
  authenticateToken,
  checkPermission('create_lab_orders'),
  validate(createLabOrderSchema),
  createLabOrder
);

/**
 * @route   GET /api/lab-orders
 * @desc    Obtenir tous les ordres avec filtres et pagination
 * @access  Private (tous les utilisateurs authentifiés)
 */
router.get(
  '/',
  authenticateToken,
  checkPermission('view_lab_orders'),
  validate(searchLabOrdersSchema, 'query'),
  getLabOrders
);

/**
 * @route   GET /api/lab-orders/stats/overview
 * @desc    Obtenir les statistiques des ordres
 * @access  Private (admin, manager, lab_technician)
 */
router.get(
  '/stats/overview',
  authenticateToken,
  checkPermission('view_lab_orders'),
  getLabOrderStats
);

/**
 * @route   GET /api/lab-orders/:id
 * @desc    Obtenir un ordre par ID
 * @access  Private (tous les utilisateurs authentifiés)
 */
router.get(
  '/:id',
  authenticateToken,
  checkPermission('view_lab_orders'),
  validate(mongoIdSchema, 'params'),
  getLabOrderById
);

/**
 * @route   PUT /api/lab-orders/:id
 * @desc    Mettre à jour un ordre
 * @access  Private (doctor, admin)
 */
router.put(
  '/:id',
  authenticateToken,
  checkPermission('edit_lab_orders'),
  validate(mongoIdSchema, 'params'),
  validate(updateLabOrderSchema),
  updateLabOrder
);

/**
 * @route   PATCH /api/lab-orders/:id/collect-specimen
 * @desc    Collecter un spécimen
 * @access  Private (nurse, lab_technician, doctor)
 */
router.patch(
  '/:id/collect-specimen',
  authenticateToken,
  checkPermission('collect_specimens'),
  validate(mongoIdSchema, 'params'),
  validate(collectSpecimenSchema),
  collectSpecimen
);

/**
 * @route   PATCH /api/lab-orders/:id/receive-specimen
 * @desc    Recevoir un spécimen au laboratoire
 * @access  Private (lab_technician)
 */
router.patch(
  '/:id/receive-specimen',
  authenticateToken,
  checkPermission('receive_specimens'),
  validate(mongoIdSchema, 'params'),
  validate(receiveSpecimenSchema),
  receiveSpecimen
);

/**
 * @route   PATCH /api/lab-orders/:id/status
 * @desc    Mettre à jour le statut d'un ordre
 * @access  Private (lab_technician, doctor)
 */
router.patch(
  '/:id/status',
  authenticateToken,
  checkPermission('update_lab_order_status'),
  validate(mongoIdSchema, 'params'),
  validate(updateStatusSchema),
  updateLabOrderStatus
);

/**
 * @route   PATCH /api/lab-orders/:id/cancel
 * @desc    Annuler un ordre de laboratoire
 * @access  Private (doctor, admin)
 */
router.patch(
  '/:id/cancel',
  authenticateToken,
  checkPermission('cancel_lab_orders'),
  validate(mongoIdSchema, 'params'),
  validate(cancelLabOrderSchema),
  cancelLabOrder
);

export default router;
