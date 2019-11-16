import * as React from 'react'
import { safeTouch } from 'safe-touch'
import { MetaData } from 'utils/GitHubHelper'

type Props = {
  metaData: MetaData
}

export function MetaBar({ metaData }: Props) {
  const userUrl = safeTouch(metaData).api.owner.html_url()
  const repoUrl = safeTouch(metaData).api.html_url()
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
