import {
  DiffAddedIcon,
  DiffIgnoredIcon,
  DiffModifiedIcon,
  DiffRemovedIcon,
  DiffRenamedIcon
} from '@primer/octicons-react'
import * as React from 'react'
import { resolveDiffGraphMeta } from 'utils/general'
import { Icon } from '../Icon'

const iconMap = {
  added: DiffAddedIcon,
  ignored: DiffIgnoredIcon,
  modified: DiffModifiedIcon,
  removed: DiffRemovedIcon,
  renamed: DiffRenamedIcon,
}

export function DiffStatGraph({
  diff: { status, changes, additions, deletions },
}: {
  diff: Required<TreeNode>['diff']
}) {
  const { g, r, w } = resolveDiffGraphMeta(additions, deletions, changes)

  const children: React.ReactNode[] = []
  for (let i = 0; i < g; i++)
    children.push(<span key={`g-${i}`} className="diff-stat-graph-addition" />)
  for (let i = 0; i < r; i++)
    children.push(<span key={`r-${i}`} className="diff-stat-graph-deletion" />)
  for (let i = 0; i < w; i++)
    children.push(<span key={`w-${i}`} className="diff-stat-graph-no-change" />)

  return (
    <span className={'diff-stat-graph'}>
      <Icon className={status} IconComponent={iconMap[status]} />
      {children}
    </span>
  )
}
