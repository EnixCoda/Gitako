import { Checkbox, FormControl } from '@primer/react'
import { useConfigs } from 'containers/ConfigsContext'
import * as React from 'react'
import { Config, ConfigKeys } from 'utils/config/helper'

export type SimpleField<Key extends ConfigKeys> = {
  key: Key
  label: string
  wikiLink?: string
  tooltip?: string
  disabled?: boolean
  overwrite?: {
    value: (value: Config[Key]) => boolean
    onChange: (checked: boolean) => Config[Key]
  }
}

type Props<Key extends ConfigKeys> = {
  field: SimpleField<Key>
}

export function SimpleToggleField<Key extends ConfigKeys>({ field }: Props<Key>) {
  const { overwrite } = field
  const configContext = useConfigs()
  const value = configContext.value[field.key]

  const checked = React.useMemo(
    () => (overwrite ? overwrite.value(value) : Boolean(value)),
    [overwrite, value],
  )

  const handleChange = React.useCallback(
    (checked: boolean) => {
      const enabled = checked
      configContext.onChange({ [field.key]: overwrite ? overwrite.onChange(enabled) : enabled })
    },
    [field.key, overwrite, configContext],
  )

  return (
    <FormControl>
      <Checkbox
        sx={{
          marginTop: '4px', // align label
        }}
        value={field.key}
        disabled={field.disabled}
        onChange={e => handleChange(e.target.checked)}
        checked={checked}
      />
      <FormControl.Label>
        {field.label}
        {(field.wikiLink || field.tooltip) && ' '}
        {field.wikiLink ? (
          <a href={field.wikiLink} title={field.tooltip} target="_blank" rel="noopener noreferrer">
            (?)
          </a>
        ) : (
          field.tooltip && (
            <span className={'help'} title={field.tooltip}>
              (?)
            </span>
          )
        )}
      </FormControl.Label>
    </FormControl>
  )
}
