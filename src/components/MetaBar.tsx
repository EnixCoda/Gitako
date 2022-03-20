import { BranchName, Breadcrumb, Flex, Text } from '@primer/components'
import { GitBranchIcon } from '@primer/octicons-react'
import { platform } from 'platforms'
import * as React from 'react'
import { createAnchorClickHandler } from 'utils/general'

type Props = {
  metaData: MetaData
}

export function MetaBar({ metaData }: Props) {
  const { userName, repoName, branchName } = metaData
  const { repoUrl, userUrl, branchUrl } = platform.resolveUrlFromMetaData(metaData)
  return (
    <>
      <Breadcrumb className={'user-and-repo'}>
        <Breadcrumb.Item className={'user-name'} href={userUrl}>
          {userName}
        </Breadcrumb.Item>
        <Breadcrumb.Item
          className={'repo-name'}
          href={repoUrl}
          onClick={createAnchorClickHandler(repoUrl)}
          {...platform.delegatePJAXProps?.()}
        >
          <Text fontWeight="bolder">{repoName}</Text>
        </Breadcrumb.Item>
      </Breadcrumb>
      <Flex paddingTop={1} flexWrap="nowrap" alignItems="flex-start">
        <div className={'octicon-wrapper'}>
          <GitBranchIcon size="small" />
        </div>
        <BranchName
          href={branchUrl}
          as="a"
          className={'branch-name'}
          onClick={createAnchorClickHandler(branchUrl)}
          {...platform.delegatePJAXProps?.()}
        >
          {branchName || '...'}
        </BranchName>
      </Flex>
    </>
  )
}
