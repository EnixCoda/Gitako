import { ResizeHandler } from 'components/ResizeHandler'
import { useConfigs } from 'containers/ConfigsContext'
import * as React from 'react'
import { useDebounce, useWindowSize } from 'react-use'
import { getDefaultConfigs } from 'utils/config/helper'
import { cx } from 'utils/cx'
import { setCSSVariable } from 'utils/DOMHelper'
import * as features from 'utils/features'
import { detectBrowser } from 'utils/general'
import { useOnPJAXDone } from 'utils/hooks/usePJAX'
import { ResizeState } from 'utils/hooks/useResizeHandler'
import { useConditionalHook } from '../utils/hooks/useConditionalHook'

type Size = number
export type Size2D = [Size, Size]
type Props = {
  baseSize: Size
  className?: string
  onLeave?: React.HTMLAttributes<HTMLElement>['onMouseLeave']
  sizeVariableMountPoint?: HTMLElement
}

const MINIMAL_CONTENT_VIEWPORT_WIDTH = 100
const MINIMAL_WIDTH = 240

function getSafeSize(size: number, width: number) {
  if (size > width - MINIMAL_CONTENT_VIEWPORT_WIDTH) return width - MINIMAL_CONTENT_VIEWPORT_WIDTH
  if (size < MINIMAL_WIDTH) return MINIMAL_WIDTH
  return size
}

export function SideBarBodyWrapper({
  baseSize,
  className,
  children,
  onLeave,
  sizeVariableMountPoint,
}: React.PropsWithChildren<Props>) {
  const [size, setSize] = React.useState(baseSize)
  const configContext = useConfigs()
  const blockLeaveRef = React.useRef(false)

  const heightForSafari = useConditionalHook(
    () => detectBrowser() === 'Safari',
    () => useWindowSize().height, // eslint-disable-line react-hooks/rules-of-hooks
  )

  React.useEffect(() => {
    setSize(baseSize)
  }, [baseSize])

  const { width } = useWindowSize()
  React.useEffect(() => {
    const safeSize = getSafeSize(size, width)
    if (safeSize !== size) setSize(safeSize)
  }, [width, size])
  useDebounce(() => configContext.onChange({ sideBarWidth: size }), 100, [size])

  const applySizeToCSSVariables = React.useCallback(function apply(
    sizeVariableMountPoint: HTMLElement | undefined,
    size: number,
  ) {
    if (sizeVariableMountPoint)
      setCSSVariable(
        '--gitako-width',
        sizeVariableMountPoint ? `${size}px` : undefined,
        sizeVariableMountPoint,
      )
  },
  [])

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
          applySizeToCSSVariables(sizeVariableMountPoint, sizeToApply)
        })
      }
    }
  }, [width, sizeVariableMountPoint, applySizeToCSSVariables])

  const applyLatestSizeToCSSVariables = React.useCallback(
    () => applySizeToCSSVariables(sizeVariableMountPoint, size),
    [sizeVariableMountPoint, size],
  )
  React.useEffect(() => {
    applyLatestSizeToCSSVariables()
  }, [applyLatestSizeToCSSVariables])

  useOnPJAXDone(applyLatestSizeToCSSVariables)

  const onMouseLeave = React.useCallback(
    <E extends HTMLElement>(e: React.MouseEvent<E>) => {
      if (blockLeaveRef.current) return
      onLeave?.(e)
    },
    [onLeave],
  )

  const dummySize: [number, number] = React.useMemo(() => [size, size], [size])
  const onResizeStateChange = React.useCallback((state: ResizeState) => {
    blockLeaveRef.current = state === 'resizing'
  }, [])

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
            applySizeToCSSVariables(sizeVariableMountPoint, defaultSideBarWidth)
          }}
          onResizeStateChange={onResizeStateChange}
          size={dummySize}
        />
      )}
    </div>
  )
}
