import { sendError, sendSuccess, generateCorrelationId } from '../../../helpers/response.helper.js';

describe('Response Helper', () => {
  let res;

  beforeEach(() => {
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      get: jest.fn().mockReturnValue(null)
    };
  });

  describe('generateCorrelationId', () => {
    it('should generate a valid correlation ID', () => {
      const id = generateCorrelationId();
      expect(id).toBeDefined();
      expect(typeof id).toBe('string');
      expect(id).toMatch(/^\d+-[a-z0-9]+$/);
    });

    it('should generate unique IDs', () => {
      const id1 = generateCorrelationId();
      const id2 = generateCorrelationId();
      expect(id1).not.toBe(id2);
    });
  });

  describe('sendError', () => {
    it('should return error response with correct status', () => {
      sendError(res, 400, 'Bad request', null);
      
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalled();
      const response = res.json.mock.calls[0][0];
      expect(response.success).toBe(false);
      expect(response.code).toBe('BAD_REQUEST');
      expect(response.message).toBe('Bad request');
    });

    it('should include correlation ID', () => {
      sendError(res, 400, 'Bad request', null);
      
      const response = res.json.mock.calls[0][0];
      expect(response.correlationId).toBeDefined();
      expect(response.timestamp).toBeDefined();
    });

    it('should map error codes correctly', () => {
      const testCases = [
        [400, 'BAD_REQUEST'],
        [401, 'AUTHENTICATION_ERROR'],
        [403, 'AUTHORIZATION_ERROR'],
        [404, 'NOT_FOUND'],
        [409, 'CONFLICT'],
        [422, 'UNPROCESSABLE_ENTITY'],
        [500, 'INTERNAL_ERROR']
      ];

      for (const [status, code] of testCases) {
        sendError(res, status, 'Test', null);
        const response = res.json.mock.calls[res.json.mock.calls.length - 1][0];
        expect(response.code).toBe(code);
      }
    });

    it('should include error details in development', () => {
      process.env.NODE_ENV = 'development';
      const error = new Error('Test error');
      
      sendError(res, 500, 'Server error', error);
      
      const response = res.json.mock.calls[0][0];
      expect(response.details).toBe('Test error');
    });

    it('should not include error details in production', () => {
      process.env.NODE_ENV = 'production';
      const error = new Error('Test error');
      
      sendError(res, 500, 'Server error', error);
      
      const response = res.json.mock.calls[0][0];
      expect(response.details).toBeUndefined();
    });
  });

  describe('sendSuccess', () => {
    it('should return success response with data', () => {
      const data = { id: 1, name: 'Test' };
      sendSuccess(res, data);
      
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalled();
      const response = res.json.mock.calls[0][0];
      expect(response.success).toBe(true);
      expect(response.code).toBe('SUCCESS');
      expect(response.data).toEqual(data);
    });

    it('should use custom status code', () => {
      sendSuccess(res, { id: 1 }, 201);
      
      expect(res.status).toHaveBeenCalledWith(201);
    });

    it('should use custom message', () => {
      sendSuccess(res, { id: 1 }, 200, 'Custom message');
      
      const response = res.json.mock.calls[0][0];
      expect(response.message).toBe('Custom message');
    });

    it('should include timestamp', () => {
      sendSuccess(res, { id: 1 });
      
      const response = res.json.mock.calls[0][0];
      expect(response.timestamp).toBeDefined();
    });
  });
});
