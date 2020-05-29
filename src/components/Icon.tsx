import {
  ChevronDownIcon as ChevronDown,
  ChevronRightIcon as ChevronRight,
  FileCodeIcon as FileCode,
  FileIcon as File,
  FileMediaIcon as FileMedia,
  FileSubmoduleIcon as Submodule,
  FileZipIcon as FileZip,
  GearIcon as Gear,
  GrabberIcon as Grabber,
  HourglassIcon as Hourglass,
  Icon as OcticonIcon,
  IconProps,
  MarkdownIcon as Markdown,
  OctofaceIcon as Octoface,
  ReplyIcon as Reply,
  XIcon as X,
} from '@primer/octicons-v2-react'
import * as React from 'react'
import { cx } from 'utils/cx'

function getSVGIconComponent(
  type: string,
): {
  IconComponent: OcticonIcon
  name: string
} {
  switch (type) {
    case 'hourglass':
      return {
        IconComponent: Hourglass,
        name: 'Hourglass',
      }
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
    // not supported in octicon v2 yet
    // case '.pdf':
    //   return {
    //     IconComponent: FilePdf,
    //     name: 'FilePdf',
    //   }
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
  placeholder?: boolean
  onClick?: (event: React.MouseEvent<HTMLElement>) => void
} & IconProps

export function Icon({ type, className = undefined, placeholder, ...otherProps }: Props) {
  let children: React.ReactNode = null
  if (!placeholder) {
    const { name, IconComponent } = getSVGIconComponent(type)
    children = <IconComponent className={cx('octicon', name)} {...otherProps} />
  }
  return (
    <div className={cx('octicon-wrapper', className)} {...otherProps}>
      {children}
    </div>
  )
}
