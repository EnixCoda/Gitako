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

function dummyPlatformMethod(): any { // eslint-disable-line @typescript-eslint/no-explicit-any
  throw new Error(`Do not call dummy platform methods`)
}
