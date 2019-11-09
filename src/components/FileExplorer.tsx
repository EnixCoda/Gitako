import { LoadingIndicator } from 'components/LoadingIndicator'
import { Node } from 'components/Node'
import { SearchBar } from 'components/SearchBar'
import { connect } from 'driver/connect'
import { FileExplorerCore } from 'driver/core'
import { ConnectorState, Props } from 'driver/core/FileExplorer'
import * as React from 'react'
import { FixedSizeList as List, ListChildComponentProps } from 'react-window'
import { cx } from 'utils/cx'
import { usePrevious } from 'utils/hooks'
import { TreeNode, VisibleNodes } from 'utils/VisibleNodesGenerator'
import { Icon } from './Icon'
import { SizeObserver } from './SizeObserver'

class RawFileExplorer extends React.Component<Props & ConnectorState> {
  static defaultProps: Partial<Props & ConnectorState> = {
    freeze: false,
    searchKey: '',
    visibleNodes: null,
  }

  componentWillMount() {
    const { init, setUpTree, treeData, metaData, compressSingletonFolder, accessToken } = this.props
    init()
    setUpTree({ treeData, metaData, compressSingletonFolder, accessToken })
  }

  componentDidMount() {
    const { execAfterRender } = this.props
    execAfterRender()
  }

  componentWillReceiveProps(nextProps: Props & ConnectorState) {
    if (nextProps.treeData !== this.props.treeData) {
      const { setUpTree, treeData, metaData, compressSingletonFolder, accessToken } = nextProps
      setUpTree({ treeData, metaData, compressSingletonFolder, accessToken })
    }
  }

  componentDidUpdate() {
    const { execAfterRender } = this.props
    execAfterRender()
  }

  renderFiles(visibleNodes: VisibleNodes) {
    const { nodes, focusedNode } = visibleNodes
    const { searchKey } = this.props
    const inSearch = searchKey !== ''
    if (inSearch && nodes.length === 0) {
      return <label className={'no-results'}>No results found.</label>
    }
    return (
      <SizeObserver className={'files'}>
        {({ width = 0, height = 0 }) => (
          <this.ListV focusedNode={focusedNode} nodes={nodes} height={height} width={width} />
        )}
      </SizeObserver>
    )
  }

  ListV = React.memo<{
    nodes: TreeNode[]
    height: number
    width: number
    focusedNode: TreeNode | null
  }>(({ nodes, width, height, focusedNode }) => {
    const listRef = React.useRef<List>(null)
    React.useEffect(() => {
      if (focusedNode && listRef.current) {
        listRef.current.scrollToItem(nodes.indexOf(focusedNode), 'smart')
      }
    }, [listRef.current, focusedNode])

    const lastNodeLength = usePrevious(nodes.length)
    React.useEffect(() => {
      if (listRef.current && !focusedNode && lastNodeLength !== nodes.length) {
        listRef.current.scrollTo(0)
      }
    }, [listRef.current, focusedNode, nodes.length])
    return (
      <List
        ref={listRef}
        itemKey={(index, { nodes }) => {
          const node = nodes[index]
          return node && node.path
        }}
        itemData={{ nodes }}
        itemCount={nodes.length}
        itemSize={35}
        height={height}
        width={width}
      >
        {this.VirtualNode}
      </List>
    )
  })

  VirtualNode = React.memo<ListChildComponentProps>(({ index, style }) => {
    const { visibleNodes, onNodeClick } = this.props
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
        renderActions={this.renderActions}
      />
    )
  })

  private renderActions: Node['props']['renderActions'] = node => {
    const { searchKey, goTo } = this.props
    return (
      searchKey && (
        <button
          title={'Reveal in file tree'}
          className={'go-to-button'}
          onClick={this.revealNode(goTo, node)}
        >
          <Icon type="go-to" />
        </button>
      )
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
      search,
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
              <SearchBar searchKey={searchKey} onSearch={search} onFocus={onFocusSearchBar} />
              {this.renderFiles(visibleNodes)}
            </React.Fragment>
          )
        )}
      </div>
    )
  }
}

export const FileExplorer = connect(FileExplorerCore)(RawFileExplorer)
