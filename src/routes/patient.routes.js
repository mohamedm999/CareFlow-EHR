import express from 'express';
import * as patientController from '../controllers/patient.controller.js';
import { authenticateToken } from '../middleware/auth.js';
import { checkPermission } from '../middleware/checkPermission.js';
import { validate } from '../middleware/validator.js';
import { createPatientWithUserSchema } from '../validation/patient.validation.js';

const router = express.Router();

router.get('/stats/overview',
  authenticateToken,
  checkPermission('view_all_patients'),
  patientController.getPatientStats
);

router.get('/analytics/by-blood-type',
  authenticateToken,
  checkPermission('view_all_patients'),
  patientController.getPatientsByBloodType
);

router.get('/analytics/allergies',
  authenticateToken,
  checkPermission('edit_medical_history'),
  patientController.getAllergyAnalytics
);

router.get('/analytics/conditions',
  authenticateToken,
  checkPermission('edit_medical_history'),
  patientController.getMedicalConditionsTrends
);

router.get('/analytics/demographics',
  authenticateToken,
  checkPermission('view_all_patients'),
  patientController.getPatientDemographics
);

router.get('/analytics/at-risk',
  authenticateToken,
  checkPermission('view_all_patients'),
  patientController.getPatientsAtRisk
);

router.post('/create-with-user',
  authenticateToken,
  checkPermission('create_patient_records'),
  validate(createPatientWithUserSchema, 'body'),
  patientController.createPatientWithUser
);

router.post('/',
  authenticateToken,
  checkPermission('create_patient_records'),
  patientController.createPatient
);

router.get('/',
  authenticateToken,
  checkPermission('view_all_patients'),
  patientController.getPatients
);

router.get('/:id',
  authenticateToken,
  checkPermission('view_assigned_patients'),
  patientController.getPatient
);

router.put('/:id',
  authenticateToken,
  checkPermission('view_assigned_patients'),
  patientController.updatePatient
);

router.post('/:id/allergies',
  authenticateToken,
  checkPermission('edit_medical_history'),
  patientController.addAllergy
);

router.post('/:id/medical-history',
  authenticateToken,
  checkPermission('edit_medical_history'),
  patientController.addMedicalHistory
);

export default router;
