import dotenv from 'dotenv';

dotenv.config({ path: '.env.test' });

process.env.NODE_ENV = 'test';
process.env.MONGODB_URI = 'mongodb://localhost:27017/careflow_ehr_test';
process.env.JWT_SECRET = 'test_secret_key_12345678901234567890';
process.env.JWT_REFRESH_SECRET = 'test_refresh_secret_key_1234567890';
process.env.S3_ACCESS_KEY = 'test_access_key';
process.env.S3_SECRET_KEY = 'test_secret_key';
process.env.S3_ENDPOINT = 'http://localhost:9000';
process.env.S3_REGION = 'us-east-1';
process.env.CORS_ORIGIN = 'http://localhost:3000';

jest.setTimeout(10000);

afterAll(async () => {
  await new Promise(resolve => setTimeout(resolve, 500));
});
