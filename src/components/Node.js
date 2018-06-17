import React from 'react'

import Icon from './Icon'

import cx from '../utils/cx'
import DOMHelper from '../utils/DOMHelper'

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
  onNodeClick = () => {
    const { node, toggleExpand } = this.props
    if (node.type === 'tree') {
      toggleExpand(node, true)
    } else if (node.type === 'blob') {
      DOMHelper.loadWithPJAX(node.url)
    } else if (node.type === 'commit') {
      DOMHelper.loadWithPJAX(node.parent.url)
    }
  }

  render() {
    const { node, depth, expanded, focused } = this.props
    const { name, path } = node
    return (
      <div className={cx(`node-item-row`, { focused })} title={path}>
        <div
          className={cx('node-item', { expanded })}
          style={{ paddingLeft: `${10 + 20 * depth}px` }}
          onClick={this.onNodeClick}
        >
          <Icon type={getIconType(node)} />
          <span className={'node-item-name'}>{name}</span>
        </div>
      </div>
    )
  }
}
