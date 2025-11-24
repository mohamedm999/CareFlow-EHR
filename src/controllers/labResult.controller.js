import { logger } from '../config/logger.js';
import { sendError } from '../helpers/response.helper.js';
import * as labResultService from '../services/labResult.service.js';

export const createLabResult = async (req, res) => {
  try {
    const labResult = await labResultService.createLabResult(req.body, req.user._id);
    logger.info(`Résultat de laboratoire créé: ${labResult._id}`, { resultId: labResult._id, createdBy: req.user._id });
    res.status(201).json({ success: true, message: 'Résultat de laboratoire créé avec succès', data: labResult });
  } catch (error) {
    logger.error('Erreur création résultat laboratoire:', error);
    return sendError(res, error.status || 500, error.message || 'Erreur lors de la création du résultat', error);
  }
};

export const getLabResults = async (req, res) => {
  try {
    const result = await labResultService.getLabResults(req.query, req.user._id, req.user.role);
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
    logger.error('Erreur récupération résultats laboratoire:', error);
    return sendError(res, error.status || 500, error.message || 'Erreur lors de la récupération des résultats', error);
  }
};

export const getLabResultById = async (req, res) => {
  try {
    const labResult = await labResultService.getLabResultById(req.params.id, req.user._id, req.user.role);
    res.json({ success: true, data: labResult });
  } catch (error) {
    logger.error('Erreur récupération résultat laboratoire:', error);
    return sendError(res, error.status || 500, error.message || 'Erreur lors de la récupération du résultat', error);
  }
};

export const updateLabResult = async (req, res) => {
  try {
    const labResult = await labResultService.updateLabResult(req.params.id, req.body);
    logger.info(`Résultat de laboratoire mis à jour: ${labResult._id}`, { resultId: labResult._id, updatedBy: req.user._id });
    res.json({ success: true, message: 'Résultat mis à jour avec succès', data: labResult });
  } catch (error) {
    logger.error('Erreur mise à jour résultat laboratoire:', error);
    return sendError(res, error.status || 500, error.message || 'Erreur lors de la mise à jour du résultat', error);
  }
};

export const validateLabResult = async (req, res) => {
  try {
    const labResult = await labResultService.validateLabResult(req.params.id, req.body, req.user._id);
    logger.info(`Résultat de laboratoire validé: ${labResult._id}`, { resultId: labResult._id, validatedBy: req.user._id });
    res.json({ success: true, message: 'Résultat validé avec succès', data: labResult });
  } catch (error) {
    logger.error('Erreur validation résultat:', error);
    return sendError(res, error.status || 500, error.message || 'Erreur lors de la validation du résultat', error);
  }
};

export const addRevision = async (req, res) => {
  try {
    const labResult = await labResultService.addRevision(req.params.id, req.body, req.user._id);
    logger.info(`Révision ajoutée au résultat: ${labResult._id}`, { resultId: labResult._id, revisedBy: req.user._id });
    res.json({ success: true, message: 'Révision ajoutée avec succès', data: labResult });
  } catch (error) {
    logger.error('Erreur ajout révision:', error);
    return sendError(res, error.status || 500, error.message || 'Erreur lors de l\'ajout de la révision', error);
  }
};

export const uploadPdfReport = async (req, res) => {
  try {
    if (!req.file) return sendError(res, 400, 'Aucun fichier fourni');
    const reportDocument = await labResultService.uploadPdfReport(req.params.id, req.file, req.user._id);
    logger.info(`Rapport PDF uploadé pour le résultat: ${req.params.id}`, { resultId: req.params.id, uploadedBy: req.user._id });
    res.json({ success: true, message: 'Rapport PDF uploadé avec succès', data: { reportDocument } });
  } catch (error) {
    logger.error('Erreur upload PDF:', error);
    return sendError(res, error.status || 500, error.message || 'Erreur lors de l\'upload du rapport', error);
  }
};

export const getReportDownloadUrl = async (req, res) => {
  try {
    const data = await labResultService.getReportDownloadUrl(req.params.id, req.user._id, req.user.role);
    logger.info(`URL téléchargement générée pour le résultat: ${req.params.id}`, { resultId: req.params.id, requestedBy: req.user._id });
    res.json({ success: true, data });
  } catch (error) {
    logger.error('Erreur génération URL téléchargement:', error);
    return sendError(res, error.status || 500, error.message || 'Erreur lors de la génération de l\'URL', error);
  }
};

export const getAbnormalResults = async (req, res) => {
  try {
    const data = await labResultService.getAbnormalResults(req.params.id);
    res.json({ success: true, data });
  } catch (error) {
    logger.error('Erreur récupération résultats anormaux:', error);
    return sendError(res, error.status || 500, error.message || 'Erreur lors de la récupération des résultats anormaux', error);
  }
};

export const getLabResultStats = async (req, res) => {
  try {
    const data = await labResultService.getLabResultStats();
    res.json({ success: true, data });
  } catch (error) {
    logger.error('Erreur statistiques résultats laboratoire:', error);
    return sendError(res, error.status || 500, error.message || 'Erreur lors de la récupération des statistiques', error);
  }
};
