import Octicon, {
  ChevronDown,
  File,
  FileCode,
  FileMedia,
  FilePdf,
  FileSubmodule as Submodule,
  FileZip,
  Gear,
  Grabber,
  Markdown,
  Octoface,
  Reply,
  TriangleRight,
  X,
} from '@primer/octicons-react'
import * as React from 'react'
import cx from 'utils/cx'

function getSVGIconComponent(type: string) {
  switch (type) {
    case 'submodule':
      return Submodule
    case 'grabber':
      return Grabber
    case 'octoface':
      return Octoface
    case 'chevron-down':
      return ChevronDown
    case 'x':
      return X
    case 'gear':
      return Gear
    case 'folder':
      return TriangleRight
    case 'go-to':
      return Reply
    case '.pdf':
      return FilePdf
    case '.zip':
    case '.rar':
    case '.7z':
      return FileZip
    case '.md':
      return Markdown
    case '.png':
    case '.jpg':
    case '.gif':
    case '.bmp':
      return FileMedia
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
      return FileCode
    // TODO: adapt to more file types
    // case '': return FileBinary
    // case '': return FileSubmodule
    // case '': return FileSymlinkDirectory
    // case '': return FileSymlinkFile
    default:
      return File
  }
}

type Props = {
  type: string
  className?: string
  onClick?: (event: React.MouseEvent<HTMLElement>) => void
}

const Icon: React.SFC<Props> = function Icon({ type, className = undefined, ...otherProps }) {
  const icon = getSVGIconComponent(type)
  return (
    <div className={cx('octicon-wrapper', className)} {...otherProps}>
      {React.createElement(Octicon, {
        icon,
        className: cx('octicon', icon.name),
      })}
    </div>
  )
}

export default Icon
