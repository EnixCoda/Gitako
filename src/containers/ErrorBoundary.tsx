import { raiseError } from 'analytics'
import * as React from 'react'

export class ErrorBoundary extends React.PureComponent<React.PropsWithChildren<{}>> {
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    raiseError(error, errorInfo)
  }

  render() {
    return this.props.children
  }
}
