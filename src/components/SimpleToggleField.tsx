import { useConfigs } from 'containers/ConfigsContext'
import * as React from 'react'
import { Config } from 'utils/config/helper'
import { Field } from './settings/Field'

export type SimpleField<Key extends keyof Config> = {
  key: Key
  label: string
  wikiLink?: string
  tooltip?: string
  description?: string
  disabled?: boolean
  overwrite?: {
    value: (value: Config[Key]) => boolean
    onChange: (checked: boolean) => Config[Key]
  }
}

type Props<Key extends keyof Config> = {
  field: SimpleField<Key>

  onChange?(): void
}

export function SimpleToggleField<Key extends keyof Config>({ field, onChange }: Props<Key>) {
  const { overwrite } = field
  const configContext = useConfigs()
  const value = configContext.value[field.key]
  return (
    <Field
      id={field.key}
      title={
        <>
          {field.label}{' '}
          {field.wikiLink ? (
            <a
              href={field.wikiLink}
              title={field.tooltip}
              target="_blank"
              rel="noopener noreferrer"
            >
              (?)
            </a>
          ) : field.description ? (
            <p className={'note'} title={field.tooltip}>
              {field.description}
            </p>
          ) : (
            field.tooltip && (
              <span className={'help'} title={field.tooltip}>
                (?)
              </span>
            )
          )}
        </>
      }
      className={'field-checkbox'}
      checkbox
    >
      <input
        id={field.key}
        name={field.key}
        disabled={field.disabled}
        type={'checkbox'}
        onChange={async e => {
          const enabled = e.currentTarget.checked
          configContext.onChange({ [field.key]: overwrite ? overwrite.onChange(enabled) : enabled })
          if (onChange) onChange()
        }}
        checked={overwrite ? overwrite.value(value) : Boolean(value)}
      />
    </Field>
  )
}
