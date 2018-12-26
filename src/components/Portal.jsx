import React from 'react'
import ReactDOM from 'react-dom'

class Portal extends React.PureComponent {
  render() {
    const { into, children } = this.props
    if (!(into instanceof window.Element)) return null
    return ReactDOM.createPortal(
      children,
      into,
    )
  }
}

export default Portal
