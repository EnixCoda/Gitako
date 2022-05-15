import { Label, Text } from '@primer/react'
import { LoadingIndicator } from 'components/LoadingIndicator'
import { SearchBar } from 'components/SearchBar'
import * as React from 'react'
import { cx } from 'utils/cx'
import { run } from 'utils/general'
import { useLoadedContext } from 'utils/hooks/useLoadedContext'
import { VisibleNodes } from 'utils/VisibleNodesGenerator'
import { SideBarStateContext } from '../../containers/SideBarState'
import { SizeObserver } from '../SizeObserver'
import { useFocusFileExplorerOnFirstRender } from './hooks/useFocusFileExplorerOnFirstRender'
import { useGetCurrentPath } from './hooks/useGetCurrentPath'
import { useHandleKeyDown } from './hooks/useHandleKeyDown'
import { useNodeRenderContext } from './hooks/useNodeRenderContext'
import {
  NodeRenderer,
  useNodeRenderers,
  useRenderFileCommentAmounts,
  useRenderFileStatus,
  useRenderFindInFolderButton,
  useRenderGoToButton
} from './hooks/useNodeRenderers'
import { useHandleNodeClick } from './hooks/useOnNodeClick'
import { useOnSearch } from './hooks/useOnSearch'
import { useVisibleNodesGeneratorMethods } from './hooks/useOnVisibleNodesGeneratorReady'
import { useReactWindowAlignMode } from './hooks/useReactWindowAlignMode'
import { useRenderLabelText } from './hooks/useRenderLabelText'
import { useVisibleNodesGenerator } from './hooks/useSetupTree'
import { ListView } from './ListView'
import { useVisibleNodes } from './useVisibleNodes'

export type NodeRendererContext = {
  onNodeClick: (event: React.MouseEvent<HTMLElement, MouseEvent>, node: TreeNode) => void
  renderLabelText: NodeRenderer
  renderActions: NodeRenderer | undefined
  visibleNodes: VisibleNodes
}

type Props = {
  metaData: MetaData
  freeze: boolean
}

export function FileExplorer({ freeze, metaData }: Props) {
  const visibleNodesGenerator = useVisibleNodesGenerator(metaData)
  const visibleNodes = useVisibleNodes(visibleNodesGenerator)

  const [searchKey, updateSearchKey] = React.useState('')
  const searched = !!searchKey
  const onSearch = useOnSearch(updateSearchKey, visibleNodesGenerator)

  const getCurrentPath = useGetCurrentPath(metaData)
  const methods = useVisibleNodesGeneratorMethods(
    visibleNodesGenerator,
    getCurrentPath,
    updateSearchKey,
  )
  const { expandTo, goTo, focusNode } = methods
  const handleNodeClick = useHandleNodeClick(methods)
  const handleKeyDown = useHandleKeyDown(visibleNodes, methods, searched)
  const handleFocusSearchBar = () => focusNode(null)

  const renderActions = useNodeRenderers([
    useRenderGoToButton(searched, goTo),
    useRenderFindInFolderButton(onSearch),
    useRenderFileCommentAmounts(),
    useRenderFileStatus(),
  ])
  const renderLabelText = useRenderLabelText(searchKey)

  const nodeRendererContext = useNodeRenderContext(
    visibleNodes,
    handleNodeClick,
    renderActions,
    renderLabelText,
  )

  const alignMode = useReactWindowAlignMode(searched)
  const state = useLoadedContext(SideBarStateContext).value
  useFocusFileExplorerOnFirstRender()

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
                  {visibleNodesGenerator?.defer && (
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
                  <SizeObserver<HTMLDivElement>>
                    {({ width = 0, height = 0 }, ref) => (
                      <div className={'files'} ref={ref}>
                        <ListView
                          height={height}
                          width={width}
                          nodeRendererContext={nodeRendererContext}
                          expandTo={expandTo}
                          metaData={metaData}
                          alignMode={alignMode}
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
