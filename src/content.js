import React from 'react'
import ReactDOM from 'react-dom'

import './content.less'

import SideBar from './components/SideBar'

const SideBarElement = document.createElement('div')
document.body.appendChild(SideBarElement)
ReactDOM.render(<SideBar />, SideBarElement)
