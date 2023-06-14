const baseConfig = require('./jest.config')

/**
 * @type {import('@jest/types').Config.InitialOptions}
 */
module.exports = {
  ...baseConfig,
  maxWorkers: 1,
  testMatch: [...baseConfig.testMatch, '**/__tests__/cases/non-parallel/*.ts?(x)'],
  setupFilesAfterEnv: ['<rootDir>/setup.ts'],
}
