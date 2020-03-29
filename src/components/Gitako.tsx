import { SideBar } from 'components/SideBar'
import { ConfigsContext, ConfigsContextWrapper } from 'containers/ConfigsContext'
import { PlatformContextWrapper } from 'containers/PlatformContext'
import * as React from 'react'
import { ErrorBoundary } from './ErrorBoundary'

export function Gitako() {
  return (
    <ErrorBoundary>
      <PlatformContextWrapper>
        <ConfigsContextWrapper>
          <ConfigsContext.Consumer>
            {configContext => configContext && <SideBar configContext={configContext} />}
          </ConfigsContext.Consumer>
        </ConfigsContextWrapper>
      </PlatformContextWrapper>
    </ErrorBoundary>
  )
}
