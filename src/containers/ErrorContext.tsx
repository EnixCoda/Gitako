import { PropsWithChildren } from 'common'
import { useInspector } from 'containers/Inspector'
import * as React from 'react'
import { useStateIO } from 'utils/hooks/useStateIO'

export type SideBarErrorContextShape = IO<string | null>

export const SideBarErrorContext = React.createContext<SideBarErrorContextShape | null>(null)

export function StateBarErrorContextWrapper({ children }: PropsWithChildren) {
  const $error = useStateIO<string | null>(null)
  useInspector('SideBarErrorContext', $error.value)

  return <SideBarErrorContext.Provider value={$error}>{children}</SideBarErrorContext.Provider>
}
