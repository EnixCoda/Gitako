import { BranchName, Breadcrumb, Flex, Grid, Text } from '@primer/components'
import { GitBranchIcon } from '@primer/octicons-react'
import * as React from 'react'

type Props = {
  metaData: MetaData
}

export function MetaBar({ metaData: { userName, repoName, branchName, repoUrl, userUrl } }: Props) {
  return (
    <Flex flexDirection="column" justifyContent="space-between" className={'meta-bar'}>
      <Breadcrumb>
        <Breadcrumb.Item href={userUrl}>{userName}</Breadcrumb.Item>
        <Breadcrumb.Item href={repoUrl}>
          <Text fontWeight="bolder">{repoName}</Text>
        </Breadcrumb.Item>
      </Breadcrumb>
      <Grid gridTemplateColumns="repeat(2, max-content)">
        <div className={'octicon-wrapper'}>
          <GitBranchIcon size="small" />
        </div>
        <BranchName as="span" backgroundColor="blue.0">
          {branchName}
        </BranchName>
      </Grid>
    </Flex>
  )
}
