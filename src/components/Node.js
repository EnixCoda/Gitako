import preact from 'preact'
/** @jsx preact.h */

import Icon from './Icon'

import cx from '../utils/cx'

function getIconType(node) {
  switch (node.type) {
    case 'tree':
      return 'folder'
    default:
      return node.name.replace(/.*\./, '.')
  }
}

export default function Node({ node, depth, expanded, focused, toggleExpand }) {
  const { name, url, type } = node
  const item = (
    <p
      className={cx('node-item', { expanded })}
      style={{ paddingLeft: `${10 + 20 * depth}px` }}
      onClick={node.type === 'tree' ? toggleExpand : undefined}
    >
      <Icon type={getIconType(node)} />
      <span className={'node-item-name'}>{name}</span>
    </p>
  )
  return (
    <div className={cx(`node-item-row`, { focused })}>
      {
        type !== 'tree'
          ? (
            <a className={'pjax-link'} href={url} tabIndex={-1}>
              { item }
            </a>
          )
          : item
      }
    </div>
  )
}
