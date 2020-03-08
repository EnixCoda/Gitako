import * as React from 'react'

export function useWindowSize(
  callback: (width: number) => void,
  deps?: ReadonlyArray<any> | undefined,
) {
  React.useEffect(() => {
    const resizeListener: (this: Window, ev: UIEvent) => void = () => callback(window.innerWidth)
    window.addEventListener('resize', resizeListener)
    return () => window.removeEventListener('resize', resizeListener)
  }, deps)
}
