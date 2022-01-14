import rawFileIconIndex from 'assets/icons/file-icons-index.csv'
import rawFolderIconIndex from 'assets/icons/folder-icons-index.csv'

const rowSeparator = '\n'
const colSeparator = ','
const arraySeparator = ':'

function parseFileIconMapCSV() {
  const filenameIndex = new Map<string, string>()
  const fileExtensionIndex = new Map<string, string>()
  for (const line of rawFileIconIndex.split(rowSeparator)) {
    if (!line) continue
    const [name, names, exts] = line.split(colSeparator)
    if (names) {
      for (const filename of names.split(arraySeparator)) {
        if (!filename) continue
        filenameIndex.set(filename, name)
      }
    }
    if (exts) {
      for (const ext of exts.split(arraySeparator)) {
        if (!ext) continue
        fileExtensionIndex.set(ext, name)
      }
    }
  }
  return {
    filenameIndex,
    fileExtensionIndex,
  }
}

function parseFolderIconMapCSV() {
  const folderNameIndex = new Map<string, string>()
  for (const line of rawFolderIconIndex.split(rowSeparator)) {
    if (!line) continue
    const [name, names] = line.split(colSeparator)
    for (const folderName of names.split(arraySeparator)) {
      if (!folderName) continue
      folderNameIndex.set(folderName, name)
    }
  }
  return {
    folderNameIndex,
  }
}

const { folderNameIndex } = parseFolderIconMapCSV()

export function getFolderIconURL(node: TreeNode, open: boolean) {
  const name = folderNameIndex.get(node.name.toLowerCase())
  return getIconURL('folder', name, open)
}

const { filenameIndex, fileExtensionIndex } = parseFileIconMapCSV()

export function getFileIconURL(node: TreeNode) {
  const fileName = node.name.toLowerCase()
  let iconName = filenameIndex.get(fileName)
  if (!iconName) {
    const tail = fileName.split('.')
    while (!iconName && tail.length > 0) {
      iconName = fileExtensionIndex.get(tail.join('.'))
      tail.shift()
    }
  }
  return getIconURL('file', iconName)
}

// memorize for
// 1. swap time with space
// 2. prevent app crash on when extension context invalidates
const extensionURL = browser.runtime.getURL('').replace(/\/$/, '')
export function getIconURL(type: 'folder' | 'file', name: string = 'default', open?: boolean) {
  const filename =
    (name === 'default' ? 'default_' + type : type + '_type_' + name) +
    (open ? '_opened' : '') +
    '.svg'
  return extensionURL + `/icons/vscode/${filename}`
}
