import * as React from 'react'
import { MetaData } from 'utils/GitHubHelper'

type Props = {
  metaData: MetaData
}

export default function MetaBar({ metaData }: Props) {
  const userUrl = metaData ? metaData.api && metaData.api.owner.html_url : undefined
  const repoUrl = metaData ? metaData.api && metaData.api.html_url : undefined
  return (
    <div className={'meta-bar'}>
      <a className={'username'} href={userUrl}>
        {metaData.userName}
      </a>
      &nbsp;/&nbsp;
      <a className={'repo-name pjax-link'} href={repoUrl}>
        {metaData.repoName}
      </a>
      &nbsp;/&nbsp;
      {metaData.branchName}
    </div>
  )
}
