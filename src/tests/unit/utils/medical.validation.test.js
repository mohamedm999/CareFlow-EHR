import {
  validateVitalSigns,
  validateAppointmentTimeRange,
  validateBMI,
  validateDateRange,
  validatePrescriptionDosage
} from '../../../utils/medical.validation.js';

describe('Medical Validation Utils', () => {
  describe('validateVitalSigns', () => {
    it('should accept normal vital signs', () => {
      const vitals = {
        heartRate: 72,
        bloodPressure: { systolic: 120, diastolic: 80 },
        temperature: 37,
        respiratoryRate: 16,
        oxygenSaturation: 98
      };
      const errors = validateVitalSigns(vitals);
      expect(errors).toHaveLength(0);
    });

    it('should reject heart rate below 40', () => {
      const vitals = { heartRate: 30 };
      const errors = validateVitalSigns(vitals);
      expect(errors).toContain('Heart rate must be between 40 and 200 bpm');
    });

    it('should reject heart rate above 200', () => {
      const vitals = { heartRate: 250 };
      const errors = validateVitalSigns(vitals);
      expect(errors).toContain('Heart rate must be between 40 and 200 bpm');
    });

    it('should reject invalid systolic BP', () => {
      const vitals = { bloodPressure: { systolic: 400, diastolic: 80 } };
      const errors = validateVitalSigns(vitals);
      expect(errors).toContain('Systolic BP must be between 60 and 300 mmHg');
    });

    it('should reject invalid diastolic BP', () => {
      const vitals = { bloodPressure: { systolic: 120, diastolic: 250 } };
      const errors = validateVitalSigns(vitals);
      expect(errors).toContain('Diastolic BP must be between 30 and 200 mmHg');
    });

    it('should reject diastolic >= systolic', () => {
      const vitals = { bloodPressure: { systolic: 100, diastolic: 100 } };
      const errors = validateVitalSigns(vitals);
      expect(errors).toContain('Diastolic BP cannot be greater than or equal to systolic BP');
    });

    it('should reject temperature below 35', () => {
      const vitals = { temperature: 34 };
      const errors = validateVitalSigns(vitals);
      expect(errors).toContain('Temperature must be between 35°C and 43°C');
    });

    it('should reject temperature above 43', () => {
      const vitals = { temperature: 45 };
      const errors = validateVitalSigns(vitals);
      expect(errors).toContain('Temperature must be between 35°C and 43°C');
    });

    it('should reject invalid respiratory rate', () => {
      const vitals = { respiratoryRate: 100 };
      const errors = validateVitalSigns(vitals);
      expect(errors).toContain('Respiratory rate must be between 8 and 60 breaths/min');
    });

    it('should reject oxygen saturation > 100%', () => {
      const vitals = { oxygenSaturation: 105 };
      const errors = validateVitalSigns(vitals);
      expect(errors).toContain('Oxygen saturation must be between 70% and 100%');
    });
  });

  describe('validateAppointmentTimeRange', () => {
    it('should accept valid time range', () => {
      const start = new Date('2025-01-15T09:00:00');
      const end = new Date('2025-01-15T10:00:00');
      const errors = validateAppointmentTimeRange(start, end);
      expect(errors).toHaveLength(0);
    });

    it('should reject end time before start time', () => {
      const start = new Date('2025-01-15T10:00:00');
      const end = new Date('2025-01-15T09:00:00');
      const errors = validateAppointmentTimeRange(start, end);
      expect(errors).toContain('End time must be after start time');
    });

    it('should reject appointment > 8 hours', () => {
      const start = new Date('2025-01-15T09:00:00');
      const end = new Date('2025-01-15T18:00:00');
      const errors = validateAppointmentTimeRange(start, end);
      expect(errors).toContain('Appointment duration cannot exceed 8 hours');
    });

    it('should accept appointment = 8 hours', () => {
      const start = new Date('2025-01-15T09:00:00');
      const end = new Date('2025-01-15T17:00:00');
      const errors = validateAppointmentTimeRange(start, end);
      expect(errors).toHaveLength(0);
    });
  });

  describe('validateBMI', () => {
    it('should accept normal BMI', () => {
      const errors = validateBMI(170, 70);
      expect(errors).toHaveLength(0);
    });

    it('should reject negative height', () => {
      const errors = validateBMI(-170, 70);
      expect(errors).toContain('Height and weight must be positive numbers');
    });

    it('should reject zero weight', () => {
      const errors = validateBMI(170, 0);
      expect(errors).toContain('Height and weight must be positive numbers');
    });

    it('should reject unrealistic BMI (too high)', () => {
      const errors = validateBMI(100, 500);
      expect(errors).toContain('BMI calculation resulted in an unrealistic value');
    });

    it('should reject unrealistic BMI (too low)', () => {
      const errors = validateBMI(200, 1);
      expect(errors).toContain('BMI calculation resulted in an unrealistic value');
    });
  });

  describe('validateDateRange', () => {
    it('should accept valid date range', () => {
      const start = new Date('2025-01-01');
      const end = new Date('2025-01-31');
      const errors = validateDateRange(start, end);
      expect(errors).toHaveLength(0);
    });

    it('should reject end date before start date', () => {
      const start = new Date('2025-01-31');
      const end = new Date('2025-01-01');
      const errors = validateDateRange(start, end);
      expect(errors).toContain('End date must be after start date');
    });

    it('should reject date range > 1 year', () => {
      const start = new Date('2024-01-01');
      const end = new Date('2025-06-01');
      const errors = validateDateRange(start, end);
      expect(errors).toContain('Date range cannot exceed 1 year');
    });

    it('should accept date range = 1 year', () => {
      const start = new Date('2024-01-01');
      const end = new Date('2025-01-01');
      const errors = validateDateRange(start, end);
      expect(errors).toHaveLength(0);
    });
  });

  describe('validatePrescriptionDosage', () => {
    it('should accept valid dosage', () => {
      const errors = validatePrescriptionDosage(500, 'mg');
      expect(errors).toHaveLength(0);
    });

    it('should reject zero dosage', () => {
      const errors = validatePrescriptionDosage(0, 'mg');
      expect(errors).toContain('Dosage must be greater than 0');
    });

    it('should reject negative dosage', () => {
      const errors = validatePrescriptionDosage(-100, 'mg');
      expect(errors).toContain('Dosage must be greater than 0');
    });

    it('should reject unrealistic dosage', () => {
      const errors = validatePrescriptionDosage(50000, 'mg');
      expect(errors).toContain('Dosage appears unrealistically high');
    });

    it('should reject invalid unit', () => {
      const errors = validatePrescriptionDosage(500, 'invalid_unit');
      expect(errors).toContain('Unit must be one of: mg, g, mcg, IU, ml, drops, tablets, capsules');
    });

    it('should accept all valid units', () => {
      const validUnits = ['mg', 'g', 'mcg', 'IU', 'ml', 'drops', 'tablets', 'capsules'];
      for (const unit of validUnits) {
        const errors = validatePrescriptionDosage(100, unit);
        expect(errors).toHaveLength(0);
      }
    });
  });
});
