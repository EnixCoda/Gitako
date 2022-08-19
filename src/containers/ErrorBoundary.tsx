import { raiseError } from 'analytics'
import { PropsWithChildren } from 'common'
import * as React from 'react'

export class ErrorBoundary extends React.PureComponent<PropsWithChildren> {
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    raiseError(error, errorInfo)
  }

  render() {
    return this.props.children
  }
}
