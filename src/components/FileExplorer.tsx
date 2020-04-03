import { Text } from '@primer/components'
import { LoadingIndicator } from 'components/LoadingIndicator'
import { Node } from 'components/Node'
import { SearchBar } from 'components/SearchBar'
import { useConfigs } from 'containers/ConfigsContext'
import { usePlatform } from 'containers/PlatformContext'
import { connect } from 'driver/connect'
import { FileExplorerCore } from 'driver/core'
import { ConnectorState, Props } from 'driver/core/FileExplorer'
import * as React from 'react'
import { useEvent, usePrevious } from 'react-use'
import { FixedSizeList as List, ListChildComponentProps, ListProps } from 'react-window'
import { cx } from 'utils/cx'
import { isValidRegexpSource } from 'utils/general'
import { useOnLocationChange } from 'utils/hooks/useOnLocationChange'
import { VisibleNodes } from 'utils/VisibleNodesGenerator'
import { Icon } from './Icon'
import { SizeObserver } from './SizeObserver'

const VisibleNodesContext = React.createContext<VisibleNodes | null>(null)

const RawFileExplorer: React.FC<Props & ConnectorState> = function RawFileExplorer(props) {
  const { visibleNodes, freeze, onNodeClick, searchKey } = props
  const {
    val: { access_token: accessToken, compressSingletonFolder },
  } = useConfigs()

  React.useEffect(() => {
    const { init } = props
    init()
  }, [])

  React.useEffect(() => {
    const { setUpTree, treeRoot, metaData } = props
    setUpTree({ treeRoot, metaData, compressSingletonFolder, accessToken })
  }, [props.setUpTree, props.treeRoot, compressSingletonFolder, accessToken])

  React.useEffect(() => {
    const { execAfterRender } = props
    execAfterRender()
  })

  const renderActions: React.ComponentProps<typeof Node>['renderActions'] = React.useCallback(
    node =>
      searchKey ? (
        <button
          title={'Reveal in file tree'}
          className={'go-to-button'}
          onClick={revealNode(props.goTo, node)}
        >
          <Icon type="go-to" />
        </button>
      ) : null,
    [searchKey, props.goTo],
  )

  const renderNode = React.useCallback(
    ({ index, style }: ListChildComponentProps) => (
      <VirtualNode
        index={index}
        style={style}
        regex={
          searchKey && isValidRegexpSource(searchKey) ? new RegExp(searchKey, 'gi') : undefined
        }
        onNodeClick={onNodeClick}
        renderActions={renderActions}
      />
    ),
    [renderActions, onNodeClick, searchKey],
  )

  const renderFiles = React.useCallback(
    ({ nodes, focusedNode }: VisibleNodes) => {
      const inSearch = searchKey !== ''
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
              renderNode={renderNode}
              focusedNode={focusedNode}
              nodes={nodes}
              height={height}
              width={width}
              expandTo={props.expandTo}
              metaData={props.metaData}
            />
          )}
        </SizeObserver>
      )
    },
    [searchKey, ListView, renderNode],
  )

  const revealNode = React.useCallback(function revealNode(
    goTo: (path: string[]) => void,
    node: TreeNode,
  ): (event: React.MouseEvent<HTMLElement, MouseEvent>) => void {
    return e => {
      e.stopPropagation()
      e.preventDefault()
      goTo(node.path.split('/'))
    }
  },
  [])

  return (
    <VisibleNodesContext.Provider value={visibleNodes}>
      <div
        className={cx(`file-explorer`, { freeze })}
        tabIndex={-1}
        onKeyDown={props.handleKeyDown}
        onClick={freeze ? props.toggleShowSettings : undefined}
      >
        {props.stateText ? (
          <LoadingIndicator text={props.stateText} />
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
    </VisibleNodesContext.Provider>
  )
}

RawFileExplorer.defaultProps = {
  freeze: false,
  searchKey: '',
  visibleNodes: null,
}

export const FileExplorer = connect(FileExplorerCore)(RawFileExplorer)

function VirtualNode({
  index,
  style,
  onNodeClick,
  renderActions,
  regex,
}: {
  index: number
  style: React.CSSProperties
  onNodeClick: (treeNode: TreeNode) => void
  renderActions: ((node: TreeNode) => React.ReactNode) | undefined
  regex?: RegExp
}) {
  const visibleNodes = React.useContext(VisibleNodesContext)
  if (!visibleNodes) return null
  const { nodes, depths, focusedNode, expandedNodes } = visibleNodes
  const node = nodes[index]
  return (
    <Node
      style={style}
      key={node.path}
      node={node}
      depth={depths.get(node) || 0}
      focused={focusedNode === node}
      expanded={expandedNodes.has(node)}
      onClick={onNodeClick}
      renderActions={renderActions}
      regex={regex}
    />
  )
}

function ListView({
  nodes,
  width,
  height,
  focusedNode,
  renderNode,
  metaData,
  expandTo,
}: {
  nodes: TreeNode[]
  height: number
  width: number
  focusedNode: TreeNode | null
  renderNode: ListProps['children']
} & Pick<Props, 'metaData'> &
  Pick<ConnectorState, 'expandTo'>) {
  const listRef = React.useRef<List>(null)
  React.useEffect(() => {
    if (focusedNode && listRef.current) {
      listRef.current.scrollToItem(nodes.indexOf(focusedNode), 'smart')
    }
  }, [listRef.current, focusedNode])

  const platform = usePlatform()
  const lastNodeLength = usePrevious(nodes.length)
  React.useEffect(() => {
    if (listRef.current && !focusedNode && lastNodeLength !== nodes.length) {
      listRef.current.scrollTo(0)
    }
  }, [listRef.current, focusedNode, nodes.length])

  const goToCurrentItem = React.useCallback(() => {
    const targetPath = platform.getCurrentPath(metaData.branchName)
    if (targetPath) expandTo(targetPath)
  }, [metaData.branchName])
  useOnLocationChange(goToCurrentItem)
  useEvent('pjax:ready', goToCurrentItem, document)
  return (
    <List
      ref={listRef}
      itemKey={(index, { nodes }) => {
        const node = nodes[index]
        return node && node.path
      }}
      itemData={{ nodes }}
      itemCount={nodes.length}
      itemSize={36}
      height={height}
      width={width}
    >
      {renderNode}
    </List>
  )
}
