import { resolvePlatformP } from 'platforms'
import { dummyPlatformForTypeSafety } from 'platforms/dummyPlatformForTypeSafety'
import * as React from 'react'

const PlatformContext = React.createContext<Platform>(dummyPlatformForTypeSafety)

export function PlatformContextWrapper({ children }: React.PropsWithChildren<{}>) {
  const [platform, setPlatform] = React.useState(dummyPlatformForTypeSafety)
  React.useEffect(() => {
    resolvePlatformP.then(setPlatform)
  }, [])
  return <PlatformContext.Provider value={platform}>{children}</PlatformContext.Provider>
}

export function usePlatform() {
  return React.useContext(PlatformContext)
}
