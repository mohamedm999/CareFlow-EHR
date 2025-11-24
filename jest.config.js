export default {
  testEnvironment: 'node',
  coverageDirectory: 'coverage',
  setupFilesAfterEnv: ['<rootDir>/src/tests/setup.js'],
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/app.js',
    '!src/config/database.js',
    '!src/config/logger.js',
    '!src/config/swagger.js',
    '!src/config/seedRolesPermissions.js',
    '!src/tests/**',
    '!src/docs/**'
  ],
  testMatch: [
    '**/src/tests/**/*.test.js'
  ],
  testTimeout: 10000,
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1'
  },
  transform: {},
  testPathIgnorePatterns: [
    '/node_modules/',
    '/dist/'
  ],
  coveragePathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    'src/tests'
  ],
  coverageReporters: ['text', 'text-summary', 'html', 'lcov'],
  verbose: true,
  bail: false,
  maxWorkers: '50%',
  coverageThreshold: {
    global: {
      branches: 20,
      functions: 25,
      lines: 30,
      statements: 30
    }
  }
};
