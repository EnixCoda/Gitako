import iconSrc from 'assets/icons/Gitako.png'
import { useConfigs } from 'containers/ConfigsContext'
import * as React from 'react'
import { useDebounce, useWindowSize } from 'react-use'
import { cx } from 'utils/cx'

type Props = {
  error?: string
} & Pick<React.HTMLAttributes<HTMLButtonElement>, 'onClick'>

export function ToggleShowButton({ error, onClick }: Props) {
  const ref = React.useRef<HTMLButtonElement>(null)
  const config = useConfigs()
  const [distance, setDistance] = React.useState(config.val.toggleButtonVerticalDistance)
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
    () => config.set({ toggleButtonVerticalDistance: distance }), // too slow
    100,
    [distance],
  )

  return (
    <button
      ref={ref}
      className={cx('gitako-toggle-show-button-wrapper', {
        error,
      })}
      onClick={onClick}
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
      title={'You can drag me'}
    >
      <img draggable={false} src={iconSrc} />
      {error && <span className={'error-message'}>{error}</span>}
    </button>
  )
}

function hideDragPreview(event: React.DragEvent<HTMLButtonElement>) {
  const img = new Image()
  const EMPTY_IMAGE_BASE64 =
    'data:image/gif;base64,R0lGODlhAQABAIAAAAUEBAAAACwAAAAAAQABAAACAkQBADs='
  img.src = EMPTY_IMAGE_BASE64
  event.dataTransfer.setDragImage(img, 0, 0)
}
