import { SideBar } from 'components/SideBar'
import { ConfigsContextWrapper } from 'containers/ConfigsContext'
import * as React from 'react'
import { ErrorBoundary } from './ErrorBoundary'
import { StateBarErrorContextWrapper } from './ErrorContext'
import { OAuthWrapper } from './OAuthWrapper'
import { RepoContextWrapper } from './RepoContext'
import { StateBarStateContextWrapper } from './SideBarState'

export function Gitako() {
  return (
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
  )
}
