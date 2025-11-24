import { logger } from '../config/logger.js';
import { sendError } from '../helpers/response.helper.js';
import * as documentService from '../services/document.service.js';

export const uploadDocument = async (req, res) => {
  try {
    if (!req.file) return sendError(res, 400, 'Aucun fichier fourni');
    const document = await documentService.uploadDocument(req.file, req.body, req.user._id, req.ip);
    logger.info(`Document uploadé: ${document._id}`, { documentId: document._id, uploadedBy: req.user._id });
    res.status(201).json({ success: true, message: 'Document uploadé avec succès', data: document });
  } catch (error) {
    logger.error('Erreur upload document:', error);
    return sendError(res, error.status || 500, error.message || 'Erreur lors de l\'upload du document', error);
  }
};

export const getDocuments = async (req, res) => {
  try {
    const result = await documentService.getDocuments(req.query, req.user._id, req.user.role);
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
    logger.error('Erreur récupération documents:', error);
    return sendError(res, error.status || 500, error.message || 'Erreur lors de la récupération des documents', error);
  }
};

export const getDocumentById = async (req, res) => {
  try {
    const document = await documentService.getDocumentById(req.params.id, req.user._id, req.user.role, req.ip);
    res.json({ success: true, data: document });
  } catch (error) {
    logger.error('Erreur récupération document:', error);
    return sendError(res, error.status || 500, error.message || 'Erreur lors de la récupération du document', error);
  }
};

export const updateDocument = async (req, res) => {
  try {
    const document = await documentService.updateDocument(req.params.id, req.body, req.user._id, req.user.role, req.ip);
    logger.info(`Document mis à jour: ${document._id}`, { documentId: document._id, updatedBy: req.user._id });
    res.json({ success: true, message: 'Document mis à jour avec succès', data: document });
  } catch (error) {
    logger.error('Erreur mise à jour document:', error);
    return sendError(res, error.status || 500, error.message || 'Erreur lors de la mise à jour du document', error);
  }
};

export const deleteDocument = async (req, res) => {
  try {
    const documentId = await documentService.deleteDocument(req.params.id, req.user._id, req.user.role);
    logger.info(`Document supprimé: ${documentId}`, { documentId, deletedBy: req.user._id });
    res.json({ success: true, message: 'Document supprimé avec succès' });
  } catch (error) {
    logger.error('Erreur suppression document:', error);
    return sendError(res, error.status || 500, error.message || 'Erreur lors de la suppression du document', error);
  }
};

export const getDownloadUrl = async (req, res) => {
  try {
    const data = await documentService.getDownloadUrl(req.params.id, req.query.versionIndex, req.user._id, req.user.role, req.ip);
    logger.info(`URL téléchargement générée pour le document: ${req.params.id}`, { documentId: req.params.id, requestedBy: req.user._id });
    res.json({ success: true, data });
  } catch (error) {
    logger.error('Erreur génération URL téléchargement:', error);
    return sendError(res, error.status || 500, error.message || 'Erreur lors de la génération de l\'URL', error);
  }
};

export const createNewVersion = async (req, res) => {
  try {
    if (!req.file) return sendError(res, 400, 'Aucun fichier fourni');
    const document = await documentService.createNewVersion(req.params.id, req.file, req.body.versionNotes, req.user._id, req.user.role);
    logger.info(`Nouvelle version créée pour le document: ${document._id}`, { documentId: document._id, version: document.versions.length, uploadedBy: req.user._id });
    res.json({ success: true, message: 'Nouvelle version créée avec succès', data: document });
  } catch (error) {
    logger.error('Erreur création version:', error);
    return sendError(res, error.status || 500, error.message || 'Erreur lors de la création de la version', error);
  }
};

export const shareDocument = async (req, res) => {
  try {
    const { sharedWith, accessLevel, expiresAt } = req.body;
    const document = await documentService.shareDocument(req.params.id, sharedWith, accessLevel, expiresAt, req.user._id, req.user.role);
    logger.info(`Document partagé: ${document._id}`, { documentId: document._id, sharedWith, sharedBy: req.user._id });
    res.json({ success: true, message: 'Document partagé avec succès', data: document });
  } catch (error) {
    logger.error('Erreur partage document:', error);
    return sendError(res, error.status || 500, error.message || 'Erreur lors du partage du document', error);
  }
};

export const revokeShare = async (req, res) => {
  try {
    const document = await documentService.revokeShare(req.params.id, req.body.userId, req.user._id, req.user.role);
    logger.info(`Partage révoqué pour le document: ${document._id}`, { documentId: document._id, userId: req.body.userId, revokedBy: req.user._id });
    res.json({ success: true, message: 'Partage révoqué avec succès', data: document });
  } catch (error) {
    logger.error('Erreur révocation partage:', error);
    return sendError(res, error.status || 500, error.message || 'Erreur lors de la révocation du partage', error);
  }
};

export const getAccessLog = async (req, res) => {
  try {
    const data = await documentService.getAccessLog(req.params.id, req.user._id, req.user.role);
    res.json({ success: true, data });
  } catch (error) {
    logger.error('Erreur récupération historique:', error);
    return sendError(res, error.status || 500, error.message || 'Erreur lors de la récupération de l\'historique', error);
  }
};

export const getDocumentStats = async (req, res) => {
  try {
    const data = await documentService.getDocumentStats();
    res.json({ success: true, data });
  } catch (error) {
    logger.error('Erreur statistiques documents:', error);
    return sendError(res, error.status || 500, error.message || 'Erreur lors de la récupération des statistiques', error);
  }
};
