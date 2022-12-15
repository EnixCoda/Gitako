const fs = require('fs').promises
const path = require('path')

/**
 * This script rewrites local dependency files to resolve compatibility issues.
 * This is a bit dirty but really effective.
 */

function modify(source = '', pairs = []) {
  for (const [original, replace] of pairs) {
    if (source.includes(original)) {
      source = source.replace(original, replace)
    } else {
      throw new Error(`Original string not found: ${JSON.stringify(original)}`)
    }

    if (source.includes(original)) {
      throw new Error(`More than one original string found`, JSON.stringify(original))
    }
  }

  return source
}

const nodeModulesPath = path.resolve(__dirname, '../../', `node_modules`)

const MODIFIED_MARK = `\n/* This file has been modified */\n`

exports.fixDep = async function fixDep(targetFilePath, pairs) {
  const filePath = path.resolve(nodeModulesPath, targetFilePath)
  const source = await fs.readFile(filePath, 'utf-8')
  if (source.includes(MODIFIED_MARK)) {
    console.log(`${filePath} has been fixed, skipping.`)
    return
  }
  const modified = modify(source, pairs) + MODIFIED_MARK
  await fs.writeFile(filePath, modified, 'utf-8')
}

async function fixDeps() {
  for (const fix of [
    require('./pjax-api').fix,
    require('./styled-components').fix,
    require('./webext-domain-permission-toggle').fix,
  ]) {
    await fix()
  }
}

fixDeps()
