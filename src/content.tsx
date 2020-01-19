import { withErrorLog } from 'analytics'
import { Gitako } from 'components/Gitako'
import { addMiddleware } from 'driver/connect'
import * as React from 'react'
import * as ReactDOM from 'react-dom'
import './content.less'

addMiddleware(withErrorLog)

function init() {
  const SideBarElement = document.createElement('div')
  document.body.appendChild(SideBarElement)
  ReactDOM.render(<Gitako />, SideBarElement)
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init)
} else {
  init()
}
