import * as React from 'react'
import * as features from 'utils/features'
import { Size2D } from "../../components/Size"

export function useElementSize<E extends HTMLElement>() {
  const ref = React.useRef<E | null>(null)

  const [size, setSize] = React.useState<Size2D>([0, 0])

  React.useEffect(() => {
    if (ref.current) {
      if (features.resize) {
        const observer = new window.ResizeObserver(entries => {
          const entry = entries[0]
          if (!entry) return
          const { width, height } = entry.contentRect
          setSize([width, height])
        })
        observer.observe(ref.current)
        return () => observer.disconnect()
      } else if ('getBoundingClientRect' in ref.current) {
        const { width, height } = ref.current.getBoundingClientRect()
        setSize([width, height])
      }
    }
  }, [])

  return {
    ref,
    size,
  }
}
