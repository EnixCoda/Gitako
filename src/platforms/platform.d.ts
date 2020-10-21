type Platform = {
  isEnterprise(): boolean
  resolveMeta(): MetaData | null
  getMetaData(
    metaData: Pick<MetaData, 'userName' | 'repoName'>,
    accessToken?: string,
  ): Promise<Pick<MetaData, 'userUrl' | 'repoUrl' | 'defaultBranchName'>>
  getTreeData(
    metaData: MetaData,
    path?: string,
    recursive?: boolean,
    accessToken?: string,
  ): Promise<{ root: TreeNode; defer?: boolean }>
  shouldShow(): boolean
  shouldExpandAll?(): boolean
  getCurrentPath(branchName: string): string[] | null
  setOAuth(code: string): Promise<string | null>
  getOAuthLink(): string
}
