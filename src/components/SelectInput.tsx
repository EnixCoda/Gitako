import * as React from 'react'
export function SelectInput<T>({
  value,
  onChange,
  options,
  ...selectProps
}: Override<
  React.DetailedHTMLProps<React.SelectHTMLAttributes<HTMLSelectElement>, HTMLSelectElement>,
  IO<T> & {
    options: Option<T>[]
  }
>) {
  return (
    <div className={'select-wrapper'}>
      <select
        onChange={e => {
          const key = e.target.value
          const option = options.find(option => option.key === key)
          if (option) onChange(option.value)
        }}
        value={options.find(option => option.value === value)?.key}
        {...selectProps}
      >
        {options.map(option => (
          <option key={option.key} value={option.key}>
            {option.label}
          </option>
        ))}
      </select>
      <span className={'chevron'} />
    </div>
  )
}
export type Option<T> = {
  key: string
  label: string
  value: T
}
