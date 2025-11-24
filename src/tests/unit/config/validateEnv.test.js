import { validateEnvironment } from '../../../config/validateEnv.js';

describe('Environment Validation', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    jest.clearAllMocks();
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('validateEnvironment', () => {
    it('should not throw when all required vars are set', () => {
      process.env.NODE_ENV = 'development';
      process.env.PORT = '5000';
      process.env.MONGODB_URI = 'mongodb://localhost:27017/careflow_ehr';
      process.env.JWT_SECRET = 'test_secret_key_1234567890';
      process.env.JWT_REFRESH_SECRET = 'test_refresh_secret_1234567890';
      process.env.S3_ENDPOINT = 'http://localhost:9000';
      process.env.S3_ACCESS_KEY = 'minioadmin';
      process.env.S3_SECRET_KEY = 'minioadmin';
      process.env.S3_REGION = 'us-east-1';

      expect(() => validateEnvironment()).not.toThrow();
    });

    it('should set default values for optional variables', () => {
      process.env.NODE_ENV = 'development';
      process.env.PORT = '5000';
      process.env.MONGODB_URI = 'mongodb://localhost:27017/careflow_ehr';
      process.env.JWT_SECRET = 'test_secret';
      process.env.JWT_REFRESH_SECRET = 'test_refresh';
      process.env.S3_ENDPOINT = 'http://localhost:9000';
      process.env.S3_ACCESS_KEY = 'test';
      process.env.S3_SECRET_KEY = 'test';
      process.env.S3_REGION = 'us-east-1';

      delete process.env.CORS_ORIGIN;
      delete process.env.LOG_LEVEL;

      validateEnvironment();

      expect(process.env.CORS_ORIGIN).toBe('http://localhost:3000');
      expect(process.env.LOG_LEVEL).toBe('info');
    });

    it('should validate NODE_ENV values', () => {
      process.env.NODE_ENV = 'invalid_env';
      process.env.PORT = '5000';
      process.env.MONGODB_URI = 'mongodb://localhost:27017/careflow_ehr';
      process.env.JWT_SECRET = 'test';
      process.env.JWT_REFRESH_SECRET = 'test';
      process.env.S3_ENDPOINT = 'http://localhost:9000';
      process.env.S3_ACCESS_KEY = 'test';
      process.env.S3_SECRET_KEY = 'test';
      process.env.S3_REGION = 'us-east-1';

      jest.spyOn(process, 'exit').mockImplementation(() => {});

      validateEnvironment();

      expect(process.exit).toHaveBeenCalledWith(1);
    });

    it('should validate PORT is a number', () => {
      process.env.NODE_ENV = 'development';
      process.env.PORT = 'not_a_number';
      process.env.MONGODB_URI = 'mongodb://localhost:27017/careflow_ehr';
      process.env.JWT_SECRET = 'test';
      process.env.JWT_REFRESH_SECRET = 'test';
      process.env.S3_ENDPOINT = 'http://localhost:9000';
      process.env.S3_ACCESS_KEY = 'test';
      process.env.S3_SECRET_KEY = 'test';
      process.env.S3_REGION = 'us-east-1';

      jest.spyOn(process, 'exit').mockImplementation(() => {});

      validateEnvironment();

      expect(process.exit).toHaveBeenCalledWith(1);
    });

    it('should require JWT_SECRET', () => {
      process.env.NODE_ENV = 'development';
      process.env.PORT = '5000';
      process.env.MONGODB_URI = 'mongodb://localhost:27017/careflow_ehr';
      process.env.JWT_REFRESH_SECRET = 'test';
      process.env.S3_ENDPOINT = 'http://localhost:9000';
      process.env.S3_ACCESS_KEY = 'test';
      process.env.S3_SECRET_KEY = 'test';
      process.env.S3_REGION = 'us-east-1';

      delete process.env.JWT_SECRET;

      jest.spyOn(process, 'exit').mockImplementation(() => {});

      validateEnvironment();

      expect(process.exit).toHaveBeenCalledWith(1);
    });

    it('should require S3 credentials', () => {
      process.env.NODE_ENV = 'development';
      process.env.PORT = '5000';
      process.env.MONGODB_URI = 'mongodb://localhost:27017/careflow_ehr';
      process.env.JWT_SECRET = 'test';
      process.env.JWT_REFRESH_SECRET = 'test';
      process.env.S3_ENDPOINT = 'http://localhost:9000';
      process.env.S3_REGION = 'us-east-1';

      delete process.env.S3_ACCESS_KEY;
      delete process.env.S3_SECRET_KEY;

      jest.spyOn(process, 'exit').mockImplementation(() => {});

      validateEnvironment();

      expect(process.exit).toHaveBeenCalledWith(1);
    });

    it('should require MONGODB_URI', () => {
      process.env.NODE_ENV = 'development';
      process.env.PORT = '5000';
      process.env.JWT_SECRET = 'test';
      process.env.JWT_REFRESH_SECRET = 'test';
      process.env.S3_ENDPOINT = 'http://localhost:9000';
      process.env.S3_ACCESS_KEY = 'test';
      process.env.S3_SECRET_KEY = 'test';
      process.env.S3_REGION = 'us-east-1';

      delete process.env.MONGODB_URI;

      jest.spyOn(process, 'exit').mockImplementation(() => {});

      validateEnvironment();

      expect(process.exit).toHaveBeenCalledWith(1);
    });
  });
});
