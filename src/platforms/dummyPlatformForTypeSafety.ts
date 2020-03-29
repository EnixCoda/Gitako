export const dummyPlatformForTypeSafety: Platform = {
  resolveMeta() {
    return null
  },
  getMetaData: dummyPlatformMethod,
  getTreeData: dummyPlatformMethod,
  shouldShow() {
    return false
  },
  getCurrentPath: dummyPlatformMethod,
  setOAuth: dummyPlatformMethod,
  useResizeStylesheets: dummyPlatformMethod,
  getOAuthLink: dummyPlatformMethod,
}

function dummyPlatformMethod(): any {
  throw new Error(`Do not call dummy platform methods`)
}
