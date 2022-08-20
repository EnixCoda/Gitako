import { SimpleConfigFieldCheckbox } from 'components/settings/SimpleConfigField/Checkbox'
import { useConfigs } from 'containers/ConfigsContext'
import * as React from 'react'
import { subIO } from 'utils/general'
import { KeyboardShortcutSetting } from './KeyboardShortcutSetting'
import { SettingsSection } from './SettingsSection'

export function SidebarSettings() {
  const { sidebarToggleMode } = useConfigs().value

  return (
    <SettingsSection title={'Sidebar'}>
      <KeyboardShortcutSetting
        label={'Keyboard shortcut to toggle visibility'}
        {...subIO(useConfigs(), 'shortcut')}
      />
      <KeyboardShortcutSetting
        label={'Keyboard shortcut to focus search input'}
        {...subIO(useConfigs(), 'focusSearchInputShortcut')}
      />
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
