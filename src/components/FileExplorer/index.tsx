import { Label, Text } from '@primer/react'
import { LoadingIndicator } from 'components/LoadingIndicator'
import { SearchBar } from 'components/SearchBar'
import { useConfigs } from 'containers/ConfigsContext'
import { connect } from 'driver/connect'
import { FileExplorerCore } from 'driver/core'
import { ConnectorState, Props } from 'driver/core/FileExplorer'
import * as React from 'react'
import { Align as ReactWindowAlign } from 'react-window'
import { cx } from 'utils/cx'
import * as DOMHelper from 'utils/DOMHelper'
import { run } from 'utils/general'
import { useLoadedContext } from 'utils/hooks/useLoadedContext'
import { useSequentialEffect } from 'utils/hooks/useSequentialEffect'
import { useStateIO } from 'utils/hooks/useStateIO'
import { VisibleNodes, VisibleNodesGenerator } from 'utils/VisibleNodesGenerator'
import { SideBarStateContext } from '../../containers/SideBarState'
import { SearchMode, searchModes } from '../searchModes'
import { SizeObserver } from '../SizeObserver'
import { ListView } from './ListView'
import {
  NodeRenderer,
  useNodeRenderers,
  useRenderFileCommentAmounts,
  useRenderFileStatus,
  useRenderFindInFolderButton,
  useRenderGoToButton
} from './useNodeRenderers'

export type NodeRendererContext = {
  onNodeClick: (event: React.MouseEvent<HTMLElement, MouseEvent>, node: TreeNode) => void
  renderLabelText: NodeRenderer
  renderActions: NodeRenderer | undefined
  visibleNodes: VisibleNodes
}

function useSetupTree(setUpTree: ConnectorState['setUpTree'], metaData: MetaData) {
  const stateContext = useLoadedContext(SideBarStateContext)
  const { accessToken, compressSingletonFolder } = useConfigs().value

  useSequentialEffect(
    checker => {
      setUpTree(
        {
          metaData,
          config: {
            compressSingletonFolder,
            accessToken,
          },
          stateContext,
        },
        checker,
      )
    },
    [setUpTree, metaData, compressSingletonFolder, accessToken],
  )
}

function useFocusFileExplorerOnFirstRender() {
  React.useEffect(() => {
    DOMHelper.focusFileExplorer()
  }, [])
}

function useReactWindowAlignMode(searched: boolean) {
  const scrollMode = useStateIO<ReactWindowAlign>('auto')
  React.useEffect(() => {
    // Use `auto` as default mode to prevent initial misalignment
    // Switch to `smart` mode when start searching to make sure alignment is user-friendly when jump to files
    if (scrollMode.value === 'auto' && searched) scrollMode.onChange('smart')
  }, [searched])
  return scrollMode
}

function useOnSearch(
  updateSearchKey: (searchKey: string) => void,
  visibleNodesGenerator: VisibleNodesGenerator | null,
) {
  const { restoreExpandedFolders } = useConfigs().value
  return React.useCallback(
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
}

function useRenderLabelText(searchKey: string) {
  const { searchMode } = useConfigs().value
  return React.useCallback(
    (node: TreeNode) => searchModes[searchMode].renderNodeLabelText(node, searchKey),
    [searchKey, searchMode],
  )
}

const RawFileExplorer: React.FC<Props & ConnectorState> = function RawFileExplorer({
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
}) {
  useSetupTree(setUpTree, metaData)
  useFocusFileExplorerOnFirstRender()

  const onSearch = useOnSearch(updateSearchKey, visibleNodesGenerator)
  const renderActions = useNodeRenderers([
    useRenderGoToButton(searched, goTo),
    useRenderFindInFolderButton(onSearch),
    useRenderFileCommentAmounts(),
    useRenderFileStatus(),
  ])

  const renderLabelText = useRenderLabelText(searchKey)

  const nodeRendererContext: NodeRendererContext | null = React.useMemo(
    () =>
      visibleNodes && {
        onNodeClick,
        renderActions,
        renderLabelText,
        visibleNodes,
      },
    [onNodeClick, renderActions, renderLabelText, visibleNodes],
  )

  const alignMode = useReactWindowAlignMode(searched)
  const state = useLoadedContext(SideBarStateContext).value

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
              nodeRendererContext && (
                <>
                  {defer && (
                    <div className={'status'}>
                      <Label
                        title="This repository is large. Gitako has switched to Lazy Mode to improve performance. Folders will be loaded when it gets expanded."
                        className={'lazy-mode'}
                        variant="attention"
                      >
                        Lazy Mode is ON
                      </Label>
                    </div>
                  )}
                  <SearchBar value={searchKey} onSearch={onSearch} onFocus={onFocusSearchBar} />
                  {searched && visibleNodes.nodes.length === 0 && (
                    <>
                      <Text marginTop={6} textAlign="center" color="text.gray">
                        No results found.
                      </Text>
                      {defer && (
                        <Text textAlign="center" color="gray.4" fontSize="12px">
                          Search results are limited to loaded folders in Lazy Mode.
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
                          nodeRendererContext={nodeRendererContext}
                          expandTo={expandTo}
                          metaData={metaData}
                          scrollMode={alignMode.value}
                        />
                      </div>
                    )}
                  </SizeObserver>
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
