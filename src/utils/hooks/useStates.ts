import * as React from 'react'

export function useStates<S>(
  initialState: S | (() => S),
): {
  val: S
  set: React.Dispatch<React.SetStateAction<S>>
} {
  const [val, set] = React.useState(initialState)
  return { val, set }
}
