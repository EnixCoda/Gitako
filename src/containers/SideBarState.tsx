import * as React from 'react'
import { useStateIO } from 'utils/hooks/useStateIO'

export type SideBarState =
  | 'disabled'
  | 'getting-access-token'
  | 'after-getting-access-token' // mid-state for a smoother state switch out of 'getting-access-token'
  | 'meta-loading'
  | 'meta-loaded'
  | 'tree-loading'
  | 'tree-rendering'
  | 'tree-rendered'
  | 'idle'
  | 'error-due-to-auth'

export type SideBarStateContextShape = IO<SideBarState>

export const SideBarStateContext = React.createContext<SideBarStateContextShape | null>(null)

export function StateBarStateContextWrapper({ children }: React.PropsWithChildren<{}>) {
  const $state = useStateIO<SideBarState>('disabled')

  return (
    <SideBarStateContext.Provider value={$state}>
      {$state.value !== null && children}
    </SideBarStateContext.Provider>
  )
}
