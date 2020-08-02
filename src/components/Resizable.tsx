import { HorizontalResizeHandler } from 'components/ResizeHandler'
import { useConfigs } from 'containers/ConfigsContext'
import * as React from 'react'
import { useDebounce, useWindowSize } from 'react-use'
import { cx } from 'utils/cx'
import { setResizingState } from 'utils/DOMHelper'
import * as features from 'utils/features'
import { useCSSVariable } from './useCSSVariable'

export type Size = number
type Props = {
  baseSize: Size
  className?: string
}

const MINIMAL_CONTENT_VIEWPORT_WIDTH = 100

export function Resizable({ baseSize, className, children }: React.PropsWithChildren<Props>) {
  const [size, setSize] = React.useState(baseSize)
  const configContext = useConfigs()

  React.useEffect(() => {
    setSize(baseSize)
  }, [baseSize])

  const { width } = useWindowSize()
  React.useEffect(() => {
    if (size > width - MINIMAL_CONTENT_VIEWPORT_WIDTH)
      setSize(width - MINIMAL_CONTENT_VIEWPORT_WIDTH)
  }, [width, size])

  React.useEffect(() => {
    setResizingState(true)
    const timer = setTimeout(() => setResizingState(false), 100)
    return () => clearTimeout(timer)
  }, [width, size])

  useCSSVariable('--gitako-width', `${size}px`)
  useDebounce(() => configContext.set({ sideBarWidth: size }), 100, [size])

  const onResize = React.useCallback((size: number) => {
    if (size < window.innerWidth - MINIMAL_CONTENT_VIEWPORT_WIDTH) setSize(size)
  }, [])
  return (
    <div className={cx('gitako-position-wrapper', className)}>
      <div className={'gitako-position-content'}>{children}</div>
      {features.resize && <HorizontalResizeHandler onResize={onResize} size={size} />}
    </div>
  )
}
