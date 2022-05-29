import { useConfigs } from 'containers/ConfigsContext'
import * as React from 'react'
import * as keyHelper from 'utils/keyHelper'
import { SideBarState } from '../../containers/SideBarState'

export function useToggleSideBarWithKeyboard(state: SideBarState, toggleShowSideBar: () => void) {
  const { shortcut } = useConfigs().value
  const isDisabled = state === 'disabled' || !shortcut
  React.useEffect(
    function attachKeyDown() {
      if (isDisabled) return

      function onKeyDown(e: KeyboardEvent) {
        const keys = keyHelper.parseEvent(e)
        if (keys === shortcut) toggleShowSideBar()
      }
      window.addEventListener('keydown', onKeyDown)
      return () => window.removeEventListener('keydown', onKeyDown)
    },
    [toggleShowSideBar, isDisabled, shortcut],
  )
}
