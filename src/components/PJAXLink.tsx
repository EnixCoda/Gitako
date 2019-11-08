import * as React from 'react'
import * as DOMHelper from 'utils/DOMHelper'

type Props<P> = {
  to: string
  children: React.ReactElement<P>
}

export default function PJAXLink<P>({ to, children }: Props<P>) {
  return React.cloneElement(children, {
    ...children.props,
    onClick: () => DOMHelper.loadWithPJAX(to),
  })
}
