import * as React from 'react'

type Size = {
  width: number
  height: number
}

type Props = {
  type?: string | React.ComponentType
  children(size: Partial<Size>): React.ReactNode
} & React.HTMLAttributes<HTMLElement>

export default function SizeObserver({
  type = 'div',
  children,
  ...rest
}: React.PropsWithChildren<Props>) {
  const ref = React.useRef<any>()

  const [size, setSize] = React.useState<Partial<Size>>({
    width: undefined,
    height: undefined,
  })

  React.useEffect(() => {
    const observer = new window.ResizeObserver(entries => {
      for (let entry of entries) {
        const rect = entry.contentRect
        console.log('Element:', entry.target)
        console.log(`Element size: ${rect.width}px x ${rect.height}px`)
        console.log(`Element padding: ${rect.top}px ; ${rect.left}px`)
        setSize({
          width: rect.width,
          height: rect.height,
        })
      }
    })

    if (ref.current) observer.observe(ref.current)
  }, [])

  const props: any = { ...rest, ref } // :)

  return React.createElement(type, props, children(size))
}
