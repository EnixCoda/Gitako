import { ConfigsContextShape } from 'containers/ConfigsContext'
import * as React from 'react'
import * as keyHelper from 'utils/keyHelper'
import { SideBarState } from '../../containers/SideBarState'

export function useToggleSideBarWithKeyboard(
  state: SideBarState,
  configContext: ConfigsContextShape,
  toggleShowSideBar: () => void,
) {
  const isDisabled = state === 'disabled'
  React.useEffect(
    function attachKeyDown() {
      if (isDisabled || !configContext.value.shortcut) return

      function onKeyDown(e: KeyboardEvent) {
        const keys = keyHelper.parseEvent(e)
        if (keys === configContext.value.shortcut) {
          toggleShowSideBar()
        }
      }
      window.addEventListener('keydown', onKeyDown)
      return () => window.removeEventListener('keydown', onKeyDown)
    },
    [toggleShowSideBar, isDisabled, configContext.value.shortcut],
  )
}
