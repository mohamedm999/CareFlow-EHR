import Joi from 'joi';

export const createAppointmentSchema = Joi.object({
  doctorId: Joi.string().required(),
  patientId: Joi.string(),
  dateTime: Joi.date().required(),
  duration: Joi.number().min(15).max(180).default(30),
  reason: Joi.string().required().min(5).max(500),
  notes: Joi.string().max(1000)
});

export const updateAppointmentSchema = Joi.object({
  dateTime: Joi.date(),
  duration: Joi.number().min(15).max(180),
  reason: Joi.string().min(5).max(500),
  notes: Joi.string().max(1000),
  status: Joi.string().valid('scheduled', 'completed', 'cancelled', 'no_show')
});

export const cancelAppointmentSchema = Joi.object({
  reason: Joi.string().required().min(5).max(500)
});
