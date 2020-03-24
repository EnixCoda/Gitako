import rawFileIconIndex from 'assets/icons/file-icons-index.csv'
import rawFolderIconIndex from 'assets/icons/folder-icons-index.csv'

function parseFileIconMapCSV() {
  const filenameIndex = new Map<string, string>()
  const fileExtensionIndex = new Map<string, string>()
  rawFileIconIndex.split('\n').forEach(line => {
    if (!line) return
    const [name, names, exts] = line.split(',')
    if (names) {
      names.split(':').forEach(filename => {
        if (!filename) return
        filenameIndex.set(filename, name)
      })
    }
    if (exts) {
      exts.split(':').forEach(ext => {
        if (!ext) return
        fileExtensionIndex.set(ext, name)
      })
    }
  })
  return {
    filenameIndex,
    fileExtensionIndex,
  }
}

function parseFolderIconMapCSV() {
  const folderNameIndex = new Map<string, string>()
  rawFolderIconIndex.split('\n').forEach(line => {
    if (!line) return
    const [name, names] = line.split(',')
    names.split(':').forEach(folderName => {
      if (!folderName) return
      folderNameIndex.set(folderName, name)
    })
  })
  return {
    folderNameIndex,
  }
}

const { folderNameIndex } = parseFolderIconMapCSV()

export function getFolderIconSrc(node: TreeNode, open: boolean) {
  const name = folderNameIndex.get(node.name.toLowerCase())
  return getIconSrc('folder', name, open)
}

const { filenameIndex, fileExtensionIndex } = parseFileIconMapCSV()

export function getFileIconSrc(node: TreeNode) {
  const fileName = node.name.toLowerCase()
  let iconName = filenameIndex.get(fileName)
  if (!iconName) {
    const tail = fileName.split('.')
    tail.shift()
    while (!iconName && tail.length > 0) {
      iconName = fileExtensionIndex.get(tail.join('.'))
      tail.shift()
    }
  }
  return getIconSrc('file', iconName)
}

// memorize for
// 1. swap time with space
// 2. prevent app crash on when extension context invalidates
const extensionURL = browser.runtime.getURL('').replace(/\/$/, '')
export function getIconSrc(type: 'folder' | 'file', name: string = 'default', open?: boolean) {
  const filename =
    (name === 'default' ? 'default_' + type : type + '_type_' + name) +
    (open ? '_opened' : '') +
    '.svg'
  return extensionURL + `/icons/vscode/${filename}`
}
