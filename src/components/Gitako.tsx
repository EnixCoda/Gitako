import { SideBar } from 'components/SideBar'
import { ConfigsContext, ConfigsContextWrapper } from 'containers/ConfigsContext'
import * as React from 'react'
import { ErrorBoundary } from './ErrorBoundary'

export function Gitako() {
  return (
    <ErrorBoundary>
      <ConfigsContextWrapper>
        <ConfigsContext.Consumer>
          {configContext => configContext && <SideBar configContext={configContext} />}
        </ConfigsContext.Consumer>
      </ConfigsContextWrapper>
    </ErrorBoundary>
  )
}
