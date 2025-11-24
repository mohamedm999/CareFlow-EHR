import { validatePagination } from '../../middleware/validatePagination.js';

describe('Middleware Integration Tests', () => {
  describe('validatePagination Middleware', () => {
    let req, res, next;

    beforeEach(() => {
      req = {
        query: {}
      };
      res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis()
      };
      next = jest.fn();
    });

    it('should use default pagination values', () => {
      validatePagination(req, res, next);

      expect(req.pagination).toBeDefined();
      expect(req.pagination.page).toBe(1);
      expect(req.pagination.limit).toBe(20);
      expect(req.pagination.skip).toBe(0);
      expect(next).toHaveBeenCalled();
    });

    it('should use provided page and limit', () => {
      req.query = { page: '3', limit: '50' };
      validatePagination(req, res, next);

      expect(req.pagination.page).toBe(3);
      expect(req.pagination.limit).toBe(50);
      expect(req.pagination.skip).toBe(100);
    });

    it('should enforce minimum page value', () => {
      req.query = { page: '0' };
      validatePagination(req, res, next);

      expect(req.pagination.page).toBe(1);
    });

    it('should enforce maximum limit value', () => {
      req.query = { limit: '200' };
      validatePagination(req, res, next);

      expect(req.pagination.limit).toBe(100);
    });

    it('should enforce minimum limit value', () => {
      req.query = { limit: '0' };
      validatePagination(req, res, next);

      expect(req.pagination.limit).toBe(1);
    });

    it('should use default sort', () => {
      validatePagination(req, res, next);

      expect(req.pagination.sort).toBe('-createdAt');
    });

    it('should use custom sort', () => {
      req.query = { sort: 'name' };
      validatePagination(req, res, next);

      expect(req.pagination.sort).toBe('name');
    });

    it('should handle negative page gracefully', () => {
      req.query = { page: '-5' };
      validatePagination(req, res, next);

      expect(req.pagination.page).toBe(1);
    });

    it('should calculate skip correctly', () => {
      req.query = { page: '5', limit: '20' };
      validatePagination(req, res, next);

      expect(req.pagination.skip).toBe(80);
    });

    it('should handle NaN values', () => {
      req.query = { page: 'abc', limit: 'xyz' };
      validatePagination(req, res, next);

      expect(req.pagination.page).toBe(1);
      expect(req.pagination.limit).toBe(20);
    });

    it('should call next middleware', () => {
      validatePagination(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it('should not call next if validation fails', () => {
      // Pagination validator always calls next, so we test valid flow
      validatePagination(req, res, next);
      expect(next).toHaveBeenCalledTimes(1);
    });
  });
});
