import * as React from 'react'
import connect from 'driver/connect'
import { FileExplorer as FileExplorerCore } from 'driver/core'
import SearchBar from 'components/SearchBar'
import Node from 'components/Node'
import LoadingIndicator from 'components/LoadingIndicator'
import cx from 'utils/cx'
import { ConnectorState } from 'driver/core/FileExplorer'
import { TreeData, MetaData } from 'utils/GitHubHelper'
import { VisibleNodes, TreeNode } from 'utils/VisibleNodesGenerator'
import Icon from './Icon'

export type Props = {
  treeData: TreeData
  metaData: MetaData
  freeze: boolean
  compressSingletonFolder: boolean
  accessToken: string | undefined
  toggleShowSettings: React.MouseEventHandler
}

class FileExplorer extends React.Component<Props & ConnectorState> {
  static defaultProps: Partial<Props & ConnectorState> = {
    freeze: false,
    searchKey: '',
    searched: false,
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
    const { goTo, searchKey, searched } = this.props
    const inSearch = searchKey !== ''
    if (inSearch && nodes.length === 0) {
      return <label className={'no-results'}>No results found.</label>
    }
    return (
      <div className={'files'}>
        {nodes.map(node => (
          <Node
            key={node.path}
            node={node}
            depth={depths.get(node) || 0}
            focused={focusedNode === node}
            expanded={expandedNodes.has(node)}
            onClick={onNodeClick}
            renderActions={() =>
              inSearch &&
              searched && (
                <div className={'go-to-wrapper'}>
                  <button className={'go-to-button'} onClick={this.revealNode(goTo, node)}>
                    <Icon type="go-to" />
                    &nbsp;Reveal in file tree
                  </button>
                </div>
              )
            }
          />
        ))}
      </div>
    )
  }

  revealNode(
    goTo: (path: string[]) => void,
    node: TreeNode,
  ): (event: React.MouseEvent<HTMLElement, MouseEvent>) => void {
    return e => {
      e.stopPropagation()
      e.preventDefault()
      goTo(node.path.split('/'))
    }
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
      searchKey,
    } = this.props
    return (
      <div
        className={cx(`file-explorer`, { freeze })}
        tabIndex={-1}
        onKeyDown={handleKeyDown}
        onClick={freeze ? toggleShowSettings : undefined}
      >
        {stateText ? (
          <LoadingIndicator text={stateText} />
        ) : (
          visibleNodes && (
            <React.Fragment>
              <SearchBar
                searchKey={searchKey}
                onSearchKeyChange={handleSearchKeyChange}
                onFocus={onFocusSearchBar}
              />
              {this.renderFiles(visibleNodes, onNodeClick)}
            </React.Fragment>
          )
        )}
      </div>
    )
  }
}

export default connect<Props, ConnectorState>(FileExplorerCore)(FileExplorer)
