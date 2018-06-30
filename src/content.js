import React from 'react'
import ReactDOM from 'react-dom'

import Gitako from './components/Gitako'

import './content.less'

const SideBarElement = document.createElement('div')
document.body.appendChild(SideBarElement)

ReactDOM.render(<Gitako />, SideBarElement)
