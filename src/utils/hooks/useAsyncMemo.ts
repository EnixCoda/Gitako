import * as React from 'react'
import { useStateIO } from './useStateIO'

export function useAsyncMemo<T, D extends any[] | readonly any[]>(
  factory: (dependencies: D) => T | Promise<T>,
  deps: D,
  initialValue: T,
): T {
  const firstTime = React.useRef(true)
  const state = useStateIO<T>(() => initialValue)
  React.useEffect(() => {
    if (firstTime.current) firstTime.current = false
    Promise.resolve(factory(deps)).then(consumed => state.onChange(() => consumed))
  }, deps)
  return state.value
}
