import { wikiLinks } from 'components/SettingsBar'
import { SimpleToggleField } from 'components/SimpleToggleField'
import { useConfigs } from 'containers/ConfigsContext'
import * as React from 'react'
import { Config } from 'utils/configHelper'
import { Field } from './Field'
import { SettingsSection } from './SettingsSection'

const options: {
  key: Config['icons']
  value: Config['icons']
  label: string
}[] = [
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
    label: `Native GitHub icons`,
  },
]

type Props = {}

export function FileTreeSettings(props: React.PropsWithChildren<Props>) {
  const configContext = useConfigs()
  return (
    <SettingsSection title={'File Tree'}>
      <Field title="Icons" id="file-tree-icons">
        <select
          id="file-tree-icons"
          onChange={e => {
            configContext.set({
              icons: e.target.value as Config['icons'],
            })
          }}
          value={configContext.val.icons}
        >
          {options.map(option => (
            <option key={option.key} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
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
