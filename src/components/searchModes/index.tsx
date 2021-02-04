import { ReactNode } from 'react'
import { SearchParams } from 'utils/VisibleNodesGenerator'
import { fuzzyMode } from './fuzzyMode'
import { regexMode } from './regexMode'

export type SearchMode = 'regex' | 'fuzzy'

export type ModeShape = {
  getSearchParams(searchKey: string): Pick<SearchParams, 'matchNode'> | null
  renderNodeLabelText(node: TreeNode, searchKey: string): ReactNode
}

export const searchModes: Record<SearchMode, ModeShape> = {
  regex: regexMode,
  fuzzy: fuzzyMode,
}
