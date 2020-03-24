import { Breadcrumb } from '@primer/components'
import * as React from 'react'
import { MetaData } from 'utils/GitHubHelper'

type Props = {
  metaData: MetaData
}

export function MetaBar({ metaData }: Props) {
  const userUrl = metaData?.api?.owner.html_url
  const repoUrl = metaData?.api?.html_url
  return (
    <div className={'meta-bar'}>
      <Breadcrumb>
        <Breadcrumb.Item href={userUrl}>{metaData.userName}</Breadcrumb.Item>
        <Breadcrumb.Item className={'repo-name'} href={repoUrl}>
          {metaData.repoName}
        </Breadcrumb.Item>
        <Breadcrumb.Item selected>{metaData.branchName}</Breadcrumb.Item>
      </Breadcrumb>
    </div>
  )
}
