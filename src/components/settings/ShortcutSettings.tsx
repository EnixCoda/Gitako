import { useConfigs } from 'containers/ConfigsContext'
import * as React from 'react'
import { friendlyFormatShortcut } from 'utils/general'
import { useStates } from 'utils/hooks'
import * as keyHelper from 'utils/keyHelper'

type Props = {}

export function ShortcutSettings(props: React.PropsWithChildren<Props>) {
  const configContext = useConfigs()
  const useShortcutHint = useStates('')
  const useToggleShowSideBarShortcut = useStates(configContext.val.shortcut)
  const { val: toggleShowSideBarShortcut } = useToggleShowSideBarShortcut
  const { val: shortcutHint } = useShortcutHint

  React.useEffect(() => {
    useToggleShowSideBarShortcut.set(configContext.val.shortcut)
  }, [configContext.val.shortcut])

  const saveShortcut = React.useCallback(async () => {
    const { val: toggleShowSideBarShortcut } = useToggleShowSideBarShortcut
    configContext.set({ shortcut: toggleShowSideBarShortcut })
    if (typeof toggleShowSideBarShortcut === 'string') {
      useShortcutHint.set('Shortcut is saved!')
    }
  }, [useToggleShowSideBarShortcut.val])

  const onShortCutInputKeyDown = React.useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    e.preventDefault()
    e.stopPropagation()
    // Clear shortcut with backspace
    const shortcut = e.key === 'Backspace' ? '' : keyHelper.parseEvent(e)
    useToggleShowSideBarShortcut.set(shortcut)
  }, [])

  return (
    <div className={'gitako-settings-bar-content-section toggle-shortcut'}>
      <h4>Toggle Shortcut</h4>
      <span>Set a combination of keys for toggling Gitako sidebar.</span>
      <br />
      <div className={'toggle-shortcut-input-control'}>
        <input
          className={'toggle-shortcut-input form-control'}
          placeholder={'focus here and press the shortcut keys'}
          value={friendlyFormatShortcut(toggleShowSideBarShortcut)}
          onKeyDown={onShortCutInputKeyDown}
          readOnly
        />
        <button className={'btn'} onClick={saveShortcut}>
          Save
        </button>
      </div>
      {shortcutHint && <span className={'hint'}>{shortcutHint}</span>}
    </div>
  )
}
