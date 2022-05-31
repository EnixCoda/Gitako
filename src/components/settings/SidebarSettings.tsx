import { Box, Button, FormControl, TextInput } from '@primer/react'
import { SimpleConfigFieldCheckbox } from 'components/settings/SimpleConfigField/Checkbox'
import { useConfigs } from 'containers/ConfigsContext'
import * as React from 'react'
import { friendlyFormatShortcut, noop } from 'utils/general'
import { useStateIO } from 'utils/hooks/useStateIO'
import * as keyHelper from 'utils/keyHelper'
import { SettingsSection } from './SettingsSection'

export function SidebarSettings() {
  const { sidebarToggleMode } = useConfigs().value

  return (
    <SettingsSection title={'Sidebar'}>
      <ToggleSidebarShortcutSettings />
      <SimpleConfigFieldCheckbox
        field={{
          key: 'intelligentToggle',
          label: 'Auto expand',
          disabled: sidebarToggleMode === 'float',
          tooltip: `Gitako will expand when exploring source files, pull requests, etc. And collapse otherwise.${
            sidebarToggleMode === 'float' ? '\nNow disabled as sidebar is in float mode.' : ''
          }`,
          overwrite: {
            value: enabled => (sidebarToggleMode === 'float' ? false : enabled === null),
            onChange: checked => (checked ? null : true),
          },
        }}
      />
    </SettingsSection>
  )
}

function ToggleSidebarShortcutSettings() {
  const configContext = useConfigs()
  const { shortcut } = configContext.value
  const id = 'toggle-show-sidebar-shortcut'

  React.useEffect(() => {
    useToggleShowSideBarShortcut.onChange(shortcut)
  }, [shortcut]) // eslint-disable-line react-hooks/exhaustive-deps

  const useToggleShowSideBarShortcut = useStateIO(shortcut)
  const { value: toggleShowSideBarShortcut } = useToggleShowSideBarShortcut
  const focused = useStateIO(false)

  return (
    <FormControl>
      <FormControl.Label htmlFor={id}>Keyboard shortcut to toggle visibility</FormControl.Label>
      <Box display="inline-flex" width="100%">
        <TextInput
          id={id}
          sx={{ marginRight: 1, flex: 1 }}
          onFocus={() => focused.onChange(true)}
          onBlur={() => focused.onChange(false)}
          placeholder={focused.value ? 'Press key combination' : 'Click here to set'}
          value={friendlyFormatShortcut(toggleShowSideBarShortcut)}
          onChange={noop}
          onKeyDown={React.useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
            e.preventDefault()
            e.stopPropagation()
            // Clear shortcut with backspace
            const shortcut = e.key === 'Backspace' ? '' : keyHelper.parseEvent(e)
            useToggleShowSideBarShortcut.onChange(shortcut)
          }, [])} // eslint-disable-line react-hooks/exhaustive-deps
        />
        {shortcut === toggleShowSideBarShortcut ? (
          <Button
            disabled={!shortcut}
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
      </Box>
    </FormControl>
  )
}
