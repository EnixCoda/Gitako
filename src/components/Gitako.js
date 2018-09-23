import React from 'react'
import SideBar from './SideBar'

import { Gitako as GitakoCore } from '../driver/core'
import connect from '../driver/connect'

import { raiseError } from '../analytics'

@connect(GitakoCore)
export default class Gitako extends React.PureComponent {
  componentDidMount() {
    const { init } = this.props
    init()
  }

  componentDidCatch(error) {
    raiseError(error)
  }

  render() {
    return (
      <SideBar />
    )
  }
}
