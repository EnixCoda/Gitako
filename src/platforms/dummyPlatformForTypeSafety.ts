export const dummyPlatformForTypeSafety: Platform = {
  resolveMeta() {
    return null
  },
  getMetaData: callingDummyPlatformMethods,
  getTreeData: callingDummyPlatformMethods,
  shouldShow() {
    return false
  },
  getCurrentPath: callingDummyPlatformMethods,
  setOAuth: callingDummyPlatformMethods,
  useResizeStylesheets: callingDummyPlatformMethods,
}

function callingDummyPlatformMethods(): any {
  throw new Error(`Do not call dummy platform methods`)
}
