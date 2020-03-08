import * as React from 'react'

export function useDidUpdate(effect: React.EffectCallback, deps?: React.DependencyList) {
  const firstTime = React.useRef(true)
  React.useEffect(() => {
    if (firstTime.current) {
      firstTime.current = false
      return
    }
    return effect()
  }, deps)
}
