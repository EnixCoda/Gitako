import { Label, Text } from '@primer/components'
import { LoadingIndicator } from 'components/LoadingIndicator'
import { Node } from 'components/Node'
import { SearchBar } from 'components/SearchBar'
import { useConfigs } from 'containers/ConfigsContext'
import { connect } from 'driver/connect'
import { FileExplorerCore } from 'driver/core'
import { ConnectorState, Props } from 'driver/core/FileExplorer'
import { platform } from 'platforms'
import * as React from 'react'
import { FixedSizeList, ListChildComponentProps } from 'react-window'
import { cx } from 'utils/cx'
import { focusFileExplorer } from 'utils/DOMHelper'
import { run } from 'utils/general'
import { useLoadedContext } from 'utils/hooks/useLoadedContext'
import { useOnLocationChange } from 'utils/hooks/useOnLocationChange'
import { useOnPJAXDone } from 'utils/hooks/usePJAX'
import { VisibleNodes } from 'utils/VisibleNodesGenerator'
import { SideBarStateContext } from '../containers/SideBarState'
import { DiffStatGraph } from './DiffStatGraph'
import { DiffStatText } from './DiffStatText'
import { Icon } from './Icon'
import { SearchMode, searchModes } from './searchModes'
import { SizeObserver } from './SizeObserver'

type renderNodeContext = {
  onNodeClick: (event: React.MouseEvent<HTMLElement, MouseEvent>, node: TreeNode) => void
  renderLabelText: (node: TreeNode) => React.ReactNode
  renderActions: ((node: TreeNode) => React.ReactNode) | undefined
  visibleNodes: VisibleNodes
}

const RawFileExplorer: React.FC<Props & ConnectorState> = function RawFileExplorer(props) {
  const {
    visibleNodes,
    visibleNodesGenerator,
    freeze,
    onNodeClick,
    searchKey,
    updateSearchKey,
    onFocusSearchBar,
    goTo,
    handleKeyDown,
    metaData,
    expandTo,
    setUpTree,
    defer,
    searched,
  } = props
  const {
    value: {
      accessToken,
      compressSingletonFolder,
      searchMode,
      commentToggle,
      restoreExpandedFolders,
      showDiffInText,
    },
  } = useConfigs()

  const onSearch = React.useCallback(
    (searchKey: string, searchMode: SearchMode) => {
      updateSearchKey(searchKey)
      if (visibleNodesGenerator) {
        visibleNodesGenerator.search(
          searchModes[searchMode].getSearchParams(searchKey),
          restoreExpandedFolders,
        )
      }
    },
    [updateSearchKey, visibleNodesGenerator, restoreExpandedFolders],
  )

  const stateContext = useLoadedContext(SideBarStateContext)
  const state = stateContext.value

  React.useEffect(() => {
    setUpTree({
      metaData,
      config: {
        compressSingletonFolder,
        accessToken,
      },
      stateContext,
    })
  }, [setUpTree, metaData, compressSingletonFolder, accessToken])

  React.useEffect(() => {
    focusFileExplorer()
  }, [])

  const renderActions: ((node: TreeNode) => React.ReactNode) | undefined = React.useMemo(() => {
    const renderGoToButton = (node: TreeNode): React.ReactNode => (
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
    const renderFindInFolderButton = (node: TreeNode): React.ReactNode =>
      node.type === 'tree' ? (
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
      ) : undefined
    const renderFileCommentAmounts = (node: TreeNode): React.ReactNode =>
      node.comments !== undefined &&
      node.comments > 0 && (
        <span className={'node-item-comment'}>
          <Icon type={'comment'} /> {node.comments > 9 ? '9+' : node.comments}
        </span>
      )
    const renderFileStatus = ({ diff }: TreeNode): React.ReactNode =>
      diff && (
        <span
          className={'node-item-diff'}
          title={`${diff.status}, ${diff.changes} changes: +${diff.additions} & -${diff.deletions}`}
        >
          {showDiffInText ? <DiffStatText diff={diff} /> : <DiffStatGraph diff={diff} />}
        </span>
      )

    const renders: ((node: TreeNode) => React.ReactNode)[] = []
    if (commentToggle) renders.push(renderFileCommentAmounts)
    renders.push(renderFileStatus)
    if (searchMode === 'fuzzy') renders.push(renderFindInFolderButton)
    if (searched) renders.push(renderGoToButton)

    return renders.length
      ? node => renders.map((render, i) => <React.Fragment key={i}>{render(node)}</React.Fragment>)
      : undefined
  }, [goTo, onSearch, searched, searchMode, commentToggle, showDiffInText])

  const renderLabelText = React.useCallback(
    (node: TreeNode) => searchModes[searchMode].renderNodeLabelText(node, searchKey),
    [searchKey, searchMode],
  )

  const renderNodeContext: renderNodeContext | null = React.useMemo(
    () =>
      visibleNodes && {
        onNodeClick,
        renderActions,
        renderLabelText,
        visibleNodes,
      },
    [onNodeClick, renderActions, renderLabelText, visibleNodes],
  )

  return (
    <div className={cx(`file-explorer`, { freeze })} tabIndex={-1} onKeyDown={handleKeyDown}>
      {run(() => {
        switch (state) {
          case 'tree-loading':
            return <LoadingIndicator text={'Fetching File List...'} />
          case 'tree-rendering':
            return <LoadingIndicator text={'Rendering File List...'} />
          case 'tree-rendered':
            return (
              visibleNodes &&
              renderNodeContext && (
                <>
                  <SearchBar value={searchKey} onSearch={onSearch} onFocus={onFocusSearchBar} />
                  {searched && visibleNodes.nodes.length === 0 && (
                    <>
                      <Text marginTop={6} textAlign="center" color="text.gray">
                        No results found.
                      </Text>
                      {defer && (
                        <Text textAlign="center" color="gray.4" fontSize="12px">
                          Lazy mode is ON. Search results are limited to loaded folders.
                        </Text>
                      )}
                    </>
                  )}
                  <SizeObserver className={'files'}>
                    {({ width = 0, height = 0 }) => (
                      <div className={'magic-size-container'}>
                        <ListView
                          height={height}
                          width={width}
                          renderNodeContext={renderNodeContext}
                          expandTo={expandTo}
                          metaData={metaData}
                        />
                      </div>
                    )}
                  </SizeObserver>

                  {defer && (
                    <Label
                      title="File tree data is loaded on demand. And search results are limited."
                      bg="yellow.5"
                      color="gray.6"
                    >
                      Lazy Mode
                    </Label>
                  )}
                </>
              )
            )
        }
      })}
    </div>
  )
}

RawFileExplorer.defaultProps = {
  freeze: false,
  searchKey: '',
  visibleNodes: null,
}

export const FileExplorer = connect(FileExplorerCore)(RawFileExplorer)

const VirtualNode = React.memo(function VirtualNode({
  index,
  style,
  data: { onNodeClick, renderLabelText, renderActions, visibleNodes },
}: Override<ListChildComponentProps, { data: renderNodeContext }>) {
  if (!visibleNodes) return null

  const { nodes, focusedNode, expandedNodes, loading, depths } = visibleNodes as VisibleNodes
  const node = nodes[index]

  return (
    <Node
      style={style}
      key={node.path}
      node={node}
      depth={depths.get(node) || 0}
      focused={focusedNode?.path === node.path}
      loading={loading.has(node.path)}
      expanded={expandedNodes.has(node.path)}
      onClick={onNodeClick}
      renderLabelText={renderLabelText}
      renderActions={renderActions}
    />
  )
})

type ListViewProps = {
  height: number
  width: number
  renderNodeContext: renderNodeContext
} & Pick<Props, 'metaData'> &
  Pick<ConnectorState, 'expandTo'>

function ListView({ width, height, metaData, expandTo, renderNodeContext }: ListViewProps) {
  const { visibleNodes } = renderNodeContext
  const { focusedNode, nodes } = visibleNodes
  const listRef = React.useRef<FixedSizeList>(null)
  // the change of depths indicates switch into/from search state
  React.useEffect(() => {
    if (listRef.current && focusedNode?.path) {
      const index = nodes.findIndex(node => node.path === focusedNode.path)
      if (index !== -1) {
        listRef.current.scrollToItem(index, 'smart')
      }
    }
  }, [focusedNode, nodes])
  // For some reason, removing the deps array above results in bug:
  // If scroll fast and far, then clicking on items would result in redirect
  // Not know the reason :(

  const goToCurrentItem = React.useCallback(() => {
    const targetPath = platform.getCurrentPath(metaData.branchName)
    if (targetPath) expandTo(targetPath)
  }, [metaData.branchName])

  useOnLocationChange(goToCurrentItem)
  useOnPJAXDone(goToCurrentItem)

  const { compactFileTree } = useConfigs().value

  return (
    <FixedSizeList
      ref={listRef}
      itemKey={(index, { visibleNodes }) => visibleNodes?.nodes[index]?.path}
      itemData={renderNodeContext}
      itemCount={visibleNodes.nodes.length}
      itemSize={compactFileTree ? 24 : 37}
      height={height}
      width={width}
    >
      {VirtualNode}
    </FixedSizeList>
  )
}
