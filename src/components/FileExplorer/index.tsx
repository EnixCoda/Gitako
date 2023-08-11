import { Label, registerPortalRoot, Text } from '@primer/react'
import { useFocusOnPendingTarget } from 'components/FocusTarget'
import { LoadingIndicator } from 'components/LoadingIndicator'
import { SearchBar } from 'components/SearchBar'
import { useConfigs } from 'containers/ConfigsContext'
import { PortalContext } from 'containers/PortalContext'
import { RepoContext } from 'containers/RepoContext'
import { useInspector } from 'containers/StateInspector'
import * as React from 'react'
import { usePrevious, useUpdateEffect } from 'react-use'
import { cx } from 'utils/cx'
import { run } from 'utils/general'
import { useElementSize } from 'utils/hooks/useElementSize'
import { useAfterRedirect } from 'utils/hooks/useFastRedirect'
import { useLoadedContext } from 'utils/hooks/useLoadedContext'
import { useOnLocationChange } from 'utils/hooks/useOnLocationChange'
import { VisibleNodes, VisibleNodesGenerator } from 'utils/VisibleNodesGenerator'
import { SideBarStateContext } from '../../containers/SideBarState'
import { useGetCurrentPath } from './hooks/useGetCurrentPath'
import { useHandleKeyDown } from './hooks/useHandleKeyDown'
import {
  NodeRenderer,
  useNodeRenderers,
  useRenderFileCommentAmounts,
  useRenderFileStatus,
  useRenderFindInFolderButton,
  useRenderGoToButton,
  useRenderMoreActions,
} from './hooks/useNodeRenderers'
import { useHandleNodeClick } from './hooks/useOnNodeClick'
import { useOnSearch } from './hooks/useOnSearch'
import { useRenderLabelText } from './hooks/useRenderLabelText'
import { useVisibleNodesGenerator } from './hooks/useVisibleNodesGenerator'
import { useVisibleNodesGeneratorMethods } from './hooks/useVisibleNodesGeneratorMethods'
import { Node } from './Node'
import { useHandleNodeFocus } from './useHandleNodeFocus'
import { AlignMode, useVirtualScroll } from './useVirtualScroll'
import { useVisibleNodes } from './useVisibleNodes'

export type NodeRendererContext = {
  onNodeClick: (event: React.MouseEvent<HTMLElement, MouseEvent>, node: TreeNode) => void
  onNodeFocus: (event: React.FocusEvent<HTMLElement, Element>, node: TreeNode) => void
  renderLabelText: NodeRenderer
  renderActions: NodeRenderer | undefined
  visibleNodes: VisibleNodes
}

export function FileExplorer() {
  const metaData = React.useContext(RepoContext)
  const visibleNodesGenerator = useVisibleNodesGenerator(metaData)
  const visibleNodes = useVisibleNodes(visibleNodesGenerator)
  const state = useLoadedContext(SideBarStateContext).value

  return (
    <>
      {run(() => {
        switch (state) {
          case 'tree-loading':
            return <LoadingIndicator text={'Fetching File List...'} />
          case 'tree-rendering':
            return <LoadingIndicator text={'Rendering File List...'} />
          case 'tree-rendered':
            return (
              metaData &&
              visibleNodesGenerator &&
              visibleNodes && (
                <LoadedFileExplorer
                  metaData={metaData}
                  visibleNodesGenerator={visibleNodesGenerator}
                  visibleNodes={visibleNodes}
                />
              )
            )
        }
      })}
    </>
  )
}

function LoadedFileExplorer({
  metaData,
  visibleNodesGenerator,
  visibleNodes,
}: {
  metaData: MetaData
  visibleNodesGenerator: VisibleNodesGenerator
  visibleNodes: VisibleNodes
}) {
  const config = useConfigs().value

  const [searchKey, updateSearchKey] = React.useState('')
  const searched = !!searchKey
  const onSearch = useOnSearch(updateSearchKey, visibleNodesGenerator)
  const { focusedNode, nodes, expandedNodes, depths, loading } = visibleNodes

  // re-search when the compress option update
  const { compressSingletonFolder } = config
  useUpdateEffect(() => {
    visibleNodesGenerator.setCompression(compressSingletonFolder)
  }, [compressSingletonFolder])

  const {
    ref: filesRef,
    size: [, height],
  } = useElementSize<HTMLDivElement>()
  const { compactFileTree } = config
  const {
    ref: scrollElementRef,
    onScroll,
    visibleRows,
    containerStyle,
    scrollToItem,
  } = useVirtualScroll<HTMLDivElement>({
    totalAmount: visibleNodes.nodes.length,
    rowHeight: compactFileTree ? 24 : 37,
    viewportHeight: height,
    overScan: 10,
  })

  const portalName = React.useMemo(() => `${Math.random()}`, [])
  React.useEffect(() => {
    const current = scrollElementRef.current
    if (current) registerPortalRoot(current, portalName)
  }, [scrollElementRef, portalName])

  // - init loading
  //   - "top"
  // - jump to file
  //   - "top"
  // - tab to file
  //   - "lazy"
  // - click file/folder
  //   - "lazy"
  // - navigate with keyboard
  //   - "lazy"
  const [alignMode, setAlignMode] = React.useState<AlignMode>('top')

  const index = React.useMemo(
    () => (focusedNode?.path ? nodes.findIndex(node => node.path === focusedNode.path) : -1),
    [focusedNode?.path, nodes],
  )

  React.useLayoutEffect(() => {
    if (index !== -1) scrollToItem(index, alignMode)
  }, [index, scrollToItem, alignMode])
  const prevSearchKey = usePrevious(searchKey)
  React.useEffect(() => {
    // when start searching or stop searching
    if (!prevSearchKey !== !searchKey) scrollToItem(0, alignMode)
  }, [prevSearchKey, searchKey, scrollToItem, alignMode])

  const getCurrentPath = useGetCurrentPath(metaData)
  const methods = useVisibleNodesGeneratorMethods(
    visibleNodesGenerator,
    getCurrentPath,
    updateSearchKey,
  )
  const { expandTo, goTo, focusNode } = methods
  const handleNodeFocus = useHandleNodeFocus(methods, setAlignMode)
  const handleNodeClick = useHandleNodeClick(methods, setAlignMode)
  const handleKeyDown = useHandleKeyDown(visibleNodes, methods, searched, setAlignMode)
  const handleFocusSearchBar = () => focusNode(null)

  const renderActions = useNodeRenderers([
    useRenderGoToButton(searched, goTo),
    useRenderFindInFolderButton(onSearch),
    useRenderFileCommentAmounts(),
    useRenderMoreActions(methods),
    useRenderFileStatus(),
  ])
  const renderLabelText = useRenderLabelText(searchKey)

  const goToCurrentItem = React.useCallback(() => {
    const targetPath = getCurrentPath()
    if (targetPath) expandTo(targetPath)
  }, [getCurrentPath, expandTo])

  useOnLocationChange(goToCurrentItem)
  useAfterRedirect(goToCurrentItem)

  const [currentPath, setCurrentPath] = React.useState(() => getCurrentPath())
  useAfterRedirect(React.useCallback(() => setCurrentPath(getCurrentPath()), [getCurrentPath]))
  useInspector('CurrentPath', currentPath)

  const ref = React.useRef<HTMLDivElement | null>(null)
  useFocusOnPendingTarget(
    'files',
    React.useCallback(() => ref.current?.focus(), []),
  )

  return (
    <div ref={ref} className={`file-explorer`} tabIndex={-1} onKeyDown={handleKeyDown}>
      {visibleNodesGenerator?.defer && (
        <div className={'status'}>
          <Label
            title="This repository is large. Gitako has switched to Lazy Mode to improve performance. Folders will be loaded on demand."
            className={'lazy-mode'}
            variant="attention"
          >
            Lazy Mode is ON
          </Label>
        </div>
      )}
      <SearchBar value={searchKey} onSearch={onSearch} onFocus={handleFocusSearchBar} />
      {searched && visibleNodes.nodes.length === 0 && (
        <>
          <Text marginTop={6} textAlign="center" color="text.gray">
            No results found.
          </Text>
          {visibleNodesGenerator?.defer && (
            <Text textAlign="center" color="gray.4" fontSize="12px">
              Search results are limited to loaded folders in Lazy Mode.
            </Text>
          )}
        </>
      )}
      <div
        className={cx('files', {
          // instead of unmounting, hide the element when not needed, so that the ref can be preserved after search result matches nothing
          hidden: visibleNodes.nodes.length === 0,
        })}
        ref={filesRef}
      >
        <div
          style={{
            height,
            width: '100%',
            overflow: 'auto',
            position: 'absolute', // This allows reducing `height` on viewport height reduce
          }}
          ref={scrollElementRef}
          onScroll={onScroll}
          tabIndex={-1} // prevent getting focus via tab key on GitHub
        >
          <PortalContext.Provider value={portalName}>
            <div style={containerStyle}>
              {visibleRows
                .map(({ row, style }) => ({
                  node: nodes[row],
                  style,
                }))
                .map(({ node, style }) => (
                  <Node
                    key={node.path}
                    node={node}
                    style={style}
                    depth={depths.get(node) || 0}
                    focused={focusedNode?.path === node.path}
                    loading={loading.has(node.path)}
                    expanded={expandedNodes.has(node.path)}
                    onClick={handleNodeClick}
                    onFocus={handleNodeFocus}
                    renderLabelText={renderLabelText}
                    renderActions={renderActions}
                  />
                ))}
            </div>
          </PortalContext.Provider>
        </div>
      </div>
    </div>
  )
}
