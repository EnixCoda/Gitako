import * as React from 'react'
import { Icon } from './Icon'

export function DiffStatText({
  diff: { status, changes, additions, deletions },
}: {
  diff: Required<TreeNode>['diff']
}) {
  return (
    <span className={'diff-stat-text'}>
      {status !== 'modified' && (
        <Icon
          className={status}
          type={
            {
              added: 'diffAdded',
              ignored: 'diffIgnored',
              // modified: 'diffModified', // hide modified icon
              removed: 'diffRemoved',
              renamed: 'diffRenamed',
            }[status]
          }
        />
      )}
      {additions > 0 && (
        <span className={'additions'}>{status === 'modified' ? `+${additions}` : additions}</span>
      )}
      {additions > 0 && deletions > 0 && '/'}
      {deletions > 0 && (
        <span className={'deletions'}>{status === 'modified' ? `-${deletions}` : deletions}</span>
      )}
    </span>
  )
}
