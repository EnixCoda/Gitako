const { fixDep } = require('.')

const targetFilePath = `webext-domain-permission-toggle/index.js`
const pairs = [
  [
    `const { name, optional_permissions: optionalPermissions } = chrome.runtime.getManifest();`, // prettier-ignore
    `const { name, optional_host_permissions: optionalPermissions } = chrome.runtime.getManifest();`, // prettier-ignore
  ],
  [
    `const optionalHosts = optionalPermissions === null || optionalPermissions === void 0 ? void 0 : optionalPermissions.filter(permission => /<all_urls>|\\*/.test(permission));`, // prettier-ignore
    `const optionalHosts = optionalPermissions === null || optionalPermissions === void 0 ? void 0 : optionalPermissions.filter(permission => '*://*/*' === permission);`, // prettier-ignore
  ],
  [
    `contexts: ['page_action', 'browser_action']`, // prettier-ignore
    `contexts: ['action', 'page_action', 'browser_action']`, // prettier-ignore
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
