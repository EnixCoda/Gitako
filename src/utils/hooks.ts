import * as React from 'react'
import { createStyleSheet, setStyleSheetMedia } from './general'

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

export function useMediaStyleSheet(
  content: string,
  getMediaQuery: (width: number) => string[],
  size: number,
) {
  const style = React.useRef<HTMLStyleElement>()

  // this order may prevent first effect actually occur at first time
  React.useEffect(() => {
    setSheetMedia()
  }, [size])
  React.useEffect(() => {
    style.current = createStyleSheet(content)
    setSheetMedia()
  }, [])

  function setSheetMedia() {
    if (style.current)
      setStyleSheetMedia(
        style.current,
        getMediaQuery(size)
          .map(query => `(${query})`)
          .join(' and '),
      )
  }
}
