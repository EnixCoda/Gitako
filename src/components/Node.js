import React from 'react'

import Icon from './Icon'

import cx from '../utils/cx'
import DOMHelper from '../utils/DOMHelper'
import LoadingIndicator from './LoadingIndicator';

function getIconType(node) {
  switch (node.type) {
    case 'tree':
      return 'folder'
    case 'commit':
      return 'submodule'
    default:
      return node.name.replace(/.*\./, '.')
  }
}

export default class Node extends React.PureComponent {
  onClick = (event) => {
    if (event.metaKey) return
    event.preventDefault()
    const { node, onClick } = this.props
    onClick(node)
  }

  render() {
    const { node, depth, expanded, focused } = this.props
    const { name, path, virtual } = node
    if (virtual) {
      // this is not a real node
      // for now, all virtual nodes are indicators for pending state
      return (
        <div className={cx(`node-item-row`, { focused })}>
          <div className={'node-item'}>
            <LoadingIndicator text={name} />
          </div>
        </div>
      )
    }
    return (
      <div className={cx(`node-item-row`, { focused })} title={path}>
        <a href={node.url} onClick={this.onClick}>
          <div
            className={cx('node-item', { expanded })}
            style={{ paddingLeft: `${10 + 20 * depth}px` }}
          >
            <Icon type={getIconType(node)} />
            <span className={'node-item-name'}>{name}</span>
          </div>
        </a>
      </div>
    )
  }
}
