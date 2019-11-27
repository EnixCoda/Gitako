import Octicon, {
  ChevronDown,
  ChevronRight,
  File,
  FileCode,
  FileMedia,
  FilePdf,
  FileSubmodule as Submodule,
  FileZip,
  Gear,
  Grabber,
  Icon as OcticonIcon,
  Markdown,
  Octoface,
  Reply,
  X,
} from '@primer/octicons-react'
import * as React from 'react'
import { cx } from 'utils/cx'

function getSVGIconComponent(
  type: string,
): {
  IconComponent: OcticonIcon
  name: string
} {
  switch (type) {
    case 'submodule':
      return {
        IconComponent: Submodule,
        name: 'Submodule',
      }
    case 'grabber':
      return {
        IconComponent: Grabber,
        name: 'Grabber',
      }
    case 'octoface':
      return {
        IconComponent: Octoface,
        name: 'Octoface',
      }
    case 'chevron-down':
      return {
        IconComponent: ChevronDown,
        name: 'ChevronDown',
      }
    case 'x':
      return {
        IconComponent: X,
        name: 'X',
      }
    case 'gear':
      return {
        IconComponent: Gear,
        name: 'Gear',
      }
    case 'folder':
      return {
        IconComponent: ChevronRight,
        name: 'ChevronRight',
      }
    case 'go-to':
      return {
        IconComponent: Reply,
        name: 'Reply',
      }
    case '.pdf':
      return {
        IconComponent: FilePdf,
        name: 'FilePdf',
      }
    case '.zip':
    case '.rar':
    case '.7z':
      return {
        IconComponent: FileZip,
        name: 'FileZip',
      }
    case '.md':
      return {
        IconComponent: Markdown,
        name: 'Markdown',
      }
    case '.png':
    case '.jpg':
    case '.gif':
    case '.bmp':
      return {
        IconComponent: FileMedia,
        name: 'FileMedia',
      }
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
      return {
        IconComponent: FileCode,
        name: 'FileCode',
      }
    // TODO: adapt to more file types
    // case '': return FileBinary
    // case '': return FileSubmodule
    // case '': return FileSymlinkDirectory
    // case '': return FileSymlinkFile
    default:
      return {
        IconComponent: File,
        name: 'File',
      }
  }
}

type Props = {
  type: string
  className?: string
  onClick?: (event: React.MouseEvent<HTMLElement>) => void
}

export function Icon({ type, className = undefined, ...otherProps }: Props) {
  const { name, IconComponent } = getSVGIconComponent(type)
  const mergedClassName = cx('octicon', name)
  return (
    <div className={cx('octicon-wrapper', className)} {...otherProps}>
      {React.createElement(Octicon, {
        icon: IconComponent,
        className: mergedClassName,
      })}
    </div>
  )
}
