import React from 'react'
import ReactDOM from 'react-dom'

import SideBar from './components/SideBar'

import './content.less'

const SideBarElement = document.createElement('div')
document.body.appendChild(SideBarElement)

ReactDOM.render(<SideBar />, SideBarElement)
