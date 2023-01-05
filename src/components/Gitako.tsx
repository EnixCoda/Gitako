import { SideBar } from 'components/SideBar'
import { ConfigsContextWrapper } from 'containers/ConfigsContext'
import { ReloadContextWrapper } from 'containers/ReloadContext'
import { InspectorContextWrapper } from 'containers/StateInspector'
import * as React from 'react'
import { StyleSheetManager } from 'styled-components'
import { insertMountPoint } from 'utils/DOMHelper'
import { ErrorBoundary } from '../containers/ErrorBoundary'
import { StateBarErrorContextWrapper } from '../containers/ErrorContext'
import { OAuthWrapper } from '../containers/OAuthWrapper'
import { RepoContextWrapper } from '../containers/RepoContext'
import { StateBarStateContextWrapper } from '../containers/SideBarState'

export function Gitako() {
  return (
    <InspectorContextWrapper>
      <StyleSheetManager target={insertMountPoint()}>
        <ReloadContextWrapper>
          <ErrorBoundary>
            <ConfigsContextWrapper>
              <StateBarErrorContextWrapper>
                <StateBarStateContextWrapper>
                  <OAuthWrapper>
                    <RepoContextWrapper>
                      <SideBar />
                    </RepoContextWrapper>
                  </OAuthWrapper>
                </StateBarStateContextWrapper>
              </StateBarErrorContextWrapper>
            </ConfigsContextWrapper>
          </ErrorBoundary>
        </ReloadContextWrapper>
      </StyleSheetManager>
    </InspectorContextWrapper>
  )
}
