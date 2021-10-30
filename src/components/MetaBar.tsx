import { BranchName, Breadcrumb, Flex, Text } from '@primer/components'
import { GitBranchIcon } from '@primer/octicons-react'
import { platform } from 'platforms'
import * as React from 'react'
import { isOpenInNewWindowClick } from 'utils/general'
import { loadWithPJAX } from 'utils/hooks/usePJAX'

type Props = {
  metaData: MetaData
}

export function MetaBar({ metaData }: Props) {
  const { userName, repoName, branchName } = metaData
  const { repoUrl, userUrl, branchUrl } = platform.resolveUrlFromMetaData(metaData)
  return (
    <>
      <Breadcrumb className={'user-and-repo'}>
        <Breadcrumb.Item href={userUrl}>{userName}</Breadcrumb.Item>
        <Breadcrumb.Item href={repoUrl}>
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
          onClick={e => {
            if (isOpenInNewWindowClick(e)) return

            e.preventDefault()
            loadWithPJAX(branchUrl, e.currentTarget)
          }}
          {...platform.delegatePJAXProps?.()}
        >
          {branchName || '...'}
        </BranchName>
      </Flex>
    </>
  )
}
