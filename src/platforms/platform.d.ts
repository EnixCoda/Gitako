type Platform = {
  isEnterprise(): boolean
  // branch name might not be available when resolving from DOM and URL
  resolveMeta(): MakeOptional<MetaData, 'branchName'> | null
  resolvePageScope?(): string
  getDefaultBranchName(
    metaData: Pick<MetaData, 'userName' | 'repoName'>,
    accessToken?: string,
  ): Promise<string>
  resolveUrlFromMetaData(
    metaData: MetaData,
  ): {
    userUrl: string
    repoUrl: string
  }
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
