import preact from 'preact'
/** @jsx preact.h */

function getIconClassName(type) {
  switch (type) {
    case 'folder':
      return 'triangle-right'
    case '.pdf':
      return 'file-pdf'
    case '.txt':
      return 'file-text'
    case '.zip':
    case '.rar':
    case '.7z':
      return 'file-zip'
    case '.md':
      return 'markdown'
    case '.png':
    case '.jpg':
    case '.gif':
    case '.bmp':
      return 'file-media'
    case '.js':
    case '.jsx':
    case '.ts':
    case '.tsx':
    case '.es6':
    case '.coffee':
    case '.css':
    case '.less':
    case '.scss':
    case '.sass':
      return 'file-code'
    // TODO: adapt to more file types
    // case '': return 'file-binary'
    // case '': return 'file-submodule'
    // case '': return 'file-symlink-directory'
    // case '': return 'file-symlink-file'
    default:
      return 'file'
  }
}

export default function Icon({ type }) {
  return <span className={`octicon octicon-${getIconClassName(type)} octicon-color`} />
}
