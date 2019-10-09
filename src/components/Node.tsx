import Icon from 'components/Icon'
import * as React from 'react'
import cx from 'utils/cx'
import { OperatingSystems, os } from 'utils/general'
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
  renderActions?(node: TreeNode): React.ReactNode
  style?: React.CSSProperties
}
export default class Node extends React.PureComponent<Props> {
  onClick: React.MouseEventHandler = event => {
    if (
      (os === OperatingSystems.macOS && event.metaKey) ||
      (os === OperatingSystems.Windows && event.ctrlKey)
    ) {
      // Open in new tab
      return
    }
    event.preventDefault()
    const { node, onClick } = this.props
    onClick(node)
  }

  render() {
    const { node, depth, expanded, focused, renderActions, style } = this.props
    const { name, path } = node
    return (
      <div
        className={cx(`node-item-row`, { focused, disabled: node.accessDenied })}
        style={style}
        title={path}
      >
        <a href={node.url} onClick={this.onClick}>
          <div
            className={cx('node-item', { expanded })}
            style={{ paddingLeft: `${10 + 20 * depth}px` }}
          >
            <div className={'node-item-label'}>
              <Icon type={getIconType(node)} />
              <span className={'node-item-name'}>{name}</span>
            </div>
            {renderActions && <div>{renderActions(node)}</div>}
          </div>
        </a>
      </div>
    )
  }
}
