import * as React from 'react'
import { useLoadedContext } from 'utils/hooks/useLoadedContext'
import * as keyHelper from 'utils/keyHelper'
import { SideBarStateContext } from '../../containers/SideBarState'

export function useOnShortcutPressed(
  shortcut: string | undefined,
  onPressed: (e: KeyboardEvent) => void,
) {
  const state = useLoadedContext(SideBarStateContext).value
  const isDisabled = state === 'disabled' || !shortcut
  React.useEffect(
    function attachKeyDown() {
      if (isDisabled) return

      function onKeyDown(e: KeyboardEvent) {
        const keys = keyHelper.parseEvent(e)
        if (keys === shortcut) onPressed(e)
      }
      window.addEventListener('keydown', onKeyDown)
      return () => window.removeEventListener('keydown', onKeyDown)
    },
    [onPressed, isDisabled, shortcut],
  )
}
