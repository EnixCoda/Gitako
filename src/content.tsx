import { withErrorLog } from 'analytics'
import { Gitako } from 'components/Gitako'
import { addMiddleware } from 'driver/connect'
import { platform } from 'platforms'
import * as React from 'react'
import * as ReactDOM from 'react-dom'
import './content.scss'

if (platform.resolvePartialMetaData()) {
  addMiddleware(withErrorLog)

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init)
  } else {
    init()
  }
}

async function init() {
  await injectStyles(browser.runtime.getURL('content.css'))
  const SideBarElement = document.createElement('div')
  document.body.appendChild(SideBarElement)
  ReactDOM.render(<Gitako />, SideBarElement)
}

// injects a copy of stylesheets so that other extensions(e.g. dark reader) could read
// resolves when style is loaded to prevent render without proper styles
async function injectStyles(url: string) {
  return new Promise<void>(resolve => {
    const linkElement = document.createElement('link')
    linkElement.setAttribute('rel', 'stylesheet')
    linkElement.setAttribute('href', url)
    linkElement.onload = () => resolve()
    document.head.appendChild(linkElement)
  })
}
