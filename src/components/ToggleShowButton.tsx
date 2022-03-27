import iconURL from 'assets/icons/Gitako.png'
import { useConfigs } from 'containers/ConfigsContext'
import * as React from 'react'
import { useDebounce, useWindowSize } from 'react-use'
import { cx } from 'utils/cx'
import { useResizeHandler } from 'utils/hooks/useResizeHandler'
import { Icon } from './Icon'

type Props = {
  error?: string | null
  className?: React.HTMLAttributes<HTMLButtonElement>['className']
  onHover?: React.HTMLAttributes<HTMLButtonElement>['onMouseEnter']
  onClick?: (e: PointerEvent) => void
}

const buttonHeight = 42

function getSafeDistance(y: number, height: number) {
  return Math.max(0, Math.min(y, height - buttonHeight))
}

export function ToggleShowButton({ error, className, onClick, onHover }: Props) {
  const ref = React.useRef<HTMLDivElement>(null)
  const config = useConfigs()
  const [distance, setDistance] = React.useState(config.value.toggleButtonVerticalDistance)
  const { height } = useWindowSize()
  React.useEffect(() => {
    // make sure it is inside viewport
    const safeDistance = getSafeDistance(distance, height)
    if (safeDistance !== distance) setDistance(safeDistance)
  }, [height, distance])

  // updating context
  useDebounce(
    () => config.onChange({ toggleButtonVerticalDistance: distance }), // too slow
    100,
    [distance],
  )

  // reposition on window height change, but ignores distance change
  React.useEffect(() => {
    if (ref.current) {
      ref.current.style.top = distance + 'px'
    }
  }, [height])

  // And this repositions on drag
  const { onPointerDown } = useResizeHandler(
    [distance, distance],
    ([, y]) => {
      const distance = getSafeDistance(y, height)
      setDistance(distance)
      if (ref.current) {
        ref.current.style.top = distance + 'px'
      }
    },
    { onClick },
  )

  return (
    <div ref={ref} className={cx('gitako-toggle-show-button-wrapper', className)}>
      <button
        className={cx('gitako-toggle-show-button', {
          error,
        })}
        onPointerEnter={onHover}
        onPointerDown={onPointerDown}
        title={'Gitako (draggable)'}
      >
        {config.value.toggleButtonContent === 'octoface' ? (
          <Icon className={'octoface-icon'} type={'octoface'} />
        ) : (
          <img className={'tentacle'} draggable={false} src={iconURL} />
        )}
      </button>
      {error && <span className={'error-message'}>{error}</span>}
    </div>
  )
}
