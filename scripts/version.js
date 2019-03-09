/**
 * copy version from package.json to manifest.json
 * also remove old git tag for the version
 */

const fs = require('fs')
const path = require('path')
const cp = require('child_process')

const rootPath = path.resolve(__dirname, '../')
const manifestPath = path.resolve(rootPath, 'src/manifest.json')

const manifest = require(manifestPath)
const version = require('./get-version')

manifest.version = version
fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, '  '), 'utf-8')

const exec = command =>
  new Promise((resolve, reject) =>
    cp.exec(command, (error, stdout, stderr) =>
      error ? reject(error) : resolve(stdout || stderr),
    ),
  )

exec(`git tag -d v${version}`)
  .then(() => exec(`git add src/manifest.json && git commit --amend --no-edit`))
  .then(() => exec(`git tag v${version}`))
  .catch(console.error)
