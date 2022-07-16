import { SideBar } from 'components/SideBar'
import { ConfigsContextWrapper } from 'containers/ConfigsContext'
import { ReloadContextWrapper } from 'containers/ReloadContext'
import { InspectorContextWrapper } from 'containers/StateInspector'
import * as React from 'react'
import { ErrorBoundary } from '../containers/ErrorBoundary'
import { StateBarErrorContextWrapper } from '../containers/ErrorContext'
import { OAuthWrapper } from '../containers/OAuthWrapper'
import { RepoContextWrapper } from '../containers/RepoContext'
import { StateBarStateContextWrapper } from '../containers/SideBarState'

export function Gitako() {
  return (
    <InspectorContextWrapper>
      <ReloadContextWrapper>
        <ErrorBoundary>
          <ConfigsContextWrapper>
            <StateBarStateContextWrapper>
              <StateBarErrorContextWrapper>
                <OAuthWrapper>
                  <RepoContextWrapper>
                    <SideBar />
                  </RepoContextWrapper>
                </OAuthWrapper>
              </StateBarErrorContextWrapper>
            </StateBarStateContextWrapper>
          </ConfigsContextWrapper>
        </ErrorBoundary>
      </ReloadContextWrapper>
    </InspectorContextWrapper>
  )
}
