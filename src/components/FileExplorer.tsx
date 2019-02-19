import * as React from 'react'
import connect from 'driver/connect'
import { FileExplorer as FileExplorerCore } from 'driver/core'
import SearchBar from 'components/SearchBar'
import Node from 'components/Node'
import LoadingIndicator from 'components/LoadingIndicator'
import cx from 'utils/cx'
import { VisibleNodes } from './SideBar'
import { ConnectorState } from 'driver/core/FileExplorer'
import { TreeData, MetaData } from 'utils/GitHubHelper'

export type Props = {
  treeData: TreeData
  metaData: MetaData
  freeze: boolean
  compressSingletonFolder: boolean
  accessToken: string
  toggleShowSettings: React.MouseEventHandler
}

class FileExplorer extends React.Component<Props & ConnectorState> {
  static defaultProps: Partial<Props & ConnectorState> = {
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

  componentWillReceiveProps(nextProps: Props & ConnectorState) {
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
        {nodes.map(node => (
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

export default connect<Props, ConnectorState>(FileExplorerCore)(FileExplorer)
