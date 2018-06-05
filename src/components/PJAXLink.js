import preact from 'preact'
/** @jsx preact.h */
import DOMHelper from '../utils/DOMHelper'

export default function PJAXLink({ to, children }) {
  return preact.cloneElement(children, {
    onClick: () => DOMHelper.loadWithPJAX(to),
  })
}
