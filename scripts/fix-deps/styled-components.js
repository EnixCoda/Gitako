const { fixDep } = require('.')

const targetFilePath = `styled-components/dist/styled-components.browser.esm.js`
const pairs = [
  // Firefox
  // disable production check in `checkDynamicCreation`
  [
    `function(e,t){if("production"!==process.env.NODE_ENV)`, // prettier-ignore
    `function(e,t){if(false)`,
  ],
]

exports.fix = async () => {
  try {
    await fixDep(targetFilePath, pairs)
  } catch (err) {
    console.error((err && err.message) || err)
    process.exit(1)
  }
}
