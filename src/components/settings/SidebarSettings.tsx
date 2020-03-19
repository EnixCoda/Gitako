import { Button, TextInput } from '@primer/components'
import { SimpleToggleField } from 'components/SimpleToggleField'
import { useConfigs } from 'containers/ConfigsContext'
import * as React from 'react'
import { friendlyFormatShortcut } from 'utils/general'
import { useStates } from 'utils/hooks/useStates'
import * as keyHelper from 'utils/keyHelper'
import { Field } from './Field'
import { SettingsSection } from './SettingsSection'

type Props = {}

export function SidebarSettings(props: React.PropsWithChildren<Props>) {
  const configContext = useConfigs()
  const useToggleShowSideBarShortcut = useStates(configContext.val.shortcut)
  const { val: toggleShowSideBarShortcut } = useToggleShowSideBarShortcut
  const focused = useStates(false)

  React.useEffect(() => {
    useToggleShowSideBarShortcut.set(configContext.val.shortcut)
  }, [configContext.val.shortcut])

  return (
    <SettingsSection title={'Toggle Sidebar'}>
      <Field id="toggle-sidebar-shortcut" title="Keyboard Shortcut">
        <div className={'toggle-shortcut-input-control'}>
          <TextInput
            id="toggle-sidebar-shortcut"
            backgroundColor="#fff"
            marginRight={1}
            className={'toggle-shortcut-input'}
            onFocus={() => focused.set(true)}
            onBlur={() => focused.set(false)}
            placeholder={focused.val ? 'Press key combination' : 'Click here to set'}
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
          {configContext.val.shortcut === toggleShowSideBarShortcut ? (
            <Button
              disabled={!configContext.val.shortcut}
              onClick={() => {
                configContext.set({ shortcut: '' })
              }}
            >
              Clear
            </Button>
          ) : (
            <Button
              onClick={() => {
                const { val: toggleShowSideBarShortcut } = useToggleShowSideBarShortcut
                if (typeof toggleShowSideBarShortcut !== 'string') return
                configContext.set({ shortcut: toggleShowSideBarShortcut })
              }}
            >
              Save
            </Button>
          )}
        </div>
      </Field>
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
    </SettingsSection>
  )
}
