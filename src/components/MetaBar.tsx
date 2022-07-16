import { GitBranchIcon } from '@primer/octicons-react'
import { Box, BranchName, Breadcrumbs, Text } from '@primer/react'
import { RepoContext } from 'containers/RepoContext'
import { platform } from 'platforms'
import * as React from 'react'
import { createAnchorClickHandler } from 'utils/createAnchorClickHandler'

export function MetaBar() {
  const metaData = React.useContext(RepoContext)
  if (!metaData) return null

  const { userName, repoName, branchName } = metaData
  const { repoUrl, userUrl, branchUrl } = platform.resolveUrlFromMetaData(metaData)
  return (
    <>
      <Breadcrumbs className={'user-and-repo'}>
        <Breadcrumbs.Item className={'user-name'} href={userUrl}>
          {userName}
        </Breadcrumbs.Item>
        <Breadcrumbs.Item
          className={'repo-name'}
          href={repoUrl}
          onClick={createAnchorClickHandler(repoUrl)}
          {...platform.delegateFastRedirectAnchorProps?.()}
        >
          <Text fontWeight="bolder">{repoName}</Text>
        </Breadcrumbs.Item>
      </Breadcrumbs>
      <Box display="flex" paddingTop={1} flexWrap="nowrap" alignItems="flex-start">
        <div className={'octicon-wrapper'}>
          <GitBranchIcon size="small" />
        </div>
        <BranchName
          href={branchUrl}
          as="a"
          onClick={createAnchorClickHandler(branchUrl)}
          sx={{
            color: 'fg.muted',
          }}
          {...platform.delegateFastRedirectAnchorProps?.()}
        >
          {branchName || '...'}
        </BranchName>
      </Box>
    </>
  )
}
