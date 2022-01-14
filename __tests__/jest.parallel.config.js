const baseConfig = require('./jest.config')

module.exports = {
  ...baseConfig,
  testMatch: [...baseConfig.testMatch, '**/__tests__/cases/parallel/*.ts?(x)'],
}
