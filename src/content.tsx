import { withErrorLog } from 'analytics'
import { Gitako } from 'components/Gitako'
import { addMiddleware } from 'driver/connect'
import * as React from 'react'
import * as ReactDOM from 'react-dom'
import './content.scss'

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

// injects a copy of stylesheets so that other extensions(e.g. dark reader) could read
function injectStyles(url: string) {
  var linkElement = document.createElement('link')
  linkElement.rel = 'stylesheet'
  linkElement.setAttribute('href', url)
  document.head.appendChild(linkElement)
}

injectStyles(browser.extension.getURL('content.css'))
