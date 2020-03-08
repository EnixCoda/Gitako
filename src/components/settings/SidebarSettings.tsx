import { SimpleToggleField } from 'components/SimpleToggleField'
import { useConfigs } from 'containers/ConfigsContext'
import * as React from 'react'
import { friendlyFormatShortcut } from 'utils/general'
import { useStates } from 'utils/hooks/useStates'
import * as keyHelper from 'utils/keyHelper'

type Props = {}

export function SidebarSettings(props: React.PropsWithChildren<Props>) {
  const configContext = useConfigs()
  const useToggleShowSideBarShortcut = useStates(configContext.val.shortcut)
  const { val: toggleShowSideBarShortcut } = useToggleShowSideBarShortcut

  React.useEffect(() => {
    useToggleShowSideBarShortcut.set(configContext.val.shortcut)
  }, [configContext.val.shortcut])

  return (
    <div className={'gitako-settings-bar-content-section toggle-shortcut'}>
      <h4>Toggle Sidebar</h4>
      <label className="form-label" htmlFor="toggle-sidebar-shortcut">
        Keyboard Shortcut
      </label>
      <div className={'toggle-shortcut-input-control'}>
        <input
          id="toggle-sidebar-shortcut"
          className={'toggle-shortcut-input form-control'}
          placeholder={'focus here and press the shortcut keys'}
          value={friendlyFormatShortcut(toggleShowSideBarShortcut)}
          onKeyDown={React.useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
            e.preventDefault()
            e.stopPropagation()
            // Clear shortcut with backspace
            const shortcut = e.key === 'Backspace' ? '' : keyHelper.parseEvent(e)
            useToggleShowSideBarShortcut.set(shortcut)
          }, [])}
          readOnly
        />
        <button
          className={'btn'}
          disabled={toggleShowSideBarShortcut === configContext.val.shortcut}
          onClick={() => {
            const { val: toggleShowSideBarShortcut } = useToggleShowSideBarShortcut
            if (typeof toggleShowSideBarShortcut !== 'string') return
            configContext.set({ shortcut: toggleShowSideBarShortcut })
          }}
        >
          Save
        </button>
      </div>
      <SimpleToggleField
        field={{
          key: 'intelligentToggle',
          label: 'Auto toggle according to page content.',
          overwrite: {
            value: enabled => enabled === null,
            onChange: checked => (checked ? null : true),
          },
        }}
      />
    </div>
  )
}
