/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/**/__tests__/**.test.ts'],
  setupFiles: ['<rootDir>/tests/setup-env.ts'],
};