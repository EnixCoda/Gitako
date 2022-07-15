export const dummyPlatformForTypeSafety: Platform = {
  isEnterprise() {
    return false
  },
  resolvePartialMetaData() {
    return null
  },
  getDefaultBranchName: dummyPlatformMethod,
  resolveUrlFromMetaData: dummyPlatformMethod,
  getTreeData: dummyPlatformMethod,
  shouldExpandSideBar() {
    return false
  },
  getCurrentPath: dummyPlatformMethod,
  setOAuth: dummyPlatformMethod,
  getOAuthLink: dummyPlatformMethod,
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function dummyPlatformMethod(): any {
  throw new Error(`Do not call dummy platform methods`)
}
