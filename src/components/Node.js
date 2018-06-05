import preact from 'preact'
/** @jsx preact.h */
import PJAX from 'pjax'

import Icon from './Icon'

import cx from '../utils/cx'
import general from '../utils/general'
import DOMHelper from '../utils/DOMHelper'

function getIconType(node) {
  switch (node.type) {
    case 'tree':
      return 'folder'
    default:
      return node.name.replace(/.*\./, '.')
  }
}

export default class Node extends preact.Component {
  shouldComponentUpdate(nextProps) {
    return !general.shallowEqual(this.props, nextProps)
  }

  onNodeClick = (...args) => {
    const { node, toggleExpand } = this.props
    if (node.type === 'tree') {
      toggleExpand(node, ...args)
    } else {
      DOMHelper.loadWithPJAX(node.url)
    }
  }

  render() {
    const { node, depth, expanded, focused, pjax } = this.props
    const { name, path } = node
    return (
      <div className={cx(`node-item-row`, { focused })} title={path}>
        <p
          className={cx('node-item', { expanded })}
          style={{ paddingLeft: `${10 + 20 * depth}px` }}
          onClick={this.onNodeClick}
        >
          <Icon type={getIconType(node)} />
          <span className={'node-item-name'}>{name}</span>
        </p>
      </div>
    )
  }
}
