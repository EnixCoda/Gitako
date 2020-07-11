import { useConfigs } from 'containers/ConfigsContext'
import * as React from 'react'
import { cx } from 'utils/cx'
import { OperatingSystems, os } from 'utils/general'
import { getFileIconSrc, getFolderIconSrc } from '../utils/parseIconMapCSV'
import { Highlight } from './Highlight'
import { Icon } from './Icon'
import { useStates } from 'utils/hooks/useStates'

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
  renderActions?(node: TreeNode): React.ReactNode
  style?: React.CSSProperties
  regex?: RegExp
}
export function Node({
  node,
  depth,
  expanded,
  focused,
  renderActions,
  style,
  onClick,
  regex,
}: Props) {
  const { name, path } = node
  const hover = useStates(false)
  return (
    <a
      href={node.url}
      onClick={event => {
        if (
          (os === OperatingSystems.macOS && event.metaKey) ||
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
      onMouseOver={() => hover.set(true)}
      onMouseOut={() => hover.set(false)}
    >
      <div className={'node-item-label'}>
        <NodeItemIcon node={node} open={expanded} hover={hover.val} />
        {name.includes('/') ? (
          name.split('/').map((chunk, index) => (
            <React.Fragment key={chunk}>
              {index > 0 && '/'}
              <Highlight match={regex} text={chunk} />
            </React.Fragment>
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
  hover = false,
}: {
  node: TreeNode
  open?: boolean
  hover?: boolean
}) {
  const {
    val: { icons },
  } = useConfigs()

  const hoverBlob = hover && node.type === 'blob'

  if (icons === 'native') return <Icon type={hoverBlob ? 'hover' : getIconType(node)} />

  const src = React.useMemo(
    () => (node.type === 'tree' ? getFolderIconSrc(node, open) : getFileIconSrc(node)),
    [open],
  )

  return (
    <>
      <Icon
        className={'node-item-type-icon'}
        placeholder={node.type !== 'tree'}
        type={getIconType(node)}
      />
      {node.type === 'commit' ? (
        <Icon type={getIconType(node)} />
      ) : hoverBlob ? (
        <Icon type={'hover'} />
      ) : (
        <img alt={node.name} className={cx('node-item-icon', { dim: icons === 'dim' })} src={src} />
      )}
    </>
  )
})
