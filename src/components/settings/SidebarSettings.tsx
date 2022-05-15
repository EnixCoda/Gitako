import { Button, TextInput } from '@primer/react'
import { SimpleToggleField } from 'components/SimpleToggleField'
import { useConfigs } from 'containers/ConfigsContext'
import * as React from 'react'
import { friendlyFormatShortcut } from 'utils/general'
import { useStateIO } from 'utils/hooks/useStateIO'
import * as keyHelper from 'utils/keyHelper'
import { Field } from './Field'
import { SettingsSection } from './SettingsSection'

export function SidebarSettings() {
  const configContext = useConfigs()
  const useToggleShowSideBarShortcut = useStateIO(configContext.value.shortcut)
  const { value: toggleShowSideBarShortcut } = useToggleShowSideBarShortcut
  const focused = useStateIO(false)

  React.useEffect(() => {
    useToggleShowSideBarShortcut.onChange(configContext.value.shortcut)
  }, [configContext.value.shortcut]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <SettingsSection title={'Sidebar'}>
      <Field id="toggle-sidebar-shortcut" title="Keyboard shortcut to toggle visibility">
        <div className={'toggle-shortcut-input-control'}>
          <TextInput
            id="toggle-sidebar-shortcut"
            sx={{ marginRight: 1 }}
            className={'toggle-shortcut-input'}
            onFocus={() => focused.onChange(true)}
            onBlur={() => focused.onChange(false)}
            placeholder={focused.value ? 'Press key combination' : 'Click here to set'}
            value={friendlyFormatShortcut(toggleShowSideBarShortcut)}
            onKeyDown={React.useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
              e.preventDefault()
              e.stopPropagation()
              // Clear shortcut with backspace
              const shortcut = e.key === 'Backspace' ? '' : keyHelper.parseEvent(e)
              useToggleShowSideBarShortcut.onChange(shortcut)
            }, [])} // eslint-disable-line react-hooks/exhaustive-deps
            readOnly
          />
          {configContext.value.shortcut === toggleShowSideBarShortcut ? (
            <Button
              disabled={!configContext.value.shortcut}
              onClick={() => {
                configContext.onChange({ shortcut: '' })
              }}
            >
              Clear
            </Button>
          ) : (
            <Button
              onClick={() => {
                const { value: toggleShowSideBarShortcut } = useToggleShowSideBarShortcut
                if (typeof toggleShowSideBarShortcut !== 'string') return
                configContext.onChange({ shortcut: toggleShowSideBarShortcut })
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
          label: 'Auto expand',
          disabled: configContext.value.sidebarToggleMode === 'float',
          tooltip: `Gitako will expand when exploring source files, pull requests, etc. And collapse otherwise.${
            configContext.value.sidebarToggleMode === 'float'
              ? '\nNow disabled as sidebar is in float mode.'
              : ''
          }`,
          overwrite: {
            value: enabled =>
              configContext.value.sidebarToggleMode === 'float' ? false : enabled === null,
            onChange: checked => (checked ? null : true),
          },
        }}
      />
    </SettingsSection>
  )
}
