import * as React from 'react'
import { ConfigKeys } from 'utils/config/helper'
import { SimpleConfigFieldProps, useSimpleConfigFieldIO } from '.'
import { Checkbox } from '../../Inputs/Checkbox'
import { FieldLabel } from './FieldLabel'

export function SimpleConfigFieldCheckbox<Key extends ConfigKeys>({
  field,
}: SimpleConfigFieldProps<Key>) {
  const { value, onChange } = useSimpleConfigFieldIO(field) as IO<boolean>

  return (
    <Checkbox
      label={<FieldLabel {...field} />}
      disabled={field.disabled}
      value={value}
      onChange={onChange}
    />
  )
}
