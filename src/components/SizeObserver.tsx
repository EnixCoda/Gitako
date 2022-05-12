import * as React from 'react'
import * as features from 'utils/features'

type Size = {
  width: number
  height: number
}

type Props = Override<
  React.HTMLAttributes<HTMLElement>,
  {
    type?: string | React.ComponentType
    children(size: Partial<Size>): React.ReactNode
  }
>

export function SizeObserver({ type = 'div', children, ...rest }: Props) {
  const ref = React.useRef<any>()

  const [size, setSize] = React.useState<Partial<Size>>({
    width: undefined,
    height: undefined,
  })

  React.useEffect(() => {
    if (ref.current) {
      if (features.resize) {
        const observer = new window.ResizeObserver(entries => {
          const entry = entries[0]
          if (!entry) return
          const rect = entry.contentRect
          setSize(rect)
        })
        observer.observe(ref.current)
        return () => observer.disconnect()
      } else {
        if ('getBoundingClientRect' in ref.current) {
          const rect = ref.current.getBoundingClientRect()
          setSize(rect)
        }
      }
    }
  }, [])

  const props: any = { ...rest, ref } // :)

  return React.createElement(type, props, children(size))
}
