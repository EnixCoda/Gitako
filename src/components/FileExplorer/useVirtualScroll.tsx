import * as React from 'react'
import { useCallbackRef } from './useLatestValueRef'

function memoize<Args extends AnyArray, R>(
  fn: (...args: Args) => R,
  serializeArguments: (...args: Args) => string | number,
): (...args: Args) => R {
  const memory = new Map<string | number, R>()
  return (...args) => {
    const key = serializeArguments(...args)
    let r = memory.get(key)
    if (!r) memory.set(key, (r = fn(...args)))
    return r
  }
}

export type AlignMode = 'top' | 'end' | 'lazy'

export function useVirtualScroll<E extends HTMLElement>({
  totalAmount,
  viewportHeight,
  rowHeight,
  overScan = 0,
}: {
  totalAmount: number
  overScan?: number
  viewportHeight: number
  rowHeight: number
}) {
  const totalHeight = totalAmount * rowHeight

  const ref = React.useRef<E | null>(null) // TODO: compare DOM native event listener
  const [scrollTop, setScrollTop] = React.useState(0)

  const onScroll = React.useCallback((e: React.UIEvent<E, UIEvent>) => {
    setScrollTop(e.currentTarget.scrollTop)
  }, [])

  const [startRenderIndex, endRenderIndex] = React.useMemo(() => {
    const viewportLastItemOverflow = viewportHeight % rowHeight
    const visibleRowCount = (viewportHeight - viewportLastItemOverflow) / rowHeight
    const inViewIndexFirst = (Math.min(scrollTop, totalHeight - viewportHeight) / rowHeight) >> 0
    const inViewIndexLast = inViewIndexFirst + visibleRowCount
    const renderIndexFirst = Math.max(0, inViewIndexFirst - overScan)
    const renderIndexLast = Math.min(totalAmount, inViewIndexLast + overScan)
    return [renderIndexFirst, renderIndexLast]
  }, [scrollTop, viewportHeight, overScan, rowHeight, totalAmount, totalHeight])

  const indexes = React.useMemo(() => {
    const indexes: number[] = []
    let i = startRenderIndex
    while (i < endRenderIndex) indexes.push(i++)
    return indexes
  }, [startRenderIndex, endRenderIndex])

  const mapStyles = React.useCallback(
    (row: number): React.CSSProperties => ({
      position: 'absolute',
      top: 0,
      transform: `translateY(${row * rowHeight}px)`,
      width: '100%',
      height: rowHeight,
    }),
    [rowHeight],
  )
  const memoizedStyler = React.useMemo(() => memoize(mapStyles, row => row), [mapStyles])

  const visibleRows: { row: number; style: React.CSSProperties }[] = React.useMemo(
    () =>
      indexes.map(row => ({
        row,
        style: memoizedStyler(row),
      })),
    [indexes, memoizedStyler],
  )

  const containerStyle: React.CSSProperties = React.useMemo(
    () => ({
      height: totalHeight,
      position: 'relative',
    }),
    [totalHeight],
  )

  const scrollToItem = useCallbackRef((row: number, mode: AlignMode) => {
    const getOffsetEnd = () => row * rowHeight + rowHeight - viewportHeight
    const getOffsetTop = () => row * rowHeight

    const updateScrollPosition = (scrollTop: number) => {
      setScrollTop(scrollTop)

      // Note: storing the scrollTop into a state and update DOM element scrollTop inside a layout effect would not work.
      if (ref.current) {
        ref.current.scrollTop = scrollTop
      }
    }

    switch (mode) {
      case 'top':
        return updateScrollPosition(getOffsetTop())
      case 'end':
        return updateScrollPosition(getOffsetEnd())
      case 'lazy': {
        const isAbove = row * rowHeight < scrollTop
        const isBelow = row * rowHeight + rowHeight > scrollTop + viewportHeight
        if (isBelow) {
          updateScrollPosition(getOffsetEnd())
        } else if (isAbove) {
          updateScrollPosition(getOffsetTop())
        }
      }
    }
  })

  return {
    ref,
    visibleRows,
    onScroll,
    containerStyle,
    scrollToItem,
  }
}
