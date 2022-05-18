const { fixDep } = require('.')

const targetFilePath = `pjax-api/dist/pjax-api.js`;
const pairs = [
  // Firefox
  [
    `void xhr.open(method, requestURL.path, true);`,
    `void xhr.open(method, requestURL.reference, true);`,
  ],
  // Firefox
  [
    `this.document = this.xhr.responseXML.cloneNode(true);`,
    `this.document = this.xhr.responseXML;`,
  ],
  // Chrome: modifying cross-context history state causes troubles
  // Scroll position can still be restored without this function
  [
    `
            function savePosition() {
                var _a;
                void window.history.replaceState({
                    ...window.history.state,
                    position: {
                        ...(_a = window.history.state) === null || _a === void 0 ? void 0 : _a.position,
                        top: window.pageYOffset,
                        left: window.pageXOffset
                    }
                }, document.title);
            }`,
    `
            function savePosition() {
                return;
            }`,
  ],
]

exports.fix = async () => {
  try {
    await fixDep(targetFilePath, pairs)
  } catch (err) {
    console.error((err && err.message) || err)
    const shouldTerminate = process.env.IGNORE_FIX_PJAX_API_FAILURE !== 'true'
    if (shouldTerminate) process.exit(1)
  }
}
