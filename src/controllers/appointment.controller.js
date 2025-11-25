import { logger } from '../config/logger.js';
import { sendError } from '../helpers/response.helper.js';
import * as appointmentService from '../services/appointment.service.js';

export const createAppointment = async (req, res) => {
  try {
    const { doctorId, patientId, dateTime, duration = 30, reason, notes } = req.body;
    if (!doctorId || !patientId || !dateTime || !reason) {
      return sendError(res, 400, 'Missing required fields: doctorId, patientId, dateTime, reason');
    }
    const appointment = await appointmentService.createAppointment(patientId, doctorId, dateTime, duration, reason, notes, req.user.userId, req.user.role);
    logger.info(`Appointment created: ${appointment._id} by user ${req.user.userId}`);
    res.status(201).json({ success: true, message: 'Appointment created successfully', data: appointment });
  } catch (error) {
    logger.error('Create appointment error:', error);
    return sendError(res, error.status || 500, error.message || 'Server error creating appointment', error);
  }
};

export const getAppointments = async (req, res) => {
  try {
    const { userId, role } = req.user;
    const { page = 1, limit = 10, status, doctorId, patientId, date } = req.query;
    if (!['patient', 'doctor', 'admin', 'secretary', 'nurse'].includes(role.name)) return sendError(res, 403, 'Access denied');
    const { appointments, total, pages } = await appointmentService.getAppointments(userId, role, { status, doctorId, patientId, date }, parseInt(page), parseInt(limit));
    res.json({ success: true, data: { appointments, pagination: { page: parseInt(page), pages, total } } });
  } catch (error) {
    logger.error('Get appointments error:', error);
    return sendError(res, error.status || 500, error.message || 'Server error fetching appointments', error);
  }
};

export const updateAppointment = async (req, res) => {
  try {
    const appointment = await appointmentService.updateAppointment(req.params.id, req.body, req.user.userId, req.user.role);
    logger.info(`Appointment ${req.params.id} updated by user ${req.user.userId}`);
    res.json({ success: true, message: 'Appointment updated successfully', data: appointment });
  } catch (error) {
    logger.error('Update appointment error:', error);
    return sendError(res, error.status || 500, error.message || 'Server error updating appointment', error);
  }
};

export const cancelAppointment = async (req, res) => {
  try {
    const appointment = await appointmentService.cancelAppointment(req.params.id, req.body.reason, req.user.userId, req.user.role);
    logger.info(`Appointment ${req.params.id} cancelled by user ${req.user.userId}`);
    res.json({ success: true, message: 'Appointment cancelled successfully', data: appointment });
  } catch (error) {
    logger.error('Cancel appointment error:', error);
    return sendError(res, error.status || 500, error.message || 'Server error cancelling appointment', error);
  }
};

export const getDoctorAvailability = async (req, res) => {
  try {
    if (!req.query.date) return sendError(res, 400, 'Date parameter is required');
    const availability = await appointmentService.getDoctorAvailability(req.params.doctorId, req.query.date);
    res.json({ success: true, data: availability });
  } catch (error) {
    logger.error('Get doctor availability error:', error);
    return sendError(res, error.status || 500, error.message || 'Server error fetching availability', error);
  }
};

export const completeAppointment = async (req, res) => {
  try {
    if (req.user.role.name !== 'doctor') return sendError(res, 403, 'Only doctors can mark appointments as completed');
    const appointment = await appointmentService.completeAppointment(req.params.id, req.body.notes, req.user.userId);
    logger.info(`Appointment ${req.params.id} completed by doctor ${req.user.userId}`);
    res.json({ success: true, message: 'Appointment marked as completed', data: appointment });
  } catch (error) {
    logger.error('Complete appointment error:', error);
    return sendError(res, error.status || 500, error.message || 'Server error completing appointment', error);
  }
};

export const getAppointmentStats = async (req, res) => {
  try {
    if (!['patient', 'doctor', 'admin', 'secretary'].includes(req.user.role.name)) return sendError(res, 403, 'Access denied');
    const stats = await appointmentService.getAppointmentStats(req.user.userId, req.user.role, req.query);
    res.json({ success: true, data: stats });
  } catch (error) {
    logger.error('Get appointment stats error:', error);
    return sendError(res, error.status || 500, error.message || 'Server error fetching appointment statistics', error);
  }
};

export const getAppointmentsByDoctor = async (req, res) => {
  try {
    if (!['admin', 'secretary'].includes(req.user.role.name)) return sendError(res, 403, 'Access denied');
    const doctorStats = await appointmentService.getAppointmentsByDoctor(req.query);
    res.json({ success: true, data: doctorStats });
  } catch (error) {
    logger.error('Get appointments by doctor error:', error);
    return sendError(res, error.status || 500, error.message || 'Server error fetching doctor appointment statistics', error);
  }
};

export const getDailyAppointmentTrends = async (req, res) => {
  try {
    if (!['admin', 'secretary'].includes(req.user.role.name)) return sendError(res, 403, 'Access denied');
    const days = parseInt(req.query.days || 30);
    const trends = await appointmentService.getDailyAppointmentTrends(days);
    res.json({ success: true, data: { trends, period: `${days} days` } });
  } catch (error) {
    logger.error('Get daily appointment trends error:', error);
    return sendError(res, error.status || 500, error.message || 'Server error fetching appointment trends', error);
  }
};

export const getBusiestTimeSlots = async (req, res) => {
  try {
    if (!['admin', 'secretary'].includes(req.user.role.name)) return sendError(res, 403, 'Access denied');
    const timeSlots = await appointmentService.getBusiestTimeSlots();
    res.json({ success: true, data: timeSlots });
  } catch (error) {
    logger.error('Get busiest time slots error:', error);
    return sendError(res, error.status || 500, error.message || 'Server error fetching time slot statistics', error);
  }
};
