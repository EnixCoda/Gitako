import preact from 'preact'
/** @jsx preact.h */

import './content.less'

import GitakoSideBar from './components/GitakoSideBar'

const GitakoSideBarElement = document.createElement('div')
document.body.appendChild(GitakoSideBarElement)
preact.render(<GitakoSideBar />, GitakoSideBarElement)
