const fs = require('fs').promises
const path = require('path')

function modify(source = '', pairs) {
  for (const [original, replace] of pairs) {
    if (source.includes(original)) {
      source = source.replace(original, replace)
      if (source.includes(original)) {
        throw new Error(`More than one original string found`, JSON.stringify(original))
      }
    } else {
      throw new Error(`Original string not found`, JSON.stringify(original))
    }
  }

  return source
}

async function fixPJAXAPI() {
  const pairs = [
    [
      `void xhr.open(method, requestURL.path, true);`,
      `void xhr.open(method, requestURL.reference, true);`,
    ],
    [
      `this.document = this.xhr.responseType === 'document' ? this.xhr.responseXML.cloneNode(true) : html_1.parse(this.xhr.responseText).extract();`,
      `this.document = this.xhr.responseType === 'document' ? this.xhr.responseXML : html_1.parse(this.xhr.responseText).extract();`,
    ],
  ]
  const filePath = path.resolve(__dirname, '..', `node_modules/pjax-api/dist/pjax-api.js`)
  const source = await fs.readFile(filePath, 'utf-8')
  const modified = modify(source, pairs)
  fs.writeFile(filePath, modified, 'utf-8')
}

fixPJAXAPI()
