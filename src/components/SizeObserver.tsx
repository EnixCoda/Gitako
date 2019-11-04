import * as React from 'react'
import * as features from 'utils/features'

type Size = {
  width: number
  height: number
}

type Props = {
  type?: string | React.ComponentType
  children(size: Partial<Size>): React.ReactNode
} & React.HTMLAttributes<HTMLElement>

export default function SizeObserver({ type = 'div', children, ...rest }: Props) {
  const ref = React.useRef<any>()

  const [size, setSize] = React.useState<Partial<Size>>({
    width: undefined,
    height: undefined,
  })

  React.useLayoutEffect(() => {
    if (features.resize) {
      const observer = new window.ResizeObserver(entries => {
        const entry = entries[0]
        if (!entry) return
        const rect = entry.contentRect
        safeSetSize(rect)
      })

      if (ref.current) observer.observe(ref.current)
      return () => observer.disconnect()
    } else {
      if (ref.current) {
        if ('getBoundingClientRect' in ref.current) {
          const rect = ref.current.getBoundingClientRect()
          setSize(rect)
        }
      }
    }
  }, [])

  const props: any = { ...rest, ref } // :)

  return React.createElement(type, props, children(size))

  function safeSetSize(rect: DOMRectReadOnly) {
    // requestAnimationFrame fixes "ResizeObserver loop limit exceeded" error
    requestAnimationFrame(() =>
      setSize({
        width: rect.width,
        height: rect.height,
      }),
    )
  }
}
