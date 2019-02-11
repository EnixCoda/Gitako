import * as React from 'react'
import connect from 'driver/connect'
import { FileExplorer as FileExplorerCore } from 'driver/core'
import SearchBar from 'components/SearchBar'
import Node from 'components/Node'
import LoadingIndicator from 'components/LoadingIndicator'
import cx from 'utils/cx'
import { TreeData, MetaData, VisibleNodes } from './SideBar'

type Props = {
  treeData: TreeData
  metaData: MetaData
  visibleNodes: VisibleNodes
  freeze: boolean

  stateText: string

  init: () => void
  execAfterRender: () => void
  handleKeyDown: React.KeyboardEventHandler
  handleSearchKeyChange: React.FormEventHandler
  onNodeClick: Node['props']['onClick']
  toggleShowSettings: React.MouseEventHandler
  onFocusSearchBar: React.FocusEventHandler
  setUpTree: (treeData?: TreeData) => void
}

@(connect(FileExplorerCore) as any)
export default class FileExplorer extends React.Component<Props> {
  static defaultProps: Partial<Props> = {
    treeData: null,
    metaData: null,
    freeze: false,
    visibleNodes: null,
  }

  componentWillMount() {
    const { init, setUpTree, treeData } = this.props
    init()
    setUpTree(treeData)
  }

  componentDidMount() {
    const { execAfterRender } = this.props
    execAfterRender()
  }

  componentWillReceiveProps(nextProps: Props) {
    if (nextProps.treeData !== this.props.treeData) {
      const { setUpTree } = nextProps
      setUpTree()
    }
  }

  componentDidUpdate() {
    const { execAfterRender } = this.props
    execAfterRender()
  }

  renderFiles(visibleNodes: VisibleNodes, onNodeClick: Node['props']['onClick']) {
    const { nodes, depths, focusedNode, expandedNodes } = visibleNodes
    if (nodes.length === 0) {
      return <label className={'no-results'}>No results found.</label>
    }
    return (
      <div className={'files'}>
        {nodes.map((node: any) => (
          <Node
            key={node.path}
            node={node}
            depth={depths.get(node)}
            focused={focusedNode === node}
            expanded={expandedNodes.has(node)}
            onClick={onNodeClick}
          />
        ))}
      </div>
    )
  }

  render() {
    const {
      stateText,
      visibleNodes,
      freeze,
      handleKeyDown,
      handleSearchKeyChange,
      onNodeClick,
      toggleShowSettings,
      onFocusSearchBar,
    } = this.props
    return (
      <div
        className={cx(`file-explorer`, { freeze })}
        tabIndex={-1}
        onKeyDown={handleKeyDown}
        onClick={freeze ? toggleShowSettings : null}
      >
        {stateText ? (
          <LoadingIndicator text={stateText} />
        ) : (
          visibleNodes && (
            <React.Fragment>
              <SearchBar onSearchKeyChange={handleSearchKeyChange} onFocus={onFocusSearchBar} />
              {this.renderFiles(visibleNodes, onNodeClick)}
            </React.Fragment>
          )
        )}
      </div>
    )
  }
}
