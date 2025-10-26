import { expect } from 'chai';
import request from 'supertest';
import app from '../src/app.js';

describe('Appointment API', () => {
  let authToken;
  let appointmentId;

  before(async () => {
    // Login to get token
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'doctor@test.com',
        password: 'Test123!'
      });
    
    authToken = res.body.accessToken;
  });

  describe('POST /api/appointments', () => {
    it('should create appointment successfully', async () => {
      const res = await request(app)
        .post('/api/appointments')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          doctorId: '507f1f77bcf86cd799439011',
          patientId: '507f1f77bcf86cd799439012',
          dateTime: '2025-10-25T10:00:00',
          duration: 30,
          reason: 'Checkup'
        });

      expect(res.status).to.equal(201);
      expect(res.body.success).to.be.true;
      expect(res.body.appointment).to.have.property('_id');
      appointmentId = res.body.appointment._id;
    });

    it('should detect time slot conflict', async () => {
      const res = await request(app)
        .post('/api/appointments')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          doctorId: '507f1f77bcf86cd799439011',
          patientId: '507f1f77bcf86cd799439013',
          dateTime: '2025-10-25T10:15:00',
          duration: 30,
          reason: 'Consultation'
        });

      expect(res.status).to.equal(409);
      expect(res.body.success).to.be.false;
    });
  });

  describe('PUT /api/appointments/:id', () => {
    it('should update appointment', async () => {
      const res = await request(app)
        .put(`/api/appointments/${appointmentId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          duration: 45
        });

      expect(res.status).to.equal(200);
      expect(res.body.appointment.duration).to.equal(45);
    });
  });
});