import { wikiLinks } from 'components/SettingsBar'
import { SimpleToggleField } from 'components/SimpleToggleField'
import { useConfigs } from 'containers/ConfigsContext'
import * as React from 'react'
import { Config } from 'utils/configHelper'

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
    <div className={'gitako-settings-bar-content-section'}>
      <h4>File Tree</h4>
      <label className="form-label" htmlFor="file-tree-icons">
        Icons
      </label>
      <div>
        <select
          id="file-tree-icons"
          onChange={e => {
            configContext.set({
              icons: e.target.value as Config['icons'],
            })
          }}
          className={'file-tree-input form-control'}
          placeholder={'focus here and press the shortcut keys'}
          value={configContext.val.icons}
        >
          {options.map(option => (
            <option key={option.key} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
      <SimpleToggleField
        field={{
          key: 'compressSingletonFolder',
          label: 'Compress singleton folder',
          wikiLink: wikiLinks.compressSingletonFolder,
        }}
      />
    </div>
  )
}
