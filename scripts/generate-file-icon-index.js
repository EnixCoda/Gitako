const { languages } = require('./tmp/languages')
const fileName = 'file-icons-index'

const link = 'https://github.com/vscode-icons/vscode-icons/wiki/ListOfFiles'

function parsePageContent() {
  const records = []
  document.body
    .querySelector('table')
    .querySelectorAll('tbody tr')
    .forEach(tr => {
      const [name, id, dark, light] = Array.from(tr.querySelectorAll('td'))
      const exts = []
      const ids = []
      const names = []

      id.querySelector('sub')
        .innerHTML.split(', ')
        .map(part => {
          const tags = part.match(/<(\w+)>(.*?)<\/\1>/g)
          if (tags) {
            tags.forEach(subPart => {
              const match = subPart.match(/<(\w+)>(.*?)<\/\1>/)
              if (match) {
                const [, tag, content] = match
                if (tag === 'strong') {
                  // filenames
                  names.push(content.toLowerCase())
                } else if (tag === 'code') {
                  // language ids
                  ids.push(content)
                } else {
                  console.warn(`Found unrecognized format`, subPart, tag) // unknown
                }
              }
            })
          } else if (part) {
            // extensions
            exts.push(part.toLowerCase())
          }
        })
      records.push({
        name: name.innerText,
        names,
        exts,
        ids,
        icon: getSrc(dark.querySelector('img')) || getSrc(light.querySelector('img')),
      })
    })
  return records

  function getSrc(img) {
    return img && img.src
  }
}

function prepareCSV({ name, names, exts, ids, icon }) {
  ids.forEach(content => {
    const defaultExtension = Object.values(languages)
      .find(({ ids }) => (Array.isArray(ids) ? ids : [ids]).includes(content))
      .defaultExtension.toLowerCase()
    if (!exts.includes(defaultExtension)) exts.push(defaultExtension)
  })
  const iconFile = icon.replace(/^.*?file_type_(.*?)\..*$/, '$1')
  const cols = [name, names.join(':'), exts.join(':')]
  if (!['file'].includes(name) && name !== iconFile) cols.push(iconFile)
  return cols
}

exports.fileName = fileName
exports.link = link
exports.parsePageContent = parsePageContent
exports.prepareCSV = prepareCSV
