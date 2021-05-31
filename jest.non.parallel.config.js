const baseConfig = require('./jest.config')

module.exports = {
  ...baseConfig,
  maxWorkers: 1,
  testMatch: ['**/__tests__/non-parallel-cases/*.ts?(x)'],
}
