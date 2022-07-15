import { useConfigs } from 'containers/ConfigsContext'
import * as React from 'react'
import { useDebounce, useWindowSize } from 'react-use'
import { getDefaultConfigs } from 'utils/config/helper'
import * as DOMHelper from 'utils/DOMHelper'
import { useOnPJAXDone } from 'utils/hooks/usePJAX'
import { ResizeHandler } from './ResizeHandler'
import { Size, Size2D } from './Size'

const MINIMAL_CONTENT_VIEWPORT_WIDTH = 100
const MINIMAL_WIDTH = 240

function getSafeWidth(width: Size, windowWidth: number) {
  if (width > windowWidth - MINIMAL_CONTENT_VIEWPORT_WIDTH)
    return windowWidth - MINIMAL_CONTENT_VIEWPORT_WIDTH
  if (width < MINIMAL_WIDTH) return MINIMAL_WIDTH
  return width
}

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

  // Keep variable when directing from PR to repo home via meta bar
  useOnPJAXDone(React.useCallback(() => DOMHelper.setGitakoWidthCSSVariable(width), [width]))

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
