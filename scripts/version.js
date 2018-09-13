const fs = require('fs')
const path = require('path')

const rootPath = path.resolve(__dirname, '../')
const packageJSON = require(path.resolve(rootPath, 'package.json'))
const manifestPath = path.resolve(rootPath, 'src/manifest.json');
const manifest = require(manifestPath)

manifest.version = packageJSON.version
fs.writeFileSync(manifestPath, JSON.stringify(manifest), 'utf-8')
