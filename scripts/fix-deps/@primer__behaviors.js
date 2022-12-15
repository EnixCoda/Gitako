const { fixDep } = require('.')

const targetFilePath = `@primer/behaviors/dist/esm/anchored-position.js`
const pairs = [
  [
    `if (parentNode === document.body)`,
    `if (parentNode === document) break
    if (parentNode === document.body)`,
  ],
  [
    `const clippingNode = parentNode === document.body || !(parentNode instanceof HTMLElement) ? document.body : parentNode;`, // prettier-ignore
    `const clippingNode = parentNode === document ? document.documentElement : parentNode === document.body || !(parentNode instanceof HTMLElement) ? document.body : parentNode;`, // prettier-ignore
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
