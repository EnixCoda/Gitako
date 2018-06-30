import React from 'react'
import SideBar from './SideBar'

import { Gitako as GitakoCore } from '../driver/core'
import connect from '../driver/connect'

@connect(GitakoCore)
export default class Gitako extends React.PureComponent {
  render() {
    return (
      <SideBar />
    )
  }
}
