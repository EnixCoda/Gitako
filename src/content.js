import React from 'react'
import ReactDOM from 'react-dom'

import connect from './driver/connect'
import core from './driver/core'
import SideBar from './components/SideBar'

import './content.less'

const ConnectedSideBar = connect(core)(SideBar)

const SideBarElement = document.createElement('div')
document.body.appendChild(SideBarElement)

ReactDOM.render(<ConnectedSideBar />, SideBarElement)
