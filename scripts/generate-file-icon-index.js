const languageIds = require('./language-id-ext.json')

const records = []

document.body
  .querySelector('table')
  .querySelectorAll('tbody tr')
  .forEach(tr => {
    const [name, id, dark, light] = Array.from(tr.querySelectorAll('td'))
    const exts = []
    const names = []
    id.innerHTML
      .replace(/<sub>|<\/sub>/g, '')
      .split(', ')
      .map(part => {
        const match = part.match(/<(\w+)>(.*?)<\/\1>/)
        if (match) {
          const [, tag, content] = match
          if (tag === 'strong') {
            // filenames in bold
            names.push(content)
          } else if (tag === 'code') {
            // language ids in code block
            const map = Object.values(languageIds).find(({ ids }) =>
              (Array.isArray(ids) ? ids : [ids]).includes(content),
            )
            if (map && map.exts) exts.push(map.exts)
          } else {
            console.warn(`Found unrecognized format`, part) // unknown
          }
        } else if (part) {
          // extensions are in regular fonts
          exts.push(part.replace(/^\./, ''))
        }
      })
    records.push({
      name: name.innerText,
      exts,
      names,
      icon: getSrc(dark.querySelector('img')) || getSrc(light.querySelector('img')),
    })
  })

function getSrc(img) {
  return img && img.src
}

const prepend = 'https://github.com/vscode-icons/vscode-icons/raw/master/icons/file_type_'
const append = '.svg?sanitize=true'
const separator = ':'
const csv = records
  .map(({ name, names, exts, icon }) =>
    [
      name,
      names.join(separator),
      exts.join(separator),
      // icon.replace(prepend, '').replace(append, ''), // assumption: name is equal to this
    ].join(','),
  )
  .join('\n')

console.log(csv)
