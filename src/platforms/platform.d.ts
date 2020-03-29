type Platform = {
  resolveMeta(): MetaData | null
  getMetaData(metaData: MetaData, accessToken?: string): Promise<MetaData>
  getTreeData(metaData: MetaData, accessToken?: string): Promise<TreeNode>
  shouldShow(metaData?: Partial<MetaData>): boolean
  getCurrentPath(branchName: string): string[] | null
  useResizeStylesheets(size: number): void
  setOAuth(code: string): Promise<string | null>
  getOAuthLink(): string
}
