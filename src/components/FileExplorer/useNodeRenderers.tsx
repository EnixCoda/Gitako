import { useConfigs } from 'containers/ConfigsContext'
import * as React from 'react'
import { isNotFalsy } from 'utils/general'
import { Icon } from '../Icon'
import { SearchMode } from '../searchModes'
import { DiffStatGraph } from './DiffStatGraph'
import { DiffStatText } from './DiffStatText'

export type NodeRenderer = (node: TreeNode) => React.ReactNode

export function useNodeRenderers(allRenderers: (NodeRenderer | null | undefined)[]) {
  return React.useMemo(() => {
    const renderers: NodeRenderer[] = allRenderers.filter(isNotFalsy)
    return renderers.length
      ? (node: TreeNode) =>
          renderers.map((render, i) => <React.Fragment key={i}>{render(node)}</React.Fragment>)
      : undefined
  }, allRenderers)
}

export function useRenderFileStatus() {
  function renderFileStatus({ diff }: TreeNode) {
    return (
      diff && (
        <span
          className={'node-item-diff'}
          title={`${diff.status}, ${diff.changes} changes: +${diff.additions} & -${diff.deletions}`}
        >
          {showDiffInText ? <DiffStatText diff={diff} /> : <DiffStatGraph diff={diff} />}
        </span>
      )
    )
  }
  const { showDiffInText } = useConfigs().value
  return React.useMemo(() => renderFileStatus, [])
}

export function useRenderFileCommentAmounts() {
  function renderFileCommentAmounts(node: TreeNode) {
    return node.comments?.active ? (
      <span
        className={'node-item-comment'}
        title={`${node.comments.active + node.comments.resolved} comments, ${
          node.comments.active
        } active, ${node.comments.resolved} resolved`}
      >
        <Icon type={'comment'} /> {node.comments.active > 9 ? '9+' : node.comments.active}
      </span>
    ) : null
  }
  const { commentToggle } = useConfigs().value
  return React.useMemo(() => (commentToggle ? renderFileCommentAmounts : null), [])
}

export function useRenderFindInFolderButton(
  onSearch: (searchKey: string, searchMode: SearchMode) => void,
) {
  function renderFindInFolderButton(node: TreeNode) {
    return node.type === 'tree' ? (
      <button
        title={'Find in folder...'}
        className={'find-in-folder-button'}
        onClick={e => {
          e.stopPropagation()
          e.preventDefault()
          onSearch(node.path + '/', searchMode)
        }}
      >
        <Icon type="search" />
      </button>
    ) : null
  }
  const { searchMode } = useConfigs().value
  return React.useMemo(
    () => (searchMode === 'fuzzy' ? renderFindInFolderButton : null),
    [searchMode],
  )
}

export function useRenderGoToButton(searched: boolean, goTo: (path: string[]) => void) {
  function renderGoToButton(node: TreeNode): React.ReactNode {
    return (
      <button
        title={'Reveal in file tree'}
        className={'go-to-button'}
        onClick={e => {
          e.stopPropagation()
          e.preventDefault()
          goTo(node.path.split('/'))
        }}
      >
        <Icon type="go-to" />
      </button>
    )
  }
  return React.useMemo(() => (searched ? renderGoToButton : null), [searched])
}