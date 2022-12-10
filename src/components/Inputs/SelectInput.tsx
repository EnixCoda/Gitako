import { FormControl, Select, SelectProps } from '@primer/react'
import * as React from 'react'

export type Option<T> = {
  key: string
  label: string
  value: T
}

export type SelectInputProps<T> = Override<
  SelectProps,
  IO<T> & {
    label: React.ReactNode
    options: Option<T>[]
  }
>

export function SelectInput<T>({
  value,
  onChange,
  label,
  options,
  ...selectProps
}: SelectInputProps<T>) {
  return (
    <FormControl
      sx={{
        ':focus-within': {
          '> span': {
            // original boxShadow does not look right
            borderWidth: '2px',
            boxShadow: 'none',
            '> select': {
              paddingLeft: '11px',
              paddingRight: '11px',
            },
          },
        },
        mb: 1,
      }}
      disabled={selectProps.disabled}
    >
      <FormControl.Label>{label}</FormControl.Label>
      <Select
        block
        onChange={e => {
          const key = e.target.value
          const option = options.find(option => option.key === key)
          if (option) onChange(option.value)
        }}
        value={options.find(option => option.value === value)?.key}
        {...selectProps}
      >
        {options.map(option => (
          <Select.Option key={option.key} value={option.key}>
            {option.label}
          </Select.Option>
        ))}
      </Select>
    </FormControl>
  )
}
