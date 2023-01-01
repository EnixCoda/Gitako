import { useConfigs } from 'containers/ConfigsContext'
import * as React from 'react'
import { useDebounce, useLatest, useWindowSize } from 'react-use'
import { getDefaultConfigs } from 'utils/config/helper'
import * as DOMHelper from 'utils/DOMHelper'
import { useAfterRedirect } from 'utils/hooks/useFastRedirect'
import { getSafeWidth } from '../utils/getSafeWidth'
import { ResizeHandler } from './ResizeHandler'
import { Size, Size2D } from './Size'

function useSidebarWidth() {
  const configContext = useConfigs()

  // size data flow:
  //    windowSize.width => width
  //                        width => config.sideBarWidth
  //                        width => --gitako-width       // layout effect
  //        resize event => width
  //        resize event =>          --gitako-width       // rAF
  const [width, setWidth] = React.useState(configContext.value.sideBarWidth)
  const { width: windowWidth } = useWindowSize()
  React.useEffect(() => {
    const safeSize = getSafeWidth(width, windowWidth)
    if (safeSize !== width) setWidth(safeSize)
  }, [windowWidth, width])
  useDebounce(() => configContext.onChange({ sideBarWidth: width }), 100, [width])

  React.useLayoutEffect(() => DOMHelper.setGitakoWidthCSSVariable(width), [width])

  const widthRef = useLatest(width)
  React.useEffect(() => {
    const detach = DOMHelper.attachStickyGitakoWidthCSSVariable(() => widthRef.current)
    return () => detach()
  }, [widthRef])

  // Keep variable when directing from PR to repo home via meta bar
  useAfterRedirect(React.useCallback(() => DOMHelper.setGitakoWidthCSSVariable(width), [width]))

  return [width, setWidth] as const
}

export function SideBarResizeHandler({
  onResizeStateChange,
}: Pick<React.ComponentProps<typeof ResizeHandler>, 'onResizeStateChange'>) {
  const [width, setWidth] = useSidebarWidth()
  const { width: windowWidth } = useWindowSize()
  const onResize = React.useMemo(() => {
    let widthToApply: Size
    let pending = false
    return ([width]: Size2D) => {
      // do NOT merge this with the above similar effect
      widthToApply = width

      if (!pending) {
        pending = true
        // Update size using useEffect would cause delay
        requestAnimationFrame(() => {
          pending = false
          widthToApply = getSafeWidth(widthToApply, windowWidth)
          DOMHelper.setGitakoWidthCSSVariable(widthToApply)
          setWidth(widthToApply)
        })
      }
    }
  }, [windowWidth, setWidth])

  const onResetSize = React.useCallback(
    () => setWidth(getDefaultConfigs().sideBarWidth),
    [setWidth],
  )

  const dummySize: Size2D = React.useMemo(() => [width, 0], [width])

  return (
    <ResizeHandler
      onResize={onResize}
      onResetSize={onResetSize}
      onResizeStateChange={onResizeStateChange}
      size={dummySize}
    />
  )
}
