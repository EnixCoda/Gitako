function parsePageContent() {
  const records = []
  document.body
    .querySelector('table')
    .querySelectorAll('tbody tr')
    .forEach(tr => {
      const [name, folderNames, closed, open] = Array.from(tr.querySelectorAll('td'))
      const names = folderNames.innerHTML.split(', ')
      records.push({
        name: name.innerText,
        names,
        icon: {
          closed: getSrc(closed.querySelector('img')),
          open: getSrc(open.querySelector('img')),
        },
      })
    })
  return records
}

function getSrc(img) {
  return img && img.src
}

function generateCSV(records) {
  const prepend = 'https://github.com/vscode-icons/vscode-icons/raw/master/icons/folder_type_'
  const append = '.svg?sanitize=true'
  const separator = ':'
  const csv = records
    .map(({ name, names, icon }) =>
      [
        name,
        names.join(separator),
        // icon.replace(prepend, '').replace(append, ''), // assumption: name is equal to this
      ].join(','),
    )
    .join('\n')
  return csv
}

console.log(generateCSV(parsePageContent()))
