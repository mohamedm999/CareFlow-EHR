import { body, validationResult } from 'express-validator';

export const validateRegistration = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
  
  body('firstName')
    .trim()
    .isLength({ min: 1 })
    .withMessage('First name is required')
    .isAlpha()
    .withMessage('First name must contain only letters'),
  
  body('lastName')
    .trim()
    .isLength({ min: 1 })
    .withMessage('Last name is required')
    .isAlpha()
    .withMessage('Last name must contain only letters'),
  
  body('roleName')
    .isIn(['admin', 'doctor', 'nurse', 'secretary', 'patient'])
    .withMessage('Invalid role. Must be one of: admin, doctor, nurse, secretary, patient'),
  
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: errors.array()
      });
    }
    next();
  }
];

export const validateLogin = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  
  body('password')
    .notEmpty()
    .withMessage('Password is required'),

  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: errors.array()
      });
    }
    next();
  }
];

export const validateAppointment = [
  body('doctorId').isMongoId().withMessage('Valid doctor ID required'),
  body('dateTime').isISO8601().withMessage('Valid date and time required'),
  body('reason').notEmpty().withMessage('Appointment reason required'),
  
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: errors.array()
      });
    }
    next();
  }
];