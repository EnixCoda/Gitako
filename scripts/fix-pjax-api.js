/**
 * This script rewrites code of pjax-api to resolve compatibility issues.
 * This is a bit dirty but really effective.
 */
const fs = require('fs').promises
const path = require('path')

function modify(source = '', pairs = []) {
  for (const [original, replace] of pairs) {
    if (source.includes(original)) {
      source = source.replace(original, replace)
      if (source.includes(original)) {
        throw new Error(`More than one original string found`, JSON.stringify(original))
      }
    }
    throw new Error(`Original string not found`, JSON.stringify(original))
  }

  return source
}

async function fixPJAXAPI(loose) {
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
  try {
    const filePath = path.resolve(__dirname, '..', `node_modules/pjax-api/dist/pjax-api.js`)
    const source = await fs.readFile(filePath, 'utf-8')
    const modified = modify(source, pairs, loose)
    await fs.writeFile(filePath, modified, 'utf-8')
  } catch (err) {
    console.error((err && err.message) || err)
  }
}

fixPJAXAPI()
