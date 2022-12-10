import { SelectInput, SelectInputProps } from 'components/Inputs/SelectInput'
import * as React from 'react'
import { Config, ConfigKeys } from 'utils/config/helper'
import { SimpleConfigFieldProps, useSimpleConfigFieldIO } from '.'
import { FieldLabel } from './FieldLabel'

export function SimpleConfigFieldSelect<Key extends ConfigKeys>({
  field,
  options,
}: SimpleConfigFieldProps<Key> & {
  options: SelectInputProps<Config[Key]>['options']
}) {
  const { value, onChange } = useSimpleConfigFieldIO(field)

  return (
    <SelectInput
      label={<FieldLabel {...field} />}
      disabled={field.disabled}
      value={value}
      onChange={onChange}
      options={options}
    />
  )
}
