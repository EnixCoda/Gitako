import * as React from 'react'

export function useConditionalHook<T>(condition: () => boolean, hook: () => T) {
  const [use] = React.useState(condition)
  if (use) return hook()
}
