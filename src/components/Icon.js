import React from 'react'

import cx from '../utils/cx'

function getSVGIconComponent(type) {
  switch (type) {
    case 'submodule':
      return 'Submodule'
    case 'grabber':
      return 'Grabber'
    case 'octoface':
      return 'Octoface'
    case 'chevron-down':
      return 'ChevronDown'
    case 'x':
      return 'X'
    case 'gear':
      return 'Gear'
    case 'folder':
      return 'TriangleRight'
    case '.pdf':
      return 'FilePdf'
    case '.zip':
    case '.rar':
    case '.7z':
      return 'FileZip'
    case '.md':
      return 'Markdown'
    case '.png':
    case '.jpg':
    case '.gif':
    case '.bmp':
      return 'FileMedia'
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
      return 'FileCode'
    // TODO: adapt to more file types
    // case '': return 'FileBinary'
    // case '': return 'FileSubmodule'
    // case '': return 'FileSymlinkDirectory'
    // case '': return 'FileSymlinkFile'
    default:
      return 'File'
  }
}
export default function Icon({ type, className, ...otherProps }) {
  return (
    <div className={cx('octicon-wrapper', className)} {...otherProps}>
      {/* {React.createElement(getSVGIconComponent(type), iconStyle)} */}
      <SVG name={type} />
    </div>
  )
}

function titlecase(o = '') {
  return o.replace(/-./, s => s[1].toUpperCase()).replace(/^./, s => s.toUpperCase())
}

function importAll (r) {
  const map = {}
  r.keys().forEach((key) => {
    const module = r(key)
    map[titlecase(key.replace(/^.*?(\w.*)\.svg$/, '$1'))] = module.default
  })
  return map
}

const svgMap = importAll(require.context('../assets/icons/octicons', true, /\.svg$/))

export function SVG({ name, className, onClick }) {
  const svgObj = svgMap[name] || svgMap[getSVGIconComponent(name)]
  if (!svgObj) {
    console.error(`SVG '${name}' does not exist.`)
    return null
  }
  console.log('found', name, svgObj)
  const { id, viewBox } = svgObj
  return (
    <span role="none" onClick={onClick} className={className}>
      <svg className={`gitako-svg-icon gitako-svg-icon-${id}`} viewBox={viewBox}>
        <use xlinkHref={`#${id}`} />
      </svg>
    </span>
  )
}
