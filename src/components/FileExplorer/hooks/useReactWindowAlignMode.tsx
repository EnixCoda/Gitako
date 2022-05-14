import * as React from 'react'
import { Align as ReactWindowAlign } from 'react-window'
import { useStateIO } from 'utils/hooks/useStateIO'

export function useReactWindowAlignMode(searched: boolean) {
  const $scrollMode = useStateIO<ReactWindowAlign>('start')
  React.useEffect(() => {
    // Use `auto` as default mode to prevent initial misalignment
    // Switch to `smart` mode when start searching to make sure alignment is user-friendly when jump to files
    if (searched && $scrollMode.value === 'start') $scrollMode.onChange('smart')
  }, [searched, $scrollMode])
  return $scrollMode.value
}
