import * as React from 'react'
import SideBar from 'components/SideBar'
import { raiseError } from 'analytics'

export default class Gitako extends React.PureComponent {
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    raiseError(error, errorInfo)
  }

  render() {
    return <SideBar />
  }
}
