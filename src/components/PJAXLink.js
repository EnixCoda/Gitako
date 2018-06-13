import React from 'react'
import DOMHelper from '../utils/DOMHelper'

export default function PJAXLink({ to, children }) {
  return React.cloneElement(children, {
    onClick: () => DOMHelper.loadWithPJAX(to),
  })
}
