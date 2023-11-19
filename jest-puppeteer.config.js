const path = require('path')
if (process.arch === 'arm64' && process.platform === 'darwin') {
  require('dotenv').config()
}

const CRX_PATH = path.resolve(__dirname, 'dist')

module.exports = {
  launch: {
    // set by mujo-code/puppeteer-headful on GitHub actions
    // also for usages on ARM chip Mac
    executablePath: process.env.PUPPETEER_EXEC_PATH,
    // required for enabling extensions
    headless: false,
    args: [`--disable-extensions-except=${CRX_PATH}`, `--load-extension=${CRX_PATH}`],
  },
}
