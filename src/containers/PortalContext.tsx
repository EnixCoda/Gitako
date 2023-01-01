import * as React from 'react'

export type PortalContextShape = string | null

export const PortalContext = React.createContext<PortalContextShape>(null)
