import { VisibleNodesGenerator } from 'utils/VisibleNodesGenerator'

export type Platform = {
  shouldActivate?(): boolean
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
  shouldExpandSideBar(deferToNativeFileTree?: boolean): boolean
  // True when the sidebar stays collapsed specifically because the host site
  // is showing its own native file tree on a code/PR page (not merely because
  // the page is irrelevant). Drives the one-time auto-collapse hint. The
  // `deferToNativeFileTree` flag mirrors the user setting that disables this
  // deferral (when false, Gitako does not collapse for the native tree).
  isSideBarCollapsedByNativeFileTree?(deferToNativeFileTree?: boolean): boolean
  shouldExpandAll?(): boolean
  getCurrentPath(branchName: string): string[] | null
  setOAuth(code: string): Promise<string | null>
  getOAuthLink(): string
  delegateFastRedirectAnchorProps?(options?: { node?: TreeNode }):
    | (React.DOMAttributes<HTMLElement> & Record<string, unknown>) // support data-* attributes
    | void
  loadWithFastRedirect?(url: string, element: HTMLElement): boolean | void
  usePlatformHooks?(): void
  usePlatformFileTreeHooks?(fileTree: {
    visibleNodesGenerator?: VisibleNodesGenerator | null
  }): void
  mapErrorMessage?: (error: Error) => string | void
}
