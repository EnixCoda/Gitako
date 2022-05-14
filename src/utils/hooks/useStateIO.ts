import * as React from 'react'

export function useStateIO<S>(initialState: S | (() => S)): {
  value: S
  onChange: React.Dispatch<React.SetStateAction<S>>
} {
  const [value, onChange] = React.useState(initialState)
  return React.useMemo(() => ({ value, onChange }), [value])
}
