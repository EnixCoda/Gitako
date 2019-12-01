import { useConfigs } from 'containers/ConfigsContext'
import * as React from 'react'
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
    <label htmlFor={field.key}>
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
      &nbsp;{field.label}&nbsp;
      {field.wikiLink ? (
        <a href={field.wikiLink} target={'_blank'}>
          (?)
        </a>
      ) : (
        field.description && (
          <span className={'description'} title={field.description}>
            (?)
          </span>
        )
      )}
    </label>
  )
}
