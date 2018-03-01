import preact from 'preact'
/** @jsx preact.h */

export default function MetaBar({ metaData }) {
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
    </div>
  )
}
