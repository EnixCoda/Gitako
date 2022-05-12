import {
  ChevronDownIcon as ChevronDown,
  ChevronRightIcon as ChevronRight,
  ClockIcon as Clock,
  CommentIcon as Comment,
  DiffAddedIcon as DiffAdded,
  DiffIcon as Diff,
  DiffIgnoredIcon as DiffIgnored,
  DiffModifiedIcon as DiffModified,
  DiffRemovedIcon as DiffRemoved,
  DiffRenamedIcon as DiffRenamed,
  FileCodeIcon as FileCode,
  FileIcon as File,
  FileMediaIcon as FileMedia,
  FileSubmoduleIcon as Submodule,
  FileZipIcon as FileZip,
  GearIcon as Gear,
  GrabberIcon as Grabber,
  HourglassIcon as Hourglass,
  IconProps,
  MarkdownIcon as Markdown,
  PinIcon as Pin,
  ReplyIcon as Reply,
  SearchIcon as Search,
  TabIcon as Tab,
  XIcon as X
} from '@primer/octicons-react'
import * as React from 'react'
import { cx } from 'utils/cx'

const iconToComponentMap = {
  Search,
  Clock,
  Comment,
  Diff,
  DiffAdded,
  DiffIgnored,
  DiffModified,
  DiffRemoved,
  DiffRenamed,
  Hourglass,
  Submodule,
  Grabber,
  ChevronDown,
  X,
  Gear,
  ChevronRight,
  Reply,
  FileZip,
  Markdown,
  FileMedia,
  FileCode,
  File,
  Pin,
  Tab,
}

const defaultIcon = 'File'
const typeToIconComponentMap: {
  [type: string]: keyof typeof iconToComponentMap
} = {
  search: 'Search',
  loading: 'Clock',
  hourglass: 'Hourglass',
  submodule: 'Submodule',
  grabber: 'Grabber',
  comment: 'Comment',
  x: 'X',
  pin: 'Pin',
  tab: 'Tab',
  gear: 'Gear',
  diff: 'Diff',
  diffAdded: 'DiffAdded',
  diffIgnored: 'DiffIgnored',
  diffModified: 'DiffModified',
  diffRemoved: 'DiffRemoved',
  diffRenamed: 'DiffRenamed',
  folder: 'ChevronRight',
  'chevron-down': 'ChevronDown',
  'go-to': 'Reply',
  '.zip': 'FileZip',
  '.rar': 'FileZip',
  '.7z': 'FileZip',
  '.md': 'Markdown',
  '.png': 'FileMedia',
  '.jpg': 'FileMedia',
  '.gif': 'FileMedia',
  '.bmp': 'FileMedia',
  '.js': 'FileCode',
  '.jsx': 'FileCode',
  '.ts': 'FileCode',
  '.tsx': 'FileCode',
  '.es6': 'FileCode',
  '.coffee': 'FileCode',
  '.css': 'FileCode',
  '.less': 'FileCode',
  '.scss': 'FileCode',
  '.sass': 'FileCode',
}

type Props = {
  type: string
  className?: string
  placeholder?: boolean
  onClick?: (event: React.MouseEvent<HTMLElement>) => void
} & IconProps

export const Icon = React.memo(function Icon({
  type,
  className = undefined,
  placeholder,
  ...otherProps
}: Props) {
  let children: React.ReactNode = null
  if (!placeholder) {
    const name = typeToIconComponentMap[type] || defaultIcon
    const IconComponent = iconToComponentMap[name]
    children = <IconComponent className={cx('octicon', name)} {...otherProps} />
  }
  return (
    <div className={cx('octicon-wrapper', className)} {...otherProps}>
      {children}
    </div>
  )
})
