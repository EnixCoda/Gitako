import * as React from 'react'

// for selects
export type Option<V> = {
  key: string
  value: V
  label: string
}

type Props<V> = {
  id?: string
  options: Option<V>[]
} & IO<V>

export function Select<V extends string>({ id, value, onChange, options }: Props<V>) {
  return (
    <select
      id={id}
      onChange={e => {
        const key = e.target.value
        const option = options.find(option => option.key === key)
        if (!option)
          throw new Error(`Option not found in ${JSON.stringify(options.map(({ key }) => key))}`)
        onChange(option.value)
      }}
      value={value}
    >
      {options.map(option => (
        <option key={option.key} value={option.key}>
          {option.label}
        </option>
      ))}
    </select>
  )
}
