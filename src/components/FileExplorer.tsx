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
import { useEvent } from 'react-use'
import { FixedSizeList, ListChildComponentProps } from 'react-window'
import { cx } from 'utils/cx'
import { focusFileExplorer } from 'utils/DOMHelper'
import { isValidRegexpSource } from 'utils/general'
import { useOnLocationChange } from 'utils/hooks/useOnLocationChange'
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
  } = props
  const { val: config } = useConfigs()

  React.useEffect(() => {
    const { setUpTree, treeRoot, metaData } = props
    setUpTree({ treeRoot, metaData, config })
  }, [setUpTree, treeRoot, config.compressSingletonFolder, config.access_token])

  React.useEffect(() => {
    if (visibleNodes?.focusedNode) focusFileExplorer()
  })

  function renderFiles(visibleNodes: VisibleNodes) {
    const inSearch = searchKey !== ''
    const { nodes } = visibleNodes
    if (inSearch && nodes.length === 0) {
      return (
        <Text marginTop={6} textAlign="center" color="text.gray">
          No results found.
        </Text>
      )
    }
    return (
      <SizeObserver className={'files'}>
        {({ width = 0, height = 0 }) => (
          <ListView
            height={height}
            width={width}
            searchKey={searchKey}
            onNodeClick={onNodeClick}
            renderActions={
              searchKey
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
                : undefined
            }
            visibleNodes={visibleNodes}
            expandTo={expandTo}
            metaData={metaData}
          />
        )}
      </SizeObserver>
    )
  }

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
            {renderFiles(visibleNodes)}
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
  const { searchKey, onNodeClick, renderActions, visibleNodes } = data
  const regex =
    searchKey && isValidRegexpSource(searchKey) ? new RegExp(searchKey, 'gi') : undefined
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
      renderActions={renderActions}
      regex={regex}
    />
  )
})

function ListView({
  width,
  height,
  metaData,
  expandTo,
  searchKey,
  onNodeClick,
  renderActions,
  visibleNodes,
}: {
  height: number
  width: number
  searchKey: string
  onNodeClick(event: React.MouseEvent<HTMLElement, MouseEvent>, node: TreeNode): void
  renderActions?(node: TreeNode): React.ReactNode
  visibleNodes: VisibleNodes
} & Pick<Props, 'metaData'> &
  Pick<ConnectorState, 'expandTo'>) {
  const listRef = React.useRef<FixedSizeList>(null)
  const { focusedNode, nodes } = visibleNodes
  React.useEffect(() => {
    if (listRef.current && focusedNode) {
      const index = nodes.findIndex(node => node.path === focusedNode.path)
      if (index !== -1) {
        listRef.current.scrollToItem(index, 'smart')
      }
    }
  }, [focusedNode])

  const goToCurrentItem = React.useCallback(() => {
    const targetPath = platform.getCurrentPath(metaData.branchName)
    if (targetPath) expandTo(targetPath)
  }, [metaData.branchName])
  useOnLocationChange(goToCurrentItem)
  useEvent('pjax:ready', goToCurrentItem, document)
  return (
    <FixedSizeList
      ref={listRef}
      itemKey={(index, { visibleNodes }) => visibleNodes?.nodes[index]?.path}
      itemData={{ searchKey, onNodeClick, renderActions, visibleNodes }}
      itemCount={nodes.length}
      itemSize={36}
      height={height}
      width={width}
    >
      {VirtualNode}
    </FixedSizeList>
  )
}
