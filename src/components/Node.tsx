import * as React from 'react'
import Icon from 'components/Icon'
import cx from 'utils/cx'
import LoadingIndicator from 'components/LoadingIndicator'
import { TreeNode } from 'utils/VisibleNodesGenerator'

function getIconType(node: TreeNode) {
  switch (node.type) {
    case 'tree':
      return 'folder'
    case 'commit':
      return 'submodule'
    default:
      return node.name.replace(/.*\./, '.')
  }
}

type Props = {
  node: TreeNode
  onClick(node: TreeNode): void
  depth: number
  expanded: boolean
  focused: boolean
  renderActions?(): React.ReactNode
}
export default class Node extends React.PureComponent<Props> {
  onClick: React.MouseEventHandler = event => {
    if (event.metaKey) return
    event.preventDefault()
    const { node, onClick } = this.props
    onClick(node)
  }

  render() {
    const { node, depth, expanded, focused, renderActions } = this.props
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
            <div>
              <Icon type={getIconType(node)} />
              <span className={'node-item-name'}>{name}</span>
            </div>
            {renderActions && <div>{renderActions()}</div>}
          </div>
        </a>
      </div>
    )
  }
}
