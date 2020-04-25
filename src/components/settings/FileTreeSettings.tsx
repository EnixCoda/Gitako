import { Option, Select } from 'components/Select'
import { wikiLinks } from 'components/settings/SettingsBar'
import { SimpleToggleField } from 'components/SimpleToggleField'
import { useConfigs } from 'containers/ConfigsContext'
import * as React from 'react'
import { Config } from 'utils/configHelper'
import { Field } from './Field'
import { SettingsSection } from './SettingsSection'

const options: Option<Config['icons']>[] = [
  {
    key: 'rich',
    value: 'rich',
    label: `VSCode icons`,
  },
  {
    key: 'dim',
    value: 'dim',
    label: `VSCode icons (single color)`,
  },
  {
    key: 'native',
    value: 'native',
    label: `GitHub icons`,
  },
]

type Props = {}

export function FileTreeSettings(props: React.PropsWithChildren<Props>) {
  const configContext = useConfigs()
  return (
    <SettingsSection title={'File Tree'}>
      <Field title="Icons" id="file-tree-icons">
        <Select
          id="file-tree-icons"
          onChange={icons => configContext.set({ icons })}
          value={configContext.val.icons}
          options={options}
        />
      </Field>
      <SimpleToggleField
        field={{
          key: 'compressSingletonFolder',
          label: 'Compress singleton folder',
          wikiLink: wikiLinks.compressSingletonFolder,
        }}
      />
    </SettingsSection>
  )
}
