import { VisibleNodes, VisibleNodesGenerator } from '.'
import { searchModes } from '../../components/searchModes/index'
import { prepareVisibleNodes } from './prepare'
import searchResult__json from './searchResults/json.json'
import treeRoot from './treeData.json'

const compressSingletonFolder = true
const restoreExpandedFolders = true

const visibleNodesGenerator = new VisibleNodesGenerator({
  root: treeRoot as TreeNode,
  compress: compressSingletonFolder,
  async getTreeData() {
    throw new Error(`\`getTreeData\` should not be called`)
  },
})

const search = (searchKey: string, searchMode: 'regex' | 'fuzzy') =>
  new Promise<VisibleNodes>(resolve => {
    const cancel = visibleNodesGenerator.onUpdate(visibleNodes => {
      cancel()
      resolve(visibleNodes)
    })
    visibleNodesGenerator.search(
      searchModes[searchMode].getSearchParams(searchKey),
      restoreExpandedFolders,
    )
  })

// In Jest, `it`s does not handle async flow as expected,
// there will be errors if the `it`s are in the same `describe`.
// But `describes` run in sequence.

describe('VisibleNodesGenerator Regex Search', () => {
  it('finds all nodes when searching regexp /./', async () => {
    for (const node of visibleNodesGenerator.visibleNodes.nodes) {
      await visibleNodesGenerator.toggleExpand(node, true)
    }
    const initialVisibleNodes = visibleNodesGenerator.visibleNodes
    expect(prepareVisibleNodes(await search('.', 'regex')).nodes).toEqual(
      prepareVisibleNodes(initialVisibleNodes).nodes,
    )
  })
})

describe('VisibleNodesGenerator Fuzzy Search', () => {
  it('finds correct nodes when searching path `json`', async () => {
    expect(prepareVisibleNodes(await search('json', 'fuzzy'))).toEqual(searchResult__json)
  })
})
