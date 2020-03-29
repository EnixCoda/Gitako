import { Breadcrumb } from '@primer/components'
import * as React from 'react'

type Props = {
  metaData: MetaData
}

export function MetaBar({ metaData: { userName, repoName, branchName, repoUrl, userUrl } }: Props) {
  return (
    <div className={'meta-bar'}>
      <Breadcrumb>
        <Breadcrumb.Item href={userUrl}>{userName}</Breadcrumb.Item>
        <Breadcrumb.Item className={'repo-name'} href={repoUrl}>
          {repoName}
        </Breadcrumb.Item>
        <Breadcrumb.Item selected>{branchName}</Breadcrumb.Item>
      </Breadcrumb>
    </div>
  )
}
