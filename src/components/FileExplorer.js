import React from 'react'
import PropTypes from 'prop-types'

import connect from '../driver/connect'
import { FileExplorer as FileExplorerCore } from '../driver/core'

import SearchBar from './SearchBar'
import Node from './Node'
import LoadingIndicator from './LoadingIndicator'

import cx from '../utils/cx'

@connect(FileExplorerCore)
export default class FileExplorer extends React.Component {
  static propTypes = {
    treeData: PropTypes.object,
    metaData: PropTypes.object,
    freeze: PropTypes.bool,
    visibleNodes: PropTypes.object,

    init: PropTypes.func.isRequired,
    execAfterRender: PropTypes.func.isRequired,
    handleKeyDown: PropTypes.func.isRequired,
    handleSearchKeyChange: PropTypes.func.isRequired,
    setExpand: PropTypes.func.isRequired,
    toggleNodeExpansion: PropTypes.func.isRequired,
    focusNode: PropTypes.func.isRequired,
    onNodeClick: PropTypes.func.isRequired,
    updateVisibleNodes: PropTypes.func.isRequired,
  }

  static defaultProps = {
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

  componentWillReceiveProps(nextProps) {
    if (nextProps.treeData !== this.props.treeData) {
      const { setUpTree } = nextProps
      setUpTree()
    }
  }

  componentDidUpdate() {
    const { execAfterRender } = this.props
    execAfterRender()
  }

  renderFiles(visibleNodes, onNodeClick) {
    const { nodes, depths, focusedNode, expandedNodes } = visibleNodes
    if (nodes.length === 0) {
      return (
        <label className={'no-results'}>
          No results found.
        </label>
      )
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
    const { stateText, visibleNodes, freeze, handleKeyDown, handleSearchKeyChange, onNodeClick } = this.props
    return (
      <div className={cx(`file-explorer`, { freeze })} tabIndex={-1} onKeyDown={handleKeyDown}>
        {
          stateText
          ? <LoadingIndicator text={stateText} />
          : visibleNodes && (
            <React.Fragment>
              <SearchBar onSearchKeyChange={handleSearchKeyChange} />
              {this.renderFiles(visibleNodes, onNodeClick)}
            </React.Fragment>
          )
        }
      </div>
    )
  }
}
