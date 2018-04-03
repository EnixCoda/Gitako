import preact from 'preact'
/** @jsx preact.h */

import './content.less'

import SideBar from './components/SideBar'

const SideBarElement = document.createElement('div')
document.body.appendChild(SideBarElement)
preact.render(<SideBar />, SideBarElement)
