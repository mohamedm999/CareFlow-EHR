export const validateVitalSigns = (vitals) => {
  const errors = [];
  
  if (vitals.heartRate !== undefined) {
    if (vitals.heartRate < 40 || vitals.heartRate > 200) {
      errors.push('Heart rate must be between 40 and 200 bpm');
    }
  }
  
  if (vitals.bloodPressure) {
    const { systolic, diastolic } = vitals.bloodPressure;
    if (systolic < 60 || systolic > 300) {
      errors.push('Systolic BP must be between 60 and 300 mmHg');
    }
    if (diastolic < 30 || diastolic > 200) {
      errors.push('Diastolic BP must be between 30 and 200 mmHg');
    }
    if (diastolic >= systolic) {
      errors.push('Diastolic BP cannot be greater than or equal to systolic BP');
    }
  }
  
  if (vitals.temperature !== undefined) {
    if (vitals.temperature < 35 || vitals.temperature > 43) {
      errors.push('Temperature must be between 35°C and 43°C');
    }
  }
  
  if (vitals.respiratoryRate !== undefined) {
    if (vitals.respiratoryRate < 8 || vitals.respiratoryRate > 60) {
      errors.push('Respiratory rate must be between 8 and 60 breaths/min');
    }
  }
  
  if (vitals.oxygenSaturation !== undefined) {
    if (vitals.oxygenSaturation < 70 || vitals.oxygenSaturation > 100) {
      errors.push('Oxygen saturation must be between 70% and 100%');
    }
  }
  
  return errors;
};

export const validateAppointmentTimeRange = (startTime, endTime) => {
  const errors = [];
  
  if (new Date(endTime) <= new Date(startTime)) {
    errors.push('End time must be after start time');
  }
  
  const diffHours = (new Date(endTime) - new Date(startTime)) / (1000 * 60 * 60);
  if (diffHours > 8) {
    errors.push('Appointment duration cannot exceed 8 hours');
  }
  
  return errors;
};

export const validateBMI = (height, weight) => {
  if (height <= 0 || weight <= 0) {
    return ['Height and weight must be positive numbers'];
  }
  
  const bmi = weight / ((height / 100) ** 2);
  if (bmi < 10 || bmi > 60) {
    return ['BMI calculation resulted in an unrealistic value'];
  }
  
  return [];
};

export const validateDateRange = (startDate, endDate) => {
  const errors = [];
  
  if (new Date(endDate) <= new Date(startDate)) {
    errors.push('End date must be after start date');
  }
  
  const diffDays = (new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24);
  if (diffDays > 365) {
    errors.push('Date range cannot exceed 1 year');
  }
  
  return errors;
};

export const validatePrescriptionDosage = (dose, unit) => {
  const errors = [];
  
  if (dose <= 0) {
    errors.push('Dosage must be greater than 0');
  }
  
  if (dose > 10000) {
    errors.push('Dosage appears unrealistically high');
  }
  
  const validUnits = ['mg', 'g', 'mcg', 'IU', 'ml', 'drops', 'tablets', 'capsules'];
  if (!validUnits.includes(unit)) {
    errors.push(`Unit must be one of: ${validUnits.join(', ')}`);
  }
  
  return errors;
};
