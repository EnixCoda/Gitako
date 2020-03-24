import { useConfigs } from 'containers/ConfigsContext'
import * as React from 'react'
import { Field } from './settings/Field'
import { SimpleField } from './SettingsBar'

type Props = {
  field: SimpleField
  onChange?(): void
}

export function SimpleToggleField({ field, onChange }: Props) {
  const { overwrite } = field
  const configContext = useConfigs()
  const value = configContext.val[field.key]
  return (
    <Field
      id={field.key}
      title={
        <>
          {field.label}{' '}
          {field.wikiLink ? (
            <a href={field.wikiLink} target={'_blank'}>
              (?)
            </a>
          ) : (
            field.description && <p className={'note'}>{field.description}</p>
          )}
        </>
      }
      className={'field-checkbox'}
      checkbox
    >
      <input
        id={field.key}
        name={field.key}
        type={'checkbox'}
        onChange={async e => {
          const enabled = e.currentTarget.checked
          configContext.set({ [field.key]: overwrite ? overwrite.onChange(enabled) : enabled })
          if (onChange) onChange()
        }}
        checked={overwrite ? overwrite.value(value) : Boolean(value)}
      />
    </Field>
  )
}
