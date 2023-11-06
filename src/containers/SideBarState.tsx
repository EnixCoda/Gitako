import { PropsWithChildren } from 'common'
import * as React from 'react'
import { useLoadedContext } from 'utils/hooks/useLoadedContext'
import { useStateIO } from 'utils/hooks/useStateIO'
import { SideBarErrorContext } from './ErrorContext'
import { useInspector } from './Inspector'

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
  | 'error' // when error occurs, sidebar should never expand
  | 'error-due-to-auth' // this is a special error, user can expand sidebar and set token to fix the error

export type SideBarStateContextShape = IO<SideBarState>

export const SideBarStateContext = React.createContext<SideBarStateContextShape | null>(null)

export function StateBarStateContextWrapper({ children }: PropsWithChildren) {
  const $state = useStateIO<SideBarState>('disabled')
  useInspector('SideBarStateContext', $state.value)
  const error = useLoadedContext(SideBarErrorContext).value
  const $$state: IO<SideBarState> = React.useMemo(
    () =>
      error && $state.value !== 'error'
        ? {
            ...$state,
            value: 'error',
          }
        : $state,
    [$state, error],
  )

  return <SideBarStateContext.Provider value={$$state}>{children}</SideBarStateContext.Provider>
}
