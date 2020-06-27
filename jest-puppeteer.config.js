const path = require('path')

const CRX_PATH = path.resolve(__dirname, 'dist')

module.exports = {
  launch: {
    executablePath: process.env.PUPPETEER_EXEC_PATH, // set by mujo-code/puppeteer-headful
    headless: false, // required for extensions
    args: [`--disable-extensions-except=${CRX_PATH}`, `--load-extension=${CRX_PATH}`],
  },
}
