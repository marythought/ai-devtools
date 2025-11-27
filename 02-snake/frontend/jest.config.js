export default {
  preset: 'ts-jest/presets/default-esm',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/tests/setupTests.ts'],
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    'js/**/*.ts',
    '!js/main.ts', // Main app initialization - covered by integration tests
    '!**/node_modules/**'
  ],
  coverageThreshold: {
    global: {
      branches: 79,
      functions: 80,
      lines: 80,
      statements: 80
    }
  },
  moduleNameMapper: {
    '\\.(css|less|scss|sass)$': '<rootDir>/tests/__mocks__/styleMock.js',
    '^(\\.{1,2}/.*)\\.js$': '$1'
  },
  extensionsToTreatAsEsm: ['.ts'],
  transform: {
    '^.+\\.(ts|js)$': ['ts-jest', {
      useESM: true,
      tsconfig: {
        module: 'ES2020',
        target: 'ES2020',
        allowJs: true
      }
    }]
  },
  testMatch: ['**/tests/**/*.test.ts']
};
