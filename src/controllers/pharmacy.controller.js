import { logger } from '../config/logger.js';
import { sendError } from '../helpers/response.helper.js';
import * as pharmacyService from '../services/pharmacy.service.js';

export const createPharmacy = async (req, res) => {
  try {
    const pharmacy = await pharmacyService.createPharmacy(req.body);
    logger.info(`Pharmacie créée: ${pharmacy._id}`, { pharmacyId: pharmacy._id, createdBy: req.user._id });
    res.status(201).json({ success: true, message: 'Pharmacie créée avec succès', data: pharmacy });
  } catch (error) {
    logger.error('Erreur création pharmacie:', error);
    return sendError(res, error.status || 500, error.message || 'Erreur lors de la création de la pharmacie', error);
  }
};

export const getPharmacies = async (req, res) => {
  try {
    const result = await pharmacyService.getPharmacies(req.query);
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
    logger.error('Erreur récupération pharmacies:', error);
    return sendError(res, error.status || 500, error.message || 'Erreur lors de la récupération des pharmacies', error);
  }
};

export const getNearbyPharmacies = async (req, res) => {
  try {
    if (!req.query.latitude || !req.query.longitude) return sendError(res, 400, 'Latitude et longitude sont requises');
    const pharmacies = await pharmacyService.getNearbyPharmacies(req.query.latitude, req.query.longitude, req.query.maxDistance);
    res.json({ success: true, data: pharmacies, count: pharmacies.length });
  } catch (error) {
    logger.error('Erreur recherche pharmacies à proximité:', error);
    return sendError(res, error.status || 500, error.message || 'Erreur lors de la recherche des pharmacies à proximité', error);
  }
};

export const getPharmacyById = async (req, res) => {
  try {
    const pharmacy = await pharmacyService.getPharmacyById(req.params.id);
    res.json({ success: true, data: pharmacy });
  } catch (error) {
    logger.error('Erreur récupération pharmacie:', error);
    return sendError(res, error.status || 500, error.message || 'Erreur lors de la récupération de la pharmacie', error);
  }
};

export const updatePharmacy = async (req, res) => {
  try {
    const pharmacy = await pharmacyService.updatePharmacy(req.params.id, req.body);
    logger.info(`Pharmacie mise à jour: ${pharmacy._id}`, { pharmacyId: pharmacy._id, updatedBy: req.user._id });
    res.json({ success: true, message: 'Pharmacie mise à jour avec succès', data: pharmacy });
  } catch (error) {
    logger.error('Erreur mise à jour pharmacie:', error);
    return sendError(res, error.status || 500, error.message || 'Erreur lors de la mise à jour de la pharmacie', error);
  }
};

export const deletePharmacy = async (req, res) => {
  try {
    const pharmacyId = await pharmacyService.deletePharmacy(req.params.id);
    logger.info(`Pharmacie désactivée: ${pharmacyId}`, { pharmacyId, deletedBy: req.user._id });
    res.json({ success: true, message: 'Pharmacie désactivée avec succès' });
  } catch (error) {
    logger.error('Erreur suppression pharmacie:', error);
    return sendError(res, error.status || 500, error.message || 'Erreur lors de la suppression de la pharmacie', error);
  }
};

export const assignUserToPharmacy = async (req, res) => {
  try {
    const pharmacy = await pharmacyService.assignUserToPharmacy(req.params.id, req.body.userId);
    logger.info(`Utilisateur ${req.body.userId} assigné à la pharmacie ${pharmacy._id}`, { pharmacyId: pharmacy._id, userId: req.body.userId, assignedBy: req.user._id });
    res.json({ success: true, message: 'Utilisateur assigné avec succès', data: pharmacy });
  } catch (error) {
    logger.error('Erreur assignation utilisateur:', error);
    return sendError(res, error.status || 500, error.message || 'Erreur lors de l\'assignation de l\'utilisateur', error);
  }
};

export const removeUserFromPharmacy = async (req, res) => {
  try {
    const pharmacy = await pharmacyService.removeUserFromPharmacy(req.params.id, req.body.userId);
    logger.info(`Utilisateur ${req.body.userId} retiré de la pharmacie ${pharmacy._id}`, { pharmacyId: pharmacy._id, userId: req.body.userId, removedBy: req.user._id });
    res.json({ success: true, message: 'Utilisateur retiré avec succès', data: pharmacy });
  } catch (error) {
    logger.error('Erreur retrait utilisateur:', error);
    return sendError(res, error.status || 500, error.message || 'Erreur lors du retrait de l\'utilisateur', error);
  }
};

export const checkPharmacyStatus = async (req, res) => {
  try {
    const data = await pharmacyService.checkPharmacyStatus(req.params.id);
    res.json({ success: true, data });
  } catch (error) {
    logger.error('Erreur vérification statut pharmacie:', error);
    return sendError(res, error.status || 500, error.message || 'Erreur lors de la vérification du statut', error);
  }
};

export const getPharmacyStats = async (req, res) => {
  try {
    const data = await pharmacyService.getPharmacyStats();
    res.json({ success: true, data });
  } catch (error) {
    logger.error('Erreur statistiques pharmacies:', error);
    return sendError(res, error.status || 500, error.message || 'Erreur lors de la récupération des statistiques', error);
  }
};
