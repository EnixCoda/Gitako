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

export function FileTreeIconSettings(props: React.PropsWithChildren<Props>) {
  const configContext = useConfigs()
  return (
    <div className={'gitako-settings-bar-content-section toggle-shortcut'}>
      <h4>File Tree Icons</h4>
      <span>Icons can make a difference.</span>
      <br />
      <div className={'toggle-shortcut-input-control'}>
        <select
          onChange={e => {
            configContext.set({
              icons: e.target.value as Config['icons'],
            })
          }}
          className={'toggle-shortcut-input form-control'}
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
    </div>
  )
}
