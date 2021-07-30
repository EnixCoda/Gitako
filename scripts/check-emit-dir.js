const path = require('path')
const fs = require('fs').promises

const emitDirPath = path.resolve(__dirname, 'tmp')
exports.emitDirPath = emitDirPath

async function checkEmitDir() {
  try {
    await fs.mkdir(emitDirPath)
  } catch (err) {
    await fs.stat(emitDirPath)
  }
}
exports.checkEmitDir = checkEmitDir
