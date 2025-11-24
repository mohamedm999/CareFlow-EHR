import * as patientService from '../../../services/patient.service.js';
import Patient from '../../../models/patient.model.js';
import User from '../../../models/user.model.js';

describe('Patient Service', () => {
  describe('createPatient', () => {
    it('should create a patient successfully', async () => {
      const mockUser = { _id: 'user123', role: { name: 'patient' } };
      
      jest.spyOn(User, 'findById').mockReturnValue({
        
        populate: jest.fn().mockResolvedValue(mockUser)
      });
      jest.spyOn(Patient, 'findOne').mockResolvedValue(null);
      jest.spyOn(Patient, 'create').mockResolvedValue({
        _id: 'patient123',
        user: 'user123',
        populate: jest.fn().mockResolvedValue({ _id: 'patient123', user: mockUser })
      });

      const result = await patientService.createPatient({ userId: 'user123', bloodType: 'A+' });

      expect(result).toBeDefined();
      expect(result._id).toBe('patient123');
    });

    it('should throw error if user is not a patient', async () => {

      jest.spyOn(User, 'findById').mockReturnValue({
        populate: jest.fn().mockResolvedValue({ _id: 'user123', role: { name: 'doctor' } })
      });

      await expect(patientService.createPatient({ userId: 'user123' })).rejects.toMatchObject({
        status: 400,
        message: 'Invalid patient user'
      });
    });
  });

  describe('getPatientById', () => {
    it('should return patient if authorized', async () => {
      const mockPatient = { _id: 'patient123', user: { _id: 'user123' } };

      jest.spyOn(Patient, 'findById').mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockPatient)
      });

      const result = await patientService.getPatientById('patient123', 'user123', 'admin');
      expect(result).toBeDefined();
    });

    it('should throw error if patient not found', async () => {

      jest.spyOn(Patient, 'findById').mockReturnValue({
        populate: jest.fn().mockResolvedValue(null)
      });

      await expect(patientService.getPatientById('invalid', 'user123', 'admin')).rejects.toMatchObject({
        status: 404
      });
    });
  });
});
