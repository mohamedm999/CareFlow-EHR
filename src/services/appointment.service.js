import Appointment from '../models/appointment.model.js';
import User from '../models/user.model.js';
import Patient from '../models/patient.model.js';
import { POPULATE_FIELDS, checkTimeConflict, appendNotes, buildRoleFilter, buildDateFilter, buildStatsPipeline, buildDoctorStatsPipeline, buildTrendsPipeline, buildTimeSlotsPipeline, generateAvailableSlots, DEFAULT_STATS } from '../helpers/appointment.helper.js';

export const createAppointment = async (patientId, doctorId, appointmentDate, duration, reason, notes, createdById, role) => {
  let finalPatientId = patientId;
  
  // If the user is a patient, find their Patient record
  if (role.name === 'patient') {
    const patientRecord = await Patient.findOne({ user: createdById });
    if (!patientRecord) {
      throw { status: 400, message: 'Patient record not found. Please contact support.' };
    }
    finalPatientId = patientRecord._id;
  }
  
  if (!finalPatientId) throw { status: 400, message: 'Patient ID is required for non-patient users' };

  const [doctor, patient] = await Promise.all([
    User.findById(doctorId).populate('role'),
    Patient.findById(finalPatientId).populate('user')
  ]);

  if (!doctor || doctor.role.name !== 'doctor') throw { status: 400, message: 'Invalid doctor ID' };
  if (!patient) throw { status: 400, message: 'Patient not found' };

  const dateTime = new Date(appointmentDate);
  const [doctorConflict, patientConflict] = await Promise.all([
    Appointment.findOne(checkTimeConflict(doctorId, dateTime, duration)),
    Appointment.findOne({ patient: finalPatientId, status: 'scheduled', dateTime })
  ]);

  if (doctorConflict) throw { status: 409, message: `Dr. ${doctor.firstName} ${doctor.lastName} is not available at this time. Please choose another slot.` };
  if (patientConflict) throw { status: 409, message: 'Patient already has an appointment at this time' };

  const appointment = await Appointment.create({
    patient: finalPatientId,
    doctor: doctorId,
    dateTime,
    duration,
    reason,
    notes,
    createdBy: createdById
  });

  await appointment.populate(POPULATE_FIELDS);
  return appointment;
};

export const getAppointments = async (userId, role, filters, page, limit) => {
  let patientFilter = {};
  
  // For patients, find their Patient record and filter by it
  if (role.name === 'patient') {
    const patientRecord = await Patient.findOne({ user: userId });
    if (patientRecord) {
      patientFilter = { patient: patientRecord._id };
    } else {
      // Patient has no Patient record yet, return empty
      return { appointments: [], total: 0, pages: 0 };
    }
  }
  
  const filter = {
    ...patientFilter,
    ...(role.name === 'doctor' && { doctor: userId }),
    ...(filters.status && { status: filters.status }),
    ...(filters.doctorId && ['admin', 'secretary'].includes(role.name) && { doctor: filters.doctorId }),
    ...(filters.patientId && ['admin', 'secretary', 'doctor'].includes(role.name) && { patient: filters.patientId }),
    ...(filters.date && { dateTime: { $gte: new Date(filters.date), $lt: new Date(new Date(filters.date).setDate(new Date(filters.date).getDate() + 1)) } })
  };

  const [appointments, total] = await Promise.all([
    Appointment.find(filter).populate(POPULATE_FIELDS).sort({ dateTime: 1 }).limit(limit * 1).skip((page - 1) * limit),
    Appointment.countDocuments(filter)
  ]);

  return { appointments, total, pages: Math.ceil(total / limit) };
};

export const updateAppointment = async (id, updates, userId, role) => {
  const appointment = await Appointment.findById(id);
  if (!appointment) throw { status: 404, message: 'Appointment not found' };

  const canModify = role.name === 'admin' || role.name === 'secretary' || 
    (role.name === 'doctor' && appointment.doctor.toString() === userId) ||
    (role.name === 'patient' && appointment.patient.toString() === userId);
  
  if (!canModify) throw { status: 403, message: 'Not authorized to modify this appointment' };

  if (role.name === 'patient') {
    const isValidUpdate = Object.keys(updates).every(key => key === 'notes');
    if (!isValidUpdate) throw { status: 400, message: 'Patients can only update notes' };
  }

  if (updates.dateTime) {
    const newDateTime = new Date(updates.dateTime);
    const duration = updates.duration || appointment.duration;
    const conflict = await Appointment.findOne(checkTimeConflict(updates.doctorId || appointment.doctor, newDateTime, duration, id));
    if (conflict) throw { status: 409, message: 'Time slot conflict detected' };
  }

  Object.assign(appointment, updates);
  await appointment.save();
  await appointment.populate(POPULATE_FIELDS);
  
  return appointment;
};

export const cancelAppointment = async (id, reason, userId, role) => {
  const appointment = await Appointment.findById(id);
  if (!appointment) throw { status: 404, message: 'Appointment not found' };

  const canModify = role.name === 'admin' || role.name === 'secretary' || 
    (role.name === 'doctor' && appointment.doctor.toString() === userId) ||
    (role.name === 'patient' && appointment.patient.toString() === userId);
  
  if (!canModify) throw { status: 403, message: 'Not authorized to cancel this appointment' };
  if (appointment.status === 'cancelled') throw { status: 400, message: 'Appointment is already cancelled' };

  appointment.status = 'cancelled';
  appointment.notes = appendNotes(appointment.notes, reason, 'Cancellation reason');
  await appointment.save();

  return appointment;
};

export const getDoctorAvailability = async (doctorId, date) => {
  const doctor = await User.findById(doctorId).populate('role');
  if (!doctor || doctor.role.name !== 'doctor') throw { status: 400, message: 'Invalid doctor ID' };

  const queryDate = new Date(date);
  const startDate = new Date(queryDate.setHours(0, 0, 0, 0));
  const endDate = new Date(queryDate.setHours(23, 59, 59, 999));

  const appointments = await Appointment.find({
    doctor: doctorId,
    dateTime: { $gte: startDate, $lte: endDate },
    status: 'scheduled'
  }).select('dateTime duration').sort({ dateTime: 1 });

  return {
    doctor: { id: doctor._id, name: `${doctor.firstName} ${doctor.lastName}` },
    date,
    availableSlots: generateAvailableSlots(startDate, appointments),
    bookedAppointments: appointments.length
  };
};

export const completeAppointment = async (id, notes, userId) => {
  const appointment = await Appointment.findById(id);
  if (!appointment) throw { status: 404, message: 'Appointment not found' };
  if (appointment.doctor.toString() !== userId) throw { status: 403, message: 'You can only complete your own appointments' };
  if (appointment.status !== 'scheduled') throw { status: 400, message: 'Only scheduled appointments can be completed' };

  appointment.status = 'completed';
  appointment.notes = appendNotes(appointment.notes, notes, 'Completion notes');
  await appointment.save();

  return appointment;
};

export const getAppointmentStats = async (userId, role, filters) => {
  const matchFilter = { ...buildRoleFilter(role, userId, filters.doctorId), ...buildDateFilter(filters.startDate, filters.endDate) };
  const stats = await Appointment.aggregate(buildStatsPipeline(matchFilter));
  return stats[0] || DEFAULT_STATS;
};

export const getAppointmentsByDoctor = async (filters) => {
  const matchFilter = { ...buildDateFilter(filters.startDate, filters.endDate), ...(filters.status && { status: filters.status }) };
  return await Appointment.aggregate(buildDoctorStatsPipeline(matchFilter));
};

export const getDailyAppointmentTrends = async (days = 30) => {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  return await Appointment.aggregate(buildTrendsPipeline(startDate));
};

export const getBusiestTimeSlots = async () => {
  return await Appointment.aggregate(buildTimeSlotsPipeline());
};
