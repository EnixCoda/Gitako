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

export function usePrevious<T>(newValue: T) {
  const previousRef = React.useRef(newValue)
  React.useEffect(() => {
    previousRef.current = newValue
  })
  return previousRef.current
}

export function useStates<S>(
  initialState: S | (() => S),
): { val: S; set: React.Dispatch<React.SetStateAction<S>> } {
  const [val, set] = React.useState(initialState)
  return { val, set }
}

export function useAsyncMemo<T, D extends any[] | readonly any[]>(
  factory: (dependencies: D) => T | Promise<T>,
  deps: D,
  initialValue: T,
): T {
  const firstTime = React.useRef(true)
  const state = useStates<T>(() => initialValue)
  React.useEffect(() => {
    if (firstTime.current) firstTime.current = false
    Promise.resolve(factory(deps)).then(consumed => state.set(() => consumed))
  }, deps)
  return state.val
}
