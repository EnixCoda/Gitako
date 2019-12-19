import * as React from 'react'
import * as ReactDOM from 'react-dom'

type Props = {
  into: Element | null
}

export function Portal(props: React.PropsWithChildren<Props>) {
  const { into, children } = props
  if (!(into instanceof Element)) return null
  return ReactDOM.createPortal(children, into)
}
