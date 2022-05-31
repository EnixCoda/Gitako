import { useConfigs } from 'containers/ConfigsContext'
import React from 'react'
import { Config, ConfigKeys } from 'utils/config/helper'

export type SimpleConfigField<Key extends ConfigKeys> = {
  label: string
  wikiLink?: string
  tooltip?: string
  key: Key
  disabled?: boolean
  overwrite?: {
    value: (value: Config[Key]) => Config[Key]
    onChange: (newValue: Config[Key]) => Config[Key]
  }
}

export type SimpleConfigFieldProps<Key extends ConfigKeys> = {
  field: SimpleConfigField<Key>
}

export function useSimpleConfigFieldIO<Key extends ConfigKeys>(
  field: SimpleConfigField<Key>,
): IO<Config[Key]> {
  const { overwrite } = field
  const configContext = useConfigs()
  const value = configContext.value[field.key]

  return {
    value: React.useMemo(() => (overwrite ? overwrite.value(value) : value), [overwrite, value]),
    onChange: React.useCallback(
      (newValue: Config[Key]) => {
        configContext.onChange({ [field.key]: overwrite ? overwrite.onChange(newValue) : newValue })
      },
      [field.key, overwrite, configContext],
    ),
  }
}
