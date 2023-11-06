import { SideBar } from 'components/SideBar'
import { ConfigsContextWrapper } from 'containers/ConfigsContext'
import { InspectorContextWrapper } from 'containers/Inspector'
import { ReloadContextWrapper } from 'containers/ReloadContext'
import * as React from 'react'
import { StyleSheetManager } from 'styled-components'
import { insertMountPoint } from 'utils/DOMHelper'
import { ErrorBoundary } from '../containers/ErrorBoundary'
import { StateBarErrorContextWrapper } from '../containers/ErrorContext'
import { OAuthWrapper } from '../containers/OAuthWrapper'
import { RepoContextWrapper } from '../containers/RepoContext'
import { StateBarStateContextWrapper } from '../containers/SideBarState'

export function Gitako() {
  const mountPoint = React.useMemo(() => insertMountPoint(), [])
  return (
    <StyleSheetManager target={mountPoint}>
      <ReloadContextWrapper>
        <ErrorBoundary>
          <ConfigsContextWrapper>
            <InspectorContextWrapper>
              <StateBarErrorContextWrapper>
                <StateBarStateContextWrapper>
                  <OAuthWrapper>
                    <RepoContextWrapper>
                      <SideBar />
                    </RepoContextWrapper>
                  </OAuthWrapper>
                </StateBarStateContextWrapper>
              </StateBarErrorContextWrapper>
            </InspectorContextWrapper>
          </ConfigsContextWrapper>
        </ErrorBoundary>
      </ReloadContextWrapper>
    </StyleSheetManager>
  )
}
