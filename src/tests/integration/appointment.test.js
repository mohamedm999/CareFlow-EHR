import request from 'supertest';
import express from 'express';
import appointmentRoutes from '../../routes/appointment.routes.js';
import User from '../../models/user.model.js';
import Role from '../../models/role.model.js';
import Appointment from '../../models/appointment.model.js';
import { generateAccessToken } from '../../utils/jwt.utils.js';

const app = express();
app.use(express.json());
app.use('/api/appointments', appointmentRoutes);

describe('Appointment Integration Tests', () => {
  let authToken;
  let doctorId;
  let patientId;

  beforeAll(async () => {
    const doctorRole = await Role.create({
      name: 'doctor',
      description: 'Doctor role for testing',
      permissions: ['schedule_own_appointments', 'view_own_appointments', 'cancel_own_appointments']
    });

    const patientRole = await Role.create({
      name: 'patient', 
      description: 'Patient role for testing'
    });

    const doctor = await User.create({
      firstName: 'Dr',
      lastName: 'Smith',
      email: 'doctor@test.com',
      password: 'hashed',
      role: doctorRole._id
    });
    doctorId = doctor._id;

    const patient = await User.create({
      firstName: 'Patient',
      lastName: 'Test',
      email: 'patient@test.com',
      password: 'hashed',
      role: patientRole._id
    });
    patientId = patient._id;

    authToken = generateAccessToken({
      userId: doctor._id,
      roleId: doctorRole._id,
      email: doctor.email
    });
  });

  describe('POST /api/appointments', () => {
    it('should create an appointment', async () => {
      const response = await request(app)
        .post('/api/appointments')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          doctorId,
          patientId,
          dateTime: new Date(Date.now() + 86400000),
          duration: 30,
          reason: 'Checkup'
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
    });

    it('should detect time conflicts', async () => {
      const dateTime = new Date(Date.now() + 86400000);
      
      await Appointment.create({
        doctor: doctorId,
        patient: patientId,
        dateTime,
        duration: 30,
        reason: 'First',
        createdBy: doctorId
      });

      const response = await request(app)
        .post('/api/appointments')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          doctorId,
          patientId,
          dateTime,
          duration: 30,
          reason: 'Conflict'
        });
        
      expect(response.status).toBe(409);
    });
  });
});
