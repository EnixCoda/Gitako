import * as React from 'react'
import { SidebarContext } from './SidebarContext'

export type FocusTarget = 'files' | 'search' | null

export function useFocusOnPendingTarget(target: FocusTarget, method: () => void) {
  const { pendingFocusTarget } = React.useContext(SidebarContext)
  React.useEffect(() => {
    if (pendingFocusTarget.value === target) {
      method()
      pendingFocusTarget.onChange(null)
    }
  }, [target, method, pendingFocusTarget])
}
