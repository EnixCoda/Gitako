import { useConfigs } from 'containers/ConfigsContext'
import * as React from 'react'
import { Config } from 'utils/configHelper'
import { Field } from './Field'
import { SettingsSection } from './SettingsSection'
import { setTheme } from 'utils/DOMHelper'

const options: {
  key: Config['theme']
  value: Config['theme']
  label: string
}[] = [
  {
    key: 'default',
    value: 'default',
    label: `Default`,
  },
  {
    key: 'dark',
    value: 'dark',
    label: `Dark`,
  }
]

type Props = {}

export function ThemeSettings(props: React.PropsWithChildren<Props>) {
  const configContext = useConfigs()

  const onThemeChange = React.useCallback(e => {
    const theme = e.target.value as Config['theme']
      configContext.set({ theme })
      setTheme(theme)
    },
    []
  )

  return (
    <SettingsSection title={'Theme'}>
      <Field title="Theme" id="theme">
        <select
          id="theme"
          onChange={onThemeChange}
          value={configContext.val.theme}
        >
          {options.map(option => (
            <option key={option.key} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </Field>
    </SettingsSection>
  )
}
