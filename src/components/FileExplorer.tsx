import { Text } from '@primer/components'
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
import { isValidRegexpSource } from 'utils/general'
import { useOnLocationChange } from 'utils/hooks/useOnLocationChange'
import { useOnPJAXDone } from 'utils/hooks/usePJAX'
import { VisibleNodes } from 'utils/VisibleNodesGenerator'
import { Icon } from './Icon'
import { SizeObserver } from './SizeObserver'

const RawFileExplorer: React.FC<Props & ConnectorState> = function RawFileExplorer(props) {
  const {
    state,
    visibleNodes,
    freeze,
    onNodeClick,
    searchKey,
    goTo,
    metaData,
    expandTo,
    setUpTree,
    treeRoot,
    defer,
  } = props
  const { value: config } = useConfigs()

  React.useEffect(() => {
    if (treeRoot) {
      setUpTree({
        treeRoot,
        metaData,
        config: {
          compressSingletonFolder: config.compressSingletonFolder,
          accessToken: config.accessToken,
        },
      })
    }
  }, [setUpTree, treeRoot, metaData, config.compressSingletonFolder, config.accessToken])

  React.useEffect(() => {
    if (visibleNodes?.focusedNode) focusFileExplorer()
  })

  const renderActions: ((node: TreeNode) => React.ReactNode) | undefined = React.useMemo(
    () =>
      visibleNodes?.lastMatch?.match.searchKey
        ? node => (
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
        : undefined,
    [visibleNodes, goTo],
  )

  return (
    <div
      className={cx(`file-explorer`, { freeze })}
      tabIndex={-1}
      onKeyDown={props.handleKeyDown}
      onClick={freeze ? props.toggleShowSettings : undefined}
    >
      {state !== 'done' ? (
        <LoadingIndicator
          text={
            {
              pulling: 'Fetching File List...',
              rendering: 'Rendering File List...',
            }[state]
          }
        />
      ) : (
        visibleNodes && (
          <>
            <SearchBar
              searchKey={searchKey}
              onSearch={props.search}
              onFocus={props.onFocusSearchBar}
            />
            {visibleNodes.lastMatch?.match.searchKey !== '' && visibleNodes.nodes.length === 0 && (
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
                <ListView
                  height={height}
                  width={width}
                  onNodeClick={onNodeClick}
                  renderActions={renderActions}
                  visibleNodes={visibleNodes}
                  expandTo={expandTo}
                  metaData={metaData}
                />
              )}
            </SizeObserver>
          </>
        )
      )}
    </div>
  )
}

RawFileExplorer.defaultProps = {
  freeze: false,
  state: 'pulling',
  searchKey: '',
  visibleNodes: null,
}

export const FileExplorer = connect(FileExplorerCore)(RawFileExplorer)

const VirtualNode = React.memo(function VirtualNode({
  index,
  style,
  data,
}: ListChildComponentProps) {
  const { onNodeClick, renderActions, visibleNodes } = data
  if (!visibleNodes) return null

  const {
    lastMatch,
    nodes,
    focusedNode,
    expandedNodes,
    loading,
    depths,
  } = visibleNodes as VisibleNodes
  const node = nodes[index]
  const searchKey = lastMatch?.match.searchKey
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
      renderActions={renderActions}
      regex={searchKey && isValidRegexpSource(searchKey) ? new RegExp(searchKey, 'gi') : undefined}
    />
  )
})

type ListViewProps = {
  height: number
  width: number
  onNodeClick(event: React.MouseEvent<HTMLElement, MouseEvent>, node: TreeNode): void
  renderActions?(node: TreeNode): React.ReactNode
  visibleNodes: VisibleNodes
}

function ListView({
  width,
  height,
  metaData,
  expandTo,
  onNodeClick,
  renderActions,
  visibleNodes,
}: ListViewProps & Pick<Props, 'metaData'> & Pick<ConnectorState, 'expandTo'>) {
  const listRef = React.useRef<FixedSizeList>(null)
  // the change of depths indicates switch into/from search state
  React.useEffect(() => {
    const { focusedNode, nodes } = visibleNodes
    if (listRef.current && focusedNode?.path) {
      const index = nodes.findIndex(node => node.path === focusedNode.path)
      if (index !== -1) {
        listRef.current.scrollToItem(index, 'smart')
      }
    }
  }, [visibleNodes])
  // For some reason, removing the deps array above results in bug:
  // If scroll fast and far, then clicking on items would result in redirect
  // Not know the reason :(

  const goToCurrentItem = React.useCallback(() => {
    const targetPath = platform.getCurrentPath(metaData.branchName)
    if (targetPath) expandTo(targetPath)
  }, [metaData.branchName])

  useOnLocationChange(goToCurrentItem)
  useOnPJAXDone(goToCurrentItem)

  const itemData = React.useMemo(
    () => ({
      onNodeClick,
      renderActions,
      visibleNodes,
    }),
    [onNodeClick, renderActions, visibleNodes],
  )

  return (
    <FixedSizeList
      ref={listRef}
      itemKey={(index, { visibleNodes }) => visibleNodes?.nodes[index]?.path}
      itemData={itemData}
      itemCount={visibleNodes.nodes.length}
      itemSize={37}
      height={height}
      width={width}
    >
      {VirtualNode}
    </FixedSizeList>
  )
}
