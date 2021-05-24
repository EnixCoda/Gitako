import iconSrc from 'assets/icons/Gitako.png'
import { useConfigs } from 'containers/ConfigsContext'
import * as React from 'react'
import { useDebounce, useWindowSize } from 'react-use'
import { cx } from 'utils/cx'
import { Icon } from './Icon'

type Props = {
  error?: string | null
  className?: React.HTMLAttributes<HTMLButtonElement>['className']
  onHover?: React.HTMLAttributes<HTMLButtonElement>['onMouseEnter']
} & Pick<React.HTMLAttributes<HTMLButtonElement>, 'onClick'>

export function ToggleShowButton({ error, className, onClick, onHover }: Props) {
  const ref = React.useRef<HTMLDivElement>(null)
  const config = useConfigs()
  const [distance, setDistance] = React.useState(config.value.toggleButtonVerticalDistance)
  const { height } = useWindowSize()
  const buttonHeight = 42
  React.useEffect(() => {
    // make sure it is inside viewport
    if (height - buttonHeight < distance) {
      setDistance(Math.max(0, height - buttonHeight))
    }
  }, [height, distance])
  React.useLayoutEffect(() => {
    if (ref.current) {
      ref.current.style.top = distance + 'px'
    }
  }, [distance])

  // updating context
  useDebounce(
    () => config.onChange({ toggleButtonVerticalDistance: distance }), // too slow
    100,
    [distance],
  )

  const toggleIconMode = config.value.toggleButtonContent
  return (
    <div ref={ref} className={cx('gitako-toggle-show-button-wrapper', className)}>
      <button
        className={cx('gitako-toggle-show-button', {
          error,
        })}
        onClick={onClick}
        onMouseEnter={onHover}
        draggable
        onDragStart={event => {
          hideDragPreview(event)
        }}
        onDrag={e => {
          if (e.clientY !== 0) {
            // It will be 0 when release pointer
            setDistance(e.clientY - buttonHeight / 2)
          }
        }}
        title={'Gitako (draggable)'}
      >
        {toggleIconMode === 'octoface' ? (
          <Icon className={'octoface-icon'} type={'octoface'} />
        ) : (
          <img className={'tentacle'} draggable={false} src={iconSrc} />
        )}
      </button>
      {error && <span className={'error-message'}>{error}</span>}
    </div>
  )
}

function hideDragPreview(event: React.DragEvent<HTMLButtonElement>) {
  const img = new Image()
  const EMPTY_IMAGE_BASE64 =
    'data:image/gif;base64,R0lGODlhAQABAIAAAAUEBAAAACwAAAAAAQABAAACAkQBADs='
  img.src = EMPTY_IMAGE_BASE64
  event.dataTransfer.setDragImage(img, 0, 0)
}
