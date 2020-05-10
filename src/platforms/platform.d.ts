type Platform = {
  isEnterprise(): boolean
  resolveMeta(): MetaData | null
  getMetaData(
    metaData: Pick<MetaData, 'userName' | 'repoName'>,
    accessToken?: string,
  ): Promise<Pick<MetaData, 'userUrl' | 'repoUrl' | 'defaultBranchName'>>
  getTreeData(metaData: MetaData, accessToken?: string): Promise<TreeNode>
  shouldShow(metaData?: Partial<MetaData>): boolean
  getCurrentPath(branchName: string): string[] | null
  setOAuth(code: string): Promise<string | null>
  getOAuthLink(): string
}
