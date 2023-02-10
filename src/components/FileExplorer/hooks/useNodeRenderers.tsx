import {
  CheckIcon,
  CommentIcon,
  CrossReferenceIcon,
  KebabHorizontalIcon,
} from '@primer/octicons-react'
import { ActionList, AnchoredOverlay } from '@primer/react'
import { useConfigs } from 'containers/ConfigsContext'
import { PortalContext } from 'containers/PortalContext'
import { platform } from 'platforms'
import * as React from 'react'
import { useCopyToClipboard } from 'react-use'
import { cx } from 'utils/cx'
import { cancelEvent, onEnterKeyDown } from 'utils/DOMHelper'
import { is } from 'utils/is'
import { Icon } from '../../Icon'
import { SearchMode } from '../../searchModes'
import { DiffStatText } from '../DiffStatText'
import { DiffStatGraph } from './../DiffStatGraph'
import { VisibleNodesGeneratorMethods } from './useVisibleNodesGeneratorMethods'

export type NodeRenderer = (node: TreeNode) => React.ReactNode

export function useNodeRenderers(allRenderers: (NodeRenderer | null | undefined)[]) {
  return React.useMemo(() => {
    const renderers: NodeRenderer[] = allRenderers.filter(is.not.nil)
    return renderers.length
      ? (node: TreeNode) =>
          renderers.map((render, i) => <React.Fragment key={i}>{render(node)}</React.Fragment>)
      : undefined
  }, allRenderers) // eslint-disable-line react-hooks/exhaustive-deps
}

export function useRenderFileStatus() {
  const { showDiffInText } = useConfigs().value
  return React.useCallback(
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
    },
    [showDiffInText],
  )
}

function renderNodeContextMenu(node: TreeNode, methods: VisibleNodesGeneratorMethods) {
  return <NodeContextMenu node={node} visibleNodesGeneratorMethods={methods} />
}
export function useRenderMoreActions(methods: VisibleNodesGeneratorMethods) {
  return (node: TreeNode) => renderNodeContextMenu(node, methods)
}

function NodeContextMenu({
  node,
  visibleNodesGeneratorMethods: { toggleExpansion },
}: {
  node: TreeNode
  visibleNodesGeneratorMethods: VisibleNodesGeneratorMethods
}) {
  const [isOpen, setIsOpen] = React.useState(false)
  const [copied, setCopied] = React.useState<string | null>(null)
  const [copyState, copyToClipboard] = useCopyToClipboard()
  const portalName = React.useContext(PortalContext)
  const actionElements = {
    copyPermalink:
      node.permalink &&
      (() => {
        const mark = 'permalink'
        const onTrigger = (e: React.SyntheticEvent) => {
          cancelEvent(e)
          if (node.permalink) {
            copyToClipboard(node.permalink)
            setCopied(mark)
          }
        }
        return (
          <ActionList.Item {...getTriggerProps(onTrigger)}>
            Copy permalink
            {copyState.value && copied === mark ? (
              <ActionList.TrailingVisual>
                <CheckIcon />
              </ActionList.TrailingVisual>
            ) : null}
          </ActionList.Item>
        )
      })(),
    copyLink:
      node.url &&
      (() => {
        const mark = 'link'
        const onTrigger = (e: React.SyntheticEvent) => {
          cancelEvent(e)
          if (node.url) {
            copyToClipboard(node.url)
            setCopied(mark)
          }
        }
        return (
          <ActionList.Item {...getTriggerProps(onTrigger)}>
            Copy link
            {copyState.value && copied === mark ? (
              <ActionList.TrailingVisual>
                <CheckIcon />
              </ActionList.TrailingVisual>
            ) : null}
          </ActionList.Item>
        )
      })(),
    copyRelativePath: (() => {
      const mark = 'path'
      const onTrigger = (e: React.SyntheticEvent) => {
        cancelEvent(e)
        setCopied(mark)
        copyToClipboard(node.path)
      }
      return (
        <ActionList.Item {...getTriggerProps(onTrigger)}>
          Copy relative path
          {copyState.value && copied === mark ? (
            <ActionList.TrailingVisual>
              <CheckIcon />
            </ActionList.TrailingVisual>
          ) : null}
        </ActionList.Item>
      )
    })(),
    openRawContent: node.rawLink && (
      <ActionList.LinkItem
        onKeyDown={e =>
          onEnterKeyDown(e, () => e.target instanceof HTMLElement && e.target.click())
        }
        href={node.rawLink}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => setIsOpen(false)}
      >
        Open raw content
        <ActionList.TrailingVisual>
          <CrossReferenceIcon />
        </ActionList.TrailingVisual>
      </ActionList.LinkItem>
    ),
    goToDirectory: node.type === 'tree' && node.url && (
      <ActionList.LinkItem
        onKeyDown={e =>
          onEnterKeyDown(e, () => e.target instanceof HTMLElement && e.target.click())
        }
        href={node.url}
        data-gitako-bypass-click
        rel="noopener noreferrer"
        {...platform.delegateFastRedirectAnchorProps?.({ node })}
        onClick={() => setIsOpen(false)}
      >
        Go to directory
      </ActionList.LinkItem>
    ),
    toggleFolderRecursively:
      node.type === 'tree' &&
      (() => {
        const trigger = (e: React.SyntheticEvent) => {
          cancelEvent(e)
          toggleExpansion(node, { recursive: true })
          setIsOpen(false)
        }
        return (
          <ActionList.LinkItem
            {...getTriggerProps(trigger)}
            href={node.url}
            rel="noopener noreferrer"
          >
            Toggle folder recursively
          </ActionList.LinkItem>
        )
      })(),
  }

  return (
    <AnchoredOverlay
      renderAnchor={anchorProps => (
        <button
          {...anchorProps}
          aria-label={`More actions`}
          className={cx('context-menu', anchorProps.className, { active: isOpen })}
        >
          <Icon IconComponent={KebabHorizontalIcon} />
        </button>
      )}
      open={isOpen}
      onOpen={() => setIsOpen(true)}
      onClose={() => setIsOpen(false)}
      overlayProps={{
        portalContainerName: portalName || undefined,
        onKeyDown: e => cancelEvent(e),
      }}
    >
      <ActionList>
        {actionElements.copyPermalink}
        {actionElements.copyLink}
        {actionElements.copyRelativePath}

        {(actionElements.openRawContent ||
          actionElements.goToDirectory ||
          actionElements.toggleFolderRecursively) && <ActionList.Divider />}

        {actionElements.openRawContent}
        {actionElements.goToDirectory}
        {actionElements.toggleFolderRecursively}
      </ActionList>
    </AnchoredOverlay>
  )
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
        <Icon IconComponent={CommentIcon} />
        &nbsp;
        {node.comments.active > 9 ? '9+' : node.comments.active}
      </span>
    ) : null
  }
  const { commentToggle } = useConfigs().value
  return React.useMemo(() => (commentToggle ? renderFileCommentAmounts : null), [commentToggle])
}

export function useRenderFindInFolderButton(
  onSearch: (searchKey: string, searchMode: SearchMode) => void,
) {
  const { searchMode } = useConfigs().value
  return React.useMemo(
    () =>
      searchMode === 'fuzzy'
        ? function renderFindInFolderButton(node: TreeNode) {
            return node.type === 'tree' ? (
              <button
                title={'Find in folder...'}
                className={'find-in-folder-button'}
                onClick={() => onSearch(node.path + '/', searchMode)}
              >
                <Icon type="search" />
              </button>
            ) : null
          }
        : null,
    [searchMode, onSearch],
  )
}

export function useRenderGoToButton(searched: boolean, goTo: (path: string[]) => void) {
  return React.useMemo(
    () =>
      searched
        ? function renderGoToButton(node: TreeNode): React.ReactNode {
            return (
              <button
                title={'Reveal in file tree (⏎)'}
                className={'go-to-button'}
                onClick={() => goTo(node.path.split('/'))}
              >
                <Icon type="go-to" />
              </button>
            )
          }
        : null,
    [searched, goTo],
  )
}

const getTriggerProps = (onTrigger: (e: React.SyntheticEvent) => void) => ({
  onClick: onTrigger,
  onKeyDown: (e: React.KeyboardEvent<HTMLElement>) => onEnterKeyDown(e, onTrigger),
})
