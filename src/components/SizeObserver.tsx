import * as React from 'react'
import * as features from 'utils/features'

type Size = {
  width: number
  height: number
}

type Props<R extends Element> = {
  children(size: Partial<Size>, ref: React.MutableRefObject<R | null>): React.ReactNode
}

export function SizeObserver<R extends Element>({ children }: Props<R>) {
  const ref = React.useRef<R | null>(null)

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

  return <>{children(size, ref)}</>
}
