import * as React from 'react'

export function useEffectOnSerializableUpdates<T>(
  value: T,
  serialize: (value: T) => string,
  onChange: (value: T) => void,
) {
  React.useEffect(() => onChange(value), [onChange, serialize(value)])
}
