import { useConfigs } from 'containers/ConfigsContext'
import * as React from 'react'
import { cx } from 'utils/cx'
import { OperatingSystems, os } from 'utils/general'
import { getFileIconURL, getFolderIconURL } from 'utils/parseIconMapCSV'
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
  onClick(event: React.MouseEvent<HTMLElement, MouseEvent>, node: TreeNode): void
  depth: number
  expanded: boolean
  focused: boolean
  loading: boolean
  renderActions?(node: TreeNode): React.ReactNode
  renderLabelText(node: TreeNode): React.ReactNode
  style?: React.CSSProperties
}
export function Node({
  node,
  depth,
  expanded,
  focused,
  loading,
  renderActions,
  renderLabelText,
  style,
  onClick,
}: Props) {
  const { compactFileTree: compact } = useConfigs().value
  return (
    <a
      href={node.url}
      onClick={event => {
        if (
          (os === OperatingSystems.macOS && event.metaKey) ||
          (os === OperatingSystems.Linux && event.ctrlKey) ||
          (os === OperatingSystems.Windows && event.ctrlKey)
        ) {
          // The default behavior, open in new tab
          return
        }

        onClick(event, node)
      }}
      className={cx(`node-item`, { focused, disabled: node.accessDenied, expanded, compact })}
      style={{ ...style, paddingLeft: `${10 + (compact ? 10 : 20) * depth}px` }}
      title={node.path}
    >
      <div className={'node-item-label'}>
        <NodeItemIcon node={node} open={expanded} loading={loading} />
        {renderLabelText(node)}
      </div>
      {renderActions && <div className={'actions'}>{renderActions(node)}</div>}
    </a>
  )
}

const NodeItemIcon = React.memo(function NodeItemIcon({
  node,
  open = false,
  loading,
}: {
  node: TreeNode
  open?: boolean
  loading?: boolean
}) {
  const {
    value: { icons },
  } = useConfigs()

  const src = React.useMemo(
    () => (node.type === 'tree' ? getFolderIconURL(node, open) : getFileIconURL(node)),
    [open],
  )

  if (icons === 'native') return <Icon type={getIconType(node)} />
  return (
    <>
      <Icon
        className={'node-item-type-icon'}
        placeholder={node.type !== 'tree'}
        type={loading ? 'loading' : getIconType(node)}
      />
      {node.type === 'commit' ? (
        <Icon type={getIconType(node)} />
      ) : (
        <img alt={node.name} className={cx('node-item-icon', { dim: icons === 'dim' })} src={src} />
      )}
    </>
  )
})
