import { useConfigs } from 'containers/ConfigsContext'
import * as React from 'react'
import { cx } from 'utils/cx'
import { OperatingSystems, os } from 'utils/general'
import { TreeNode } from 'utils/VisibleNodesGenerator'
import { getFileIconSrc, getFolderIconSrc } from '../utils/parseIconMapCSV'
import { Icon } from './Icon'

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
export function Node({ node, depth, expanded, focused, renderActions, style, onClick }: Props) {
  const onClickNode: React.MouseEventHandler = React.useCallback(
    event => {
      if (
        (os === OperatingSystems.macOS && event.metaKey) ||
        (os === OperatingSystems.Windows && event.ctrlKey)
      ) {
        // The default behavior, open in new tab
        return
      }
      event.preventDefault()

      onClick(node)
    },
    [node, onClick],
  )

  const { name, path } = node
  return (
    <div
      className={cx(`node-item-row`, { focused, disabled: node.accessDenied })}
      style={style}
      title={path}
    >
      <a href={node.url} onClick={onClickNode}>
        <div
          className={cx('node-item', { expanded })}
          style={{ paddingLeft: `${10 + 20 * depth}px` }}
        >
          <div className={'node-item-label'}>
            <NodeItemIcon node={node} open={expanded} />
            <span className={'node-item-name'}>{name}</span>
          </div>
          {renderActions && <div>{renderActions(node)}</div>}
        </div>
      </a>
    </div>
  )
}

const NodeItemIcon = React.memo(function NodeItemIcon({
  node,
  open = false,
}: {
  node: TreeNode
  open?: boolean
}) {
  const {
    val: { icons },
  } = useConfigs()

  if (icons === 'native') return <Icon type={getIconType(node)} />
  const src = React.useMemo(
    () => (node.type === 'tree' ? getFolderIconSrc(node, open) : getFileIconSrc(node)),
    [open],
  )
  return (
    <>
      <Icon placeholder={node.type !== 'tree'} type={getIconType(node)} />
      {node.type === 'commit' ? (
        <Icon type={getIconType(node)} />
      ) : (
        <img alt={node.name} className={cx('node-item-icon', { dim: icons === 'dim' })} src={src} />
      )}
    </>
  )
})
