import { Option, Select } from 'components/Select'
import { useConfigs } from 'containers/ConfigsContext'
import * as React from 'react'
import { Config } from 'utils/configHelper'
import { Field } from './Field'
import { SettingsSection } from './SettingsSection'

const options: Option<Config['theme']>[] = [
  {
    key: 'default',
    value: 'default',
    label: `Default`,
  },
  {
    key: 'dark',
    value: 'dark',
    label: `Dark`,
  },
]

type Props = {}

export function ThemeSettings(props: React.PropsWithChildren<Props>) {
  const configContext = useConfigs()

  return (
    <SettingsSection title={'Theme'}>
      <Field title="Theme" id="theme">
        <Select
          id="theme"
          onChange={theme => configContext.set({ theme })}
          value={configContext.val.theme}
          options={options}
        />
      </Field>
    </SettingsSection>
  )
}
