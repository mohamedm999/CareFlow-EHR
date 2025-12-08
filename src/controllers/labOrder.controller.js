import { logger } from '../config/logger.js';
import { sendError } from '../helpers/response.helper.js';
import * as labOrderService from '../services/labOrder.service.js';

export const createLabOrder = async (req, res) => {
  try {
    const labOrder = await labOrderService.createLabOrder(req.body, req.user._id);
    logger.info(`Ordre de laboratoire créé: ${labOrder._id}`, { orderId: labOrder._id, orderNumber: labOrder.orderNumber, createdBy: req.user._id });
    res.status(201).json({ success: true, message: 'Ordre de laboratoire créé avec succès', data: labOrder });
  } catch (error) {
    logger.error('Erreur création ordre laboratoire:', error);
    return sendError(res, error.status || 500, error.message || 'Erreur lors de la création de l\'ordre', error);
  }
};

export const getLabOrders = async (req, res) => {
  try {
    const result = await labOrderService.getLabOrders(req.query, req.user._id, req.user.role);
    res.json({
      success: true,
      data: result.docs,
      pagination: {
        total: result.totalDocs,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages,
        hasNextPage: result.hasNextPage,
        hasPrevPage: result.hasPrevPage
      }
    });
  } catch (error) {
    logger.error('Erreur récupération ordres laboratoire:', error);
    return sendError(res, error.status || 500, error.message || 'Erreur lors de la récupération des ordres', error);
  }
};

export const getLabOrderById = async (req, res) => {
  try {
    const userPermissions = req.user.role?.permissions || [];
    const labOrder = await labOrderService.getLabOrderById(req.params.id, req.user._id, req.user.role.name, userPermissions);
    res.json({ success: true, data: labOrder });
  } catch (error) {
    logger.error('Erreur récupération ordre laboratoire:', error);
    return sendError(res, error.status || 500, error.message || 'Erreur lors de la récupération de l\'ordre', error);
  }
};

export const updateLabOrder = async (req, res) => {
  try {
    const labOrder = await labOrderService.updateLabOrder(req.params.id, req.body);
    logger.info(`Ordre de laboratoire mis à jour: ${labOrder._id}`, { orderId: labOrder._id, updatedBy: req.user._id });
    res.json({ success: true, message: 'Ordre mis à jour avec succès', data: labOrder });
  } catch (error) {
    logger.error('Erreur mise à jour ordre laboratoire:', error);
    return sendError(res, error.status || 500, error.message || 'Erreur lors de la mise à jour de l\'ordre', error);
  }
};

export const collectSpecimen = async (req, res) => {
  try {
    const labOrder = await labOrderService.collectSpecimen(req.params.id, req.body, req.user._id);
    logger.info(`Spécimen collecté pour l'ordre: ${labOrder._id}`, { orderId: labOrder._id, collectedBy: req.user._id });
    res.json({ success: true, message: 'Spécimen collecté avec succès', data: labOrder });
  } catch (error) {
    logger.error('Erreur collecte spécimen:', error);
    return sendError(res, error.status || 500, error.message || 'Erreur lors de la collecte du spécimen', error);
  }
};

export const receiveSpecimen = async (req, res) => {
  try {
    const labOrder = await labOrderService.receiveSpecimen(req.params.id, req.body, req.user._id);
    logger.info(`Spécimen reçu au laboratoire: ${labOrder._id}`, { orderId: labOrder._id, receivedBy: req.user._id });
    res.json({ success: true, message: 'Spécimen reçu au laboratoire avec succès', data: labOrder });
  } catch (error) {
    logger.error('Erreur réception spécimen:', error);
    return sendError(res, error.status || 500, error.message || 'Erreur lors de la réception du spécimen', error);
  }
};

export const updateLabOrderStatus = async (req, res) => {
  try {
    const labOrder = await labOrderService.updateLabOrderStatus(req.params.id, req.body.status, req.body.statusNotes);
    logger.info(`Statut ordre laboratoire mis à jour: ${labOrder._id}`, { orderId: labOrder._id, newStatus: req.body.status, updatedBy: req.user._id });
    res.json({ success: true, message: 'Statut mis à jour avec succès', data: labOrder });
  } catch (error) {
    logger.error('Erreur mise à jour statut:', error);
    return sendError(res, error.status || 500, error.message || 'Erreur lors de la mise à jour du statut', error);
  }
};

export const cancelLabOrder = async (req, res) => {
  try {
    const labOrder = await labOrderService.cancelLabOrder(req.params.id, req.body.cancellationReason, req.user._id);
    logger.info(`Ordre de laboratoire annulé: ${labOrder._id}`, { orderId: labOrder._id, reason: req.body.cancellationReason, cancelledBy: req.user._id });
    res.json({ success: true, message: 'Ordre annulé avec succès', data: labOrder });
  } catch (error) {
    logger.error('Erreur annulation ordre:', error);
    return sendError(res, error.status || 500, error.message || 'Erreur lors de l\'annulation de l\'ordre', error);
  }
};

export const getLabOrderStats = async (req, res) => {
  try {
    const data = await labOrderService.getLabOrderStats();
    res.json({ success: true, data });
  } catch (error) {
    logger.error('Erreur statistiques ordres laboratoire:', error);
    return sendError(res, error.status || 500, error.message || 'Erreur lors de la récupération des statistiques', error);
  }
};
