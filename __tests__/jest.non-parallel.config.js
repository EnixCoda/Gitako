const baseConfig = require('./jest.config')

module.exports = {
  ...baseConfig,
  maxWorkers: 1,
  testMatch: [...baseConfig.testMatch, '**/__tests__/cases/non-parallel/*.ts?(x)'],
}
