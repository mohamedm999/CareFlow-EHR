import { logger } from '../config/logger.js';
import { sendError } from '../helpers/response.helper.js';
import * as prescriptionService from '../services/prescription.service.js';

export const createPrescription = async (req, res) => {
  try {
    const prescription = await prescriptionService.createPrescription(req.body, req.user._id);
    logger.info(`Prescription créée: ${prescription.prescriptionNumber} par ${req.user.email}`);
    res.status(201).json({ success: true, message: 'Prescription créée avec succès', data: prescription });
  } catch (error) {
    logger.error('Erreur création prescription:', error);
    return sendError(res, error.status || 500, error.message || 'Erreur lors de la création de la prescription', error);
  }
};

export const getPrescriptions = async (req, res) => {
  try {
    const prescriptions = await prescriptionService.getPrescriptions(req.query, req.user._id, req.user.role.name);
    res.status(200).json({ success: true, data: prescriptions });
  } catch (error) {
    logger.error('Erreur récupération prescriptions:', error);
    return sendError(res, error.status || 500, error.message || 'Erreur lors de la récupération des prescriptions', error);
  }
};

export const getPrescriptionById = async (req, res) => {
  try {
    const userPermissions = req.user.role?.permissions || [];
    const prescription = await prescriptionService.getPrescriptionById(req.params.id, req.user._id, req.user.role.name, userPermissions);
    res.status(200).json({ success: true, data: prescription });
  } catch (error) {
    logger.error('Erreur récupération prescription:', error);
    return sendError(res, error.status || 500, error.message || 'Erreur lors de la récupération de la prescription', error);
  }
};

export const updatePrescription = async (req, res) => {
  try {
    const prescription = await prescriptionService.updatePrescription(req.params.id, req.body, req.user._id, req.user.role.name);
    logger.info(`Prescription mise à jour: ${prescription.prescriptionNumber} par ${req.user.email}`);
    res.status(200).json({ success: true, message: 'Prescription mise à jour avec succès', data: prescription });
  } catch (error) {
    logger.error('Erreur mise à jour prescription:', error);
    return sendError(res, error.status || 500, error.message || 'Erreur lors de la mise à jour de la prescription', error);
  }
};

export const signPrescription = async (req, res) => {
  try {
    const prescription = await prescriptionService.signPrescription(req.params.id, req.body.digitalSignature, req.user._id, req.user.role.name);
    logger.info(`Prescription signée: ${prescription.prescriptionNumber} par ${req.user.email}`);
    res.status(200).json({ success: true, message: 'Prescription signée avec succès', data: prescription });
  } catch (error) {
    logger.error('Erreur signature prescription:', error);
    return sendError(res, error.status || 500, error.message || 'Erreur lors de la signature de la prescription', error);
  }
};

export const sendToPharmacy = async (req, res) => {
  try {
    const prescription = await prescriptionService.sendToPharmacy(req.params.id, req.body.pharmacyId);
    logger.info(`Prescription ${prescription.prescriptionNumber} envoyée à la pharmacie`);
    res.status(200).json({ success: true, message: 'Prescription envoyée à la pharmacie avec succès', data: prescription });
  } catch (error) {
    logger.error('Erreur envoi pharmacie:', error);
    return sendError(res, error.status || 500, error.message || 'Erreur lors de l\'envoi à la pharmacie', error);
  }
};

export const dispenseMedication = async (req, res) => {
  try {
    const prescription = await prescriptionService.dispenseMedication(req.params.id, req.body, req.user._id);
    logger.info(`Médicament dispensé pour prescription: ${prescription.prescriptionNumber}`);
    res.status(200).json({ success: true, message: 'Médicament dispensé avec succès', data: prescription });
  } catch (error) {
    logger.error('Erreur dispensation:', error);
    return sendError(res, error.status || 500, error.message || 'Erreur lors de la dispensation', error);
  }
};

export const cancelPrescription = async (req, res) => {
  try {
    const prescription = await prescriptionService.cancelPrescription(req.params.id, req.body.cancellationReason, req.user._id, req.user.role.name);
    logger.info(`Prescription annulée: ${prescription.prescriptionNumber} par ${req.user.email}`);
    res.status(200).json({ success: true, message: 'Prescription annulée avec succès', data: prescription });
  } catch (error) {
    logger.error('Erreur annulation prescription:', error);
    return sendError(res, error.status || 500, error.message || 'Erreur lors de l\'annulation de la prescription', error);
  }
};

export const renewPrescription = async (req, res) => {
  try {
    const renewedPrescription = await prescriptionService.renewPrescription(req.params.id, req.body, req.user._id, req.user.role.name);
    logger.info(`Prescription renouvelée: ${renewedPrescription.prescriptionNumber}`);
    res.status(201).json({ success: true, message: 'Prescription renouvelée avec succès', data: renewedPrescription });
  } catch (error) {
    logger.error('Erreur renouvellement prescription:', error);
    return sendError(res, error.status || 500, error.message || 'Erreur lors du renouvellement de la prescription', error);
  }
};

export const getPrescriptionsByPatient = async (req, res) => {
  try {
    const prescriptions = await prescriptionService.getPrescriptionsByPatient(req.params.patientId, req.query, req.user._id, req.user.role.name);
    res.status(200).json({ success: true, data: prescriptions });
  } catch (error) {
    logger.error('Erreur récupération prescriptions patient:', error);
    return sendError(res, error.status || 500, error.message || 'Erreur lors de la récupération des prescriptions', error);
  }
};

export const getPrescriptionsByPharmacy = async (req, res) => {
  try {
    const prescriptions = await prescriptionService.getPrescriptionsByPharmacy(req.params.pharmacyId, req.query, req.user._id, req.user.role.name);
    res.status(200).json({ success: true, data: prescriptions });
  } catch (error) {
    logger.error('Erreur récupération prescriptions pharmacie:', error);
    return sendError(res, error.status || 500, error.message || 'Erreur lors de la récupération des prescriptions', error);
  }
};

export const getPrescriptionStats = async (req, res) => {
  try {
    const stats = await prescriptionService.getPrescriptionStats(req.query, req.user._id, req.user.role.name);
    res.status(200).json({ success: true, data: stats });
  } catch (error) {
    logger.error('Erreur statistiques prescriptions:', error);
    return sendError(res, error.status || 500, error.message || 'Erreur lors de la récupération des statistiques', error);
  }
};
