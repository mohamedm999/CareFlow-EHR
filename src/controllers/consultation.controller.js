import { logger } from '../config/logger.js';
import { sendError } from '../helpers/response.helper.js';
import * as consultationService from '../services/consultation.service.js';

export const createConsultation = async (req, res) => {
  try {
    const consultation = await consultationService.createConsultation(req.body, req.user._id);
    logger.info(`Consultation créée: ${consultation._id} par ${req.user.email}`);
    res.status(201).json({ success: true, message: 'Consultation créée avec succès', data: consultation });
  } catch (error) {
    logger.error('Erreur création consultation:', error);
    return sendError(res, error.status || 500, error.message || 'Erreur lors de la création de la consultation', error);
  }
};

export const getConsultations = async (req, res) => {
  try {
    const consultations = await consultationService.getConsultations(req.query, req.user);
    res.json({ success: true, data: consultations });
  } catch (error) {
    logger.error('Erreur récupération consultations:', error);
    return sendError(res, error.status || 500, error.message || 'Erreur lors de la récupération des consultations', error);
  }
};

export const getConsultationById = async (req, res) => {
  try {
    const consultation = await consultationService.getConsultationById(req.params.id, req.user);
    res.json({ success: true, data: consultation });
  } catch (error) {
    logger.error('Erreur récupération consultation:', error);
    return sendError(res, error.status || 500, error.message || 'Erreur lors de la récupération de la consultation', error);
  }
};

export const updateConsultation = async (req, res) => {
  try {
    const consultation = await consultationService.updateConsultation(req.params.id, req.body, req.user._id, req.user.role.name);
    logger.info(`Consultation mise à jour: ${consultation._id} par ${req.user.email}`);
    res.json({ success: true, message: 'Consultation mise à jour avec succès', data: consultation });
  } catch (error) {
    logger.error('Erreur mise à jour consultation:', error);
    return sendError(res, error.status || 500, error.message || 'Erreur lors de la mise à jour de la consultation', error);
  }
};

export const deleteConsultation = async (req, res) => {
  try {
    const id = await consultationService.deleteConsultation(req.params.id, req.user._id, req.user.role.name);
    logger.info(`Consultation supprimée: ${id} par ${req.user.email}`);
    res.json({ success: true, message: 'Consultation supprimée avec succès' });
  } catch (error) {
    logger.error('Erreur suppression consultation:', error);
    return sendError(res, error.status || 500, error.message || 'Erreur lors de la suppression de la consultation', error);
  }
};

export const getConsultationsByPatient = async (req, res) => {
  try {
    const consultations = await consultationService.getConsultationsByPatient(req.params.patientId, req.query, req.user);
    res.json({ success: true, data: consultations });
  } catch (error) {
    logger.error('Erreur récupération consultations patient:', error);
    return sendError(res, error.status || 500, error.message || 'Erreur lors de la récupération des consultations', error);
  }
};

export const updateVitalSigns = async (req, res) => {
  try {
    const consultation = await consultationService.updateVitalSigns(req.params.id, req.body.vitalSigns);
    logger.info(`Constantes vitales mises à jour pour consultation: ${req.params.id}`);
    res.json({ success: true, message: 'Constantes vitales mises à jour avec succès', data: consultation });
  } catch (error) {
    logger.error('Erreur mise à jour constantes vitales:', error);
    return sendError(res, error.status || 500, error.message || 'Erreur lors de la mise à jour des constantes vitales', error);
  }
};

export const updateConsultationStatus = async (req, res) => {
  try {
    const consultation = await consultationService.updateConsultationStatus(req.params.id, req.body.status, req.user._id);
    logger.info(`Statut de consultation mis à jour: ${req.params.id} -> ${req.body.status}`);
    res.json({ success: true, message: 'Statut mis à jour avec succès', data: consultation });
  } catch (error) {
    logger.error('Erreur mise à jour statut:', error);
    return sendError(res, error.status || 500, error.message || 'Erreur lors de la mise à jour du statut', error);
  }
};

export const getConsultationStats = async (req, res) => {
  try {
    const stats = await consultationService.getConsultationStats(req.query, req.user);
    res.json({ success: true, data: stats });
  } catch (error) {
    logger.error('Erreur statistiques consultations:', error);
    return sendError(res, error.status || 500, error.message || 'Erreur lors de la récupération des statistiques', error);
  }
};
