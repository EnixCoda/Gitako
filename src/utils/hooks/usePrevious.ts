import * as React from 'react'

export function usePrevious<T>(newValue: T) {
  const previousRef = React.useRef(newValue)
  React.useEffect(() => {
    previousRef.current = newValue
  })
  return previousRef.current
}
