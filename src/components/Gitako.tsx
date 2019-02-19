import * as React from 'react'
import SideBar from 'components/SideBar'
import { raiseError } from 'analytics'

export default class Gitako extends React.PureComponent {
  componentDidCatch(error: Error) {
    raiseError(error)
  }

  render() {
    return <SideBar />
  }
}
