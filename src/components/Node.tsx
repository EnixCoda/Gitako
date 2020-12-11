import { useConfigs } from 'containers/ConfigsContext'
import * as React from 'react'
import { cx } from 'utils/cx'
import { OperatingSystems, os } from 'utils/general'
import { getFileIconSrc, getFolderIconSrc } from '../utils/parseIconMapCSV'
import { Highlight } from './Highlight'
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
  style?: React.CSSProperties
  regex?: RegExp
}
export function Node({
  node,
  depth,
  expanded,
  focused,
  loading,
  renderActions,
  style,
  onClick,
  regex,
}: Props) {
  const { name, path } = node
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
      className={cx(`node-item`, { focused, disabled: node.accessDenied, expanded })}
      style={{ ...style, paddingLeft: `${10 + 20 * depth}px` }}
      title={path}
    >
      <div className={'node-item-label'}>
        <NodeItemIcon node={node} open={expanded} loading={loading} />
        {name.includes('/') ? (
          name.split('/').map((chunk, index, arr) => (
            <span key={chunk} className={cx({ prefix: index + 1 !== arr.length })}>
              <Highlight match={regex} text={chunk} />
              {index + 1 !== arr.length && '/'}
            </span>
          ))
        ) : (
          <Highlight match={regex} text={name} />
        )}
      </div>
      {renderActions && <div>{renderActions(node)}</div>}
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
    val: { icons },
  } = useConfigs()

  const src = React.useMemo(
    () => (node.type === 'tree' ? getFolderIconSrc(node, open) : getFileIconSrc(node)),
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
