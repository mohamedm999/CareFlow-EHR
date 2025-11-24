import { logger } from '../config/logger.js';
import { sendError } from '../helpers/response.helper.js';
import * as patientService from '../services/patient.service.js';

export const createPatient = async (req, res) => {
  try {
    const patient = await patientService.createPatient(req.body);
    logger.info(`Patient profile created: ${patient._id}`);
    res.status(201).json({ success: true, message: 'Patient profile created successfully', patient });
  } catch (error) {
    logger.error('Create patient error:', error);
    return sendError(res, error.status || 500, error.message || 'Server error creating patient', error);
  }
};

export const getPatients = async (req, res) => {
  try {
    const result = await patientService.getPatients(req.query);
    if (!result) throw { status: 500, message: 'Failed to fetch patients' };
    const { patients, total, pages } = result;
    res.json({ success: true, patients, pagination: { page: parseInt(req.query.page || 1), pages, total } });
  } catch (error) {
    logger.error('Get patients error:', error);
    return sendError(res, error.status || 500, error.message || 'Server error fetching patients', error);
  }
};

export const getPatient = async (req, res) => {
  try {
    if (!req.params.id) throw { status: 400, message: 'Patient ID is required' };
    const patient = await patientService.getPatientById(req.params.id, req.user.userId, req.user.role.name);
    if (!patient) throw { status: 404, message: 'Patient not found' };
    res.json({ success: true, patient });
  } catch (error) {
    logger.error('Get patient error:', error);
    return sendError(res, error.status || 500, error.message || 'Server error fetching patient', error);
  }
};

export const updatePatient = async (req, res) => {
  try {
    const patient = await patientService.updatePatient(req.params.id, req.body, req.user.userId, req.user.role.name);
    logger.info(`Patient ${req.params.id} updated by user ${req.user.userId}`);
    res.json({ success: true, message: 'Patient updated successfully', patient });
  } catch (error) {
    logger.error('Update patient error:', error);
    return sendError(res, error.status || 500, error.message || 'Server error updating patient', error);
  }
};

export const addAllergy = async (req, res) => {
  try {
    const patient = await patientService.addAllergy(req.params.id, req.body);
    res.json({ success: true, message: 'Allergy added successfully', patient });
  } catch (error) {
    logger.error('Add allergy error:', error);
    return sendError(res, error.status || 500, error.message || 'Server error adding allergy', error);
  }
};

export const addMedicalHistory = async (req, res) => {
  try {
    const patient = await patientService.addMedicalHistory(req.params.id, req.body);
    res.json({ success: true, message: 'Medical history added successfully', patient });
  } catch (error) {
    logger.error('Add medical history error:', error);
    return sendError(res, error.status || 500, error.message || 'Server error adding medical history', error);
  }
};

export const getPatientStats = async (req, res) => {
  try {
    const stats = await patientService.getPatientStats();
    res.json({ success: true, stats });
  } catch (error) {
    logger.error('Get patient stats error:', error);
    return sendError(res, error.status || 500, error.message || 'Server error fetching patient statistics', error);
  }
};

export const getPatientsByBloodType = async (req, res) => {
  try {
    const bloodTypeGroups = await patientService.getPatientsByBloodType();
    res.json({ success: true, bloodTypeGroups });
  } catch (error) {
    logger.error('Get patients by blood type error:', error);
    return sendError(res, error.status || 500, error.message || 'Server error fetching patients by blood type', error);
  }
};

export const getAllergyAnalytics = async (req, res) => {
  try {
    const allergyAnalytics = await patientService.getAllergyAnalytics();
    res.json({ success: true, allergyAnalytics });
  } catch (error) {
    logger.error('Get allergy analytics error:', error);
    return sendError(res, error.status || 500, error.message || 'Server error fetching allergy analytics', error);
  }
};

export const getMedicalConditionsTrends = async (req, res) => {
  try {
    const trends = await patientService.getMedicalConditionsTrends(req.query.status);
    res.json({ success: true, status: req.query.status || 'active', trends });
  } catch (error) {
    logger.error('Get medical conditions trends error:', error);
    return sendError(res, error.status || 500, error.message || 'Server error fetching medical conditions trends', error);
  }
};

export const getPatientDemographics = async (req, res) => {
  try {
    const demographics = await patientService.getPatientDemographics();
    res.json({ success: true, demographics });
  } catch (error) {
    logger.error('Get patient demographics error:', error);
    return sendError(res, error.status || 500, error.message || 'Server error fetching patient demographics', error);
  }
};

export const getPatientsAtRisk = async (req, res) => {
  try {
    const data = await patientService.getPatientsAtRisk();
    res.json({ success: true, ...data });
  } catch (error) {
    logger.error('Get patients at risk error:', error);
    return sendError(res, error.status || 500, error.message || 'Server error fetching at-risk patients', error);
  }
};
