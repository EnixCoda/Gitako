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
  shouldShow() {
    return false
  },
  getCurrentPath: dummyPlatformMethod,
  setOAuth: dummyPlatformMethod,
  getOAuthLink: dummyPlatformMethod,
}

function dummyPlatformMethod(): any {
  throw new Error(`Do not call dummy platform methods`)
}
