import { ResizeHandler } from 'components/ResizeHandler'
import { useConfigs } from 'containers/ConfigsContext'
import * as React from 'react'
import { useDebounce, useWindowSize } from 'react-use'
import { getDefaultConfigs } from 'utils/config/helper'
import { cx } from 'utils/cx'
import * as DOMHelper from 'utils/DOMHelper'
import { setCSSVariable } from 'utils/DOMHelper'
import * as features from 'utils/features'
import { detectBrowser } from 'utils/general'
import { useOnPJAXDone } from 'utils/hooks/usePJAX'
import { ResizeState } from 'utils/hooks/useResizeHandler'
import { useConditionalHook } from '../utils/hooks/useConditionalHook'

type Size = number
export type Size2D = [Size, Size]
type Props = {
  className?: string
  onLeave?: React.HTMLAttributes<HTMLElement>['onMouseLeave']
}

const MINIMAL_CONTENT_VIEWPORT_WIDTH = 100
const MINIMAL_WIDTH = 240

function getSafeSize(size: number, width: number) {
  if (size > width - MINIMAL_CONTENT_VIEWPORT_WIDTH) return width - MINIMAL_CONTENT_VIEWPORT_WIDTH
  if (size < MINIMAL_WIDTH) return MINIMAL_WIDTH
  return size
}

const sizeVariableMountPoint = DOMHelper.gitakoDescriptionTarget

export function SideBarBodyWrapper({
  className,
  children,
  onLeave,
}: React.PropsWithChildren<Props>) {
  const configContext = useConfigs()
  const { sideBarWidth: baseSize } = configContext.value
  const [size, setSize] = React.useState(baseSize)

  // TODO: fix sidebar flash on first load

  // TODO: verify if it is required
  // React.useEffect(() => {
  //   setSize(baseSize)
  // }, [baseSize])

  const heightForSafari = useConditionalHook(
    () => detectBrowser() === 'Safari',
    () => useWindowSize().height, // eslint-disable-line react-hooks/rules-of-hooks
  )

  const { width } = useWindowSize()
  React.useEffect(() => {
    const safeSize = getSafeSize(size, width)
    if (safeSize !== size) setSize(safeSize)
  }, [width, size])
  useDebounce(() => configContext.onChange({ sideBarWidth: size }), 100, [size])

  const applySizeToCSSVariables = React.useCallback((size: number) => {
    setCSSVariable('--gitako-width', `${size}px`, sizeVariableMountPoint)
  }, [])

  // Update size using useEffect would cause delay
  const onResize = React.useMemo(() => {
    let sizeToApply: number
    let applied = true
    return ([size]: number[]) => {
      // do NOT merge this with the above similar effect, side bar will jump otherwise
      sizeToApply = getSafeSize(size, width)
      setSize(sizeToApply)

      if (applied) {
        applied = false
        requestAnimationFrame(() => {
          applied = true
          applySizeToCSSVariables(sizeToApply)
        })
      }
    }
  }, [width, applySizeToCSSVariables])

  const applyLatestSizeToCSSVariables = React.useCallback(
    () => applySizeToCSSVariables(size),
    [applySizeToCSSVariables, size],
  )
  React.useLayoutEffect(applyLatestSizeToCSSVariables, [applyLatestSizeToCSSVariables])
  useOnPJAXDone(applyLatestSizeToCSSVariables)

  const blockLeaveRef = React.useRef(false)
  const onMouseLeave = React.useCallback(
    <E extends HTMLElement>(e: React.MouseEvent<E>) => {
      if (blockLeaveRef.current) return
      onLeave?.(e)
    },
    [onLeave],
  )
  const onResizeStateChange = React.useCallback((state: ResizeState) => {
    blockLeaveRef.current = state === 'resizing'
  }, [])

  const dummySize: [number, number] = React.useMemo(() => [size, size], [size])

  const defaultSideBarWidth = React.useMemo(() => getDefaultConfigs().sideBarWidth, [])

  return (
    <div
      className={cx('gitako-side-bar-body-wrapper', className)}
      style={{ height: heightForSafari }}
      onMouseLeave={onMouseLeave}
    >
      {children}
      {features.resize && (
        <ResizeHandler
          onResize={onResize}
          onResetSize={() => {
            setSize(defaultSideBarWidth)
            applySizeToCSSVariables(defaultSideBarWidth)
          }}
          onResizeStateChange={onResizeStateChange}
          size={dummySize}
        />
      )}
    </div>
  )
}
