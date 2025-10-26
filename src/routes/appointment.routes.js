import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { checkPermission } from '../middleware/checkPermission.js';
import { validateAppointment } from '../middleware/validator.js';
import {
  createAppointment,
  getAppointments,
  updateAppointment,
  cancelAppointment,
  getDoctorAvailability,
  completeAppointment,
  getAppointmentStats,
  getAppointmentsByDoctor,
  getDailyAppointmentTrends,
  getBusiestTimeSlots
} from '../controllers/appointment.controller.js';

const router = express.Router();


router.post('/', 
  authenticateToken, 
  checkPermission('schedule_own_appointments'),
  validateAppointment,
  createAppointment
);

router.get('/',
  authenticateToken,
  checkPermission('view_own_appointments'),
  getAppointments
);

// Get doctor availability
router.get('/availability/:doctorId',
  authenticateToken,
  getDoctorAvailability
);

// Update appointment
router.put('/:id',
  authenticateToken,
  checkPermission('schedule_own_appointments'),
  updateAppointment
);

// Cancel appointment
router.patch('/:id/cancel',
  authenticateToken,
  checkPermission('cancel_own_appointments'),
  cancelAppointment
);

// Complete appointment (doctors only)
router.patch('/:id/complete',
  authenticateToken,
  checkPermission('mark_appointment_complete'),
  completeAppointment
);

// 🔥 NEW AGGREGATION ENDPOINTS
// Get appointment statistics
router.get('/stats',
  authenticateToken,
  checkPermission('view_own_appointments'),
  getAppointmentStats
);

// Get appointments grouped by doctor (admin/secretary only)
router.get('/by-doctor',
  authenticateToken,
  checkPermission('view_all_appointments'),
  getAppointmentsByDoctor
);

// Get daily appointment trends (admin/secretary only)
router.get('/trends/daily',
  authenticateToken,
  checkPermission('view_all_appointments'),
  getDailyAppointmentTrends
);

// Get busiest time slots (admin/secretary only)
router.get('/analytics/time-slots',
  authenticateToken,
  checkPermission('view_all_appointments'),
  getBusiestTimeSlots
);

export default router;