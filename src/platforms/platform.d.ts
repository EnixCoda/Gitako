type Platform = {
  isEnterprise(): boolean
  // branch name might not be available when resolving from DOM and URL
  resolvePartialMetaData(): PartialMetaData | null
  // resolveMetaData(metaData: PartialMetaData, accessToken?: string): Async<MetaData>
  getDefaultBranchName(
    metaData: Pick<MetaData, 'userName' | 'repoName'>,
    accessToken?: string,
  ): Promise<string>
  resolveUrlFromMetaData(metaData: MetaData): {
    userUrl: string
    repoUrl: string
    branchUrl: string
  }
  getTreeData(
    metaData: Pick<MetaData, 'userName' | 'repoName' | 'branchName'>,
    path?: string,
    recursive?: boolean,
    accessToken?: string,
  ): Promise<{ root: TreeNode; defer?: boolean }>
  shouldShow(): boolean
  shouldExpandAll?(): boolean
  getCurrentPath(branchName: string): string[] | null
  setOAuth(code: string): Promise<string | null>
  getOAuthLink(): string
  delegatePJAXProps?(options?: { node?: TreeNode }):
    | (React.DOMAttributes<HTMLElement> & Record<string, unknown>) // support data-* attributes
    | void
  loadWithPJAX?(url: string, element: HTMLElement): boolean | void
  usePlatformHooks?(): void
}
