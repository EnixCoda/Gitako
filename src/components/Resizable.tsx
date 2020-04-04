import { HorizontalResizeHandler } from 'components/ResizeHandler'
import { useConfigs } from 'containers/ConfigsContext'
import { platform } from 'platforms'
import * as React from 'react'
import { useWindowSize } from 'react-use'
import { cx } from 'utils/cx'
import * as features from 'utils/features'

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
    document.documentElement.style.setProperty('--gitako-width', size + 'px')
    configContext.set({ sideBarWidth: size })
  }, [size])

  platform.useResizeStylesheets(size)

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
