import * as React from 'react'
import { Icon } from '../Icon'

const iconMap = {
  added: 'diffAdded',
  ignored: 'diffIgnored',
  modified: 'diffModified',
  removed: 'diffRemoved',
  renamed: 'diffRenamed',
}

export function DiffStatText({
  diff: { status, additions, deletions },
}: {
  diff: Required<TreeNode>['diff']
}) {
  return (
    <span className={'diff-stat-text'}>
      <Icon className={status} type={iconMap[status]} />
      {additions > 0 && <span className={'additions'}>{additions}</span>}
      {additions > 0 && deletions > 0 && '/'}
      {deletions > 0 && <span className={'deletions'}>{deletions}</span>}
    </span>
  )
}
