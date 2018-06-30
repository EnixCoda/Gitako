import React from 'react'
import PropTypes from "prop-types";

import connect from '../driver/connect'
import { FileExplorer as FileExplorerCore } from '../driver/core'

import SearchBar from './SearchBar'
import Node from './Node'

import cx from '../utils/cx'

@connect(FileExplorerCore)
export default class FileExplorer extends React.Component {
  static propTyps = {
    treeData: PropTypes.object,
    metaData: PropTypes.object,
    freeze: PropTypes.boolean,
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

  constructor(props) {
    super(props)
    const { init } = props
    init()
  }

  componentDidMount() {
    const { execAfterRender } = this.props
    execAfterRender()
  }

  componentDidUpdate() {
    const { execAfterRender } = this.props
    execAfterRender()
  }

  render() {
    const {
      visibleNodes,
      freeze,
      handleKeyDown,
      handleSearchKeyChange,
      onNodeClick
    } = this.props
    const {
      nodes,
      depths,
      focusedNode,
      expandedNodes,
    } = visibleNodes || {}
    return (
      <div className={cx(`file-explorer`, { freeze })} tabIndex={-1} onKeyDown={handleKeyDown}>
        <SearchBar onSearchKeyChange={handleSearchKeyChange} />
        {!visibleNodes || !nodes || nodes.length === 0 ? (
          <label className={'no-results'}>No results found.</label>
        ) : (
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
          )}
      </div>
    )
  }
}
