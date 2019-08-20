import * as React from 'react'
import HorizontalResizeHandler from 'components/ResizeHandler'
import cx from 'utils/cx'
import { useWindowSize, useMediaStyleSheet } from 'utils/hooks'
import { bodySpacingClassName } from 'utils/DOMHelper'
import configHelper, { configKeys } from 'utils/configHelper'
import * as features from 'utils/features'

export type Size = number
type Props = {
  baseSize: Size
  className?: string
}

const MINIMAL_CONTENT_VIEWPORT_WIDTH = 100
const GITHUB_WIDTH = 1020

export default function Resizable({
  baseSize,
  className,
  children,
}: React.PropsWithChildren<Props>) {
  const [size, setSize] = React.useState(baseSize)

  React.useEffect(() => {
    setSize(baseSize)
  }, [baseSize])

  useWindowSize(
    width => {
      if (size > width - MINIMAL_CONTENT_VIEWPORT_WIDTH)
        setSize(width - MINIMAL_CONTENT_VIEWPORT_WIDTH)
    },
    [size],
  )

  React.useEffect(() => {
    document.documentElement.style.setProperty('--gitako-width', size + 'px')
    configHelper.setOne(configKeys.sideBarWidth, size)
  }, [size])

  useMediaStyleSheet(
    `.${bodySpacingClassName} { margin-left: calc(var(--gitako-width) * 2 + 1020px - 100vw); }`,
    size => [`min-width: ${size + GITHUB_WIDTH}px`, `max-width: ${size * 2 + GITHUB_WIDTH}px`],
    size,
  )

  useMediaStyleSheet(
    `.${bodySpacingClassName} { margin-left: var(--gitako-width); }`,
    size => [`max-width: ${size + GITHUB_WIDTH}px`],
    size,
  )

  return (
    <div className={cx('gitako-position-wrapper', className)}>
      <div className={'gitako-position-content'}>{children}</div>
      {features.resize && (
        <HorizontalResizeHandler
          onResize={size => {
            if (size < window.innerWidth - MINIMAL_CONTENT_VIEWPORT_WIDTH) setSize(size)
          }}
          size={size}
        />
      )}
    </div>
  )
}
