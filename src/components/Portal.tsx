import * as React from 'react'
import * as ReactDOM from 'react-dom'

type Props = {
  into: HTMLElement
}

class Portal extends React.PureComponent<Props> {
  render() {
    const { into, children } = this.props
    if (!(into instanceof Element)) return null
    return ReactDOM.createPortal(children, into)
  }
}

export default Portal
