const fileName = 'folder-icons-index'

const link = 'https://github.com/vscode-icons/vscode-icons/wiki/ListOfFolders'

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

  function getSrc(img) {
    return img && img.src
  }
}

function prepareCSV({ name, names, icon }) {
  const [iconFileOpen, iconFileClosed] = [
    icon.open.replace(/^.*?folder_type_(.*?)_opened\..*$/, '$1'),
    icon.closed.replace(/^.*?folder_type_(.*?)\..*$/, '$1'),
  ]
  const cols = [name, names.join(':')]
  if (
    !['folder', 'root_folder'].includes(name) &&
    (name !== iconFileOpen || iconFileOpen !== iconFileClosed)
  )
    cols.push(iconFileOpen, iconFileClosed)
  return cols
}

exports.fileName = fileName
exports.link = link
exports.parsePageContent = parsePageContent
exports.prepareCSV = prepareCSV
