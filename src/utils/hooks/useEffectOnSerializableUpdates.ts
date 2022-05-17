import * as React from 'react'

export function useEffectOnSerializableUpdates<T>(
  value: T,
  serialize: (value: T) => string,
  onChange: (value: T) => void,
) {
  const serialized = React.useMemo(() => serialize(value), [value, serialize])
  React.useEffect(() => onChange(value), [onChange, serialized]) // eslint-disable-line react-hooks/exhaustive-deps
}
