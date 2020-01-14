const path = require('path')

const CRX_PATH = path.resolve(__dirname, 'dist')

module.exports = {
  launch: {
    headless: false, // required for extensions
    args: [`--disable-extensions-except=${CRX_PATH}`, `--load-extension=${CRX_PATH}`],
  },
}
