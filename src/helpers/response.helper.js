const ERROR_CODES = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  AUTHENTICATION_ERROR: 'AUTHENTICATION_ERROR',
  AUTHORIZATION_ERROR: 'AUTHORIZATION_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  CONFLICT: 'CONFLICT',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  BAD_REQUEST: 'BAD_REQUEST',
  UNPROCESSABLE_ENTITY: 'UNPROCESSABLE_ENTITY'
};

const getErrorCode = (status) => {
  const codeMap = {
    400: ERROR_CODES.BAD_REQUEST,
    401: ERROR_CODES.AUTHENTICATION_ERROR,
    403: ERROR_CODES.AUTHORIZATION_ERROR,
    404: ERROR_CODES.NOT_FOUND,
    409: ERROR_CODES.CONFLICT,
    422: ERROR_CODES.UNPROCESSABLE_ENTITY,
    500: ERROR_CODES.INTERNAL_ERROR
  };
  return codeMap[status] || ERROR_CODES.INTERNAL_ERROR;
};

export const sendError = (res, status, message, error = null, correlationId = null) => {
  const response = {
    success: false,
    code: getErrorCode(status),
    message,
    correlationId: correlationId || res.get('X-Correlation-ID') || generateCorrelationId(),
    timestamp: new Date().toISOString()
  };
  
  if (process.env.NODE_ENV === 'development' && error) {
    response.details = error.message;
  }
  
  return res.status(status).json(response);
};

export const sendSuccess = (res, data, status = 200, message = 'Success') => {
  return res.status(status).json({
    success: true,
    code: 'SUCCESS',
    message,
    data,
    timestamp: new Date().toISOString()
  });
};

export const generateCorrelationId = () => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};
