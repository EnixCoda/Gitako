import { IIFC } from 'components/IIFC'
import { SideBar } from 'components/SideBar'
import { ConfigsContextWrapper, useConfigs } from 'containers/ConfigsContext'
import * as React from 'react'
import { useLoadedContext } from 'utils/hooks/useLoadedContext'
import { ErrorBoundary } from './ErrorBoundary'
import { StateBarErrorContextWrapper } from './ErrorContext'
import { RepoContext, RepoContextWrapper } from './RepoContext'
import { SideBarStateContext, StateBarStateContextWrapper } from './SideBarState'

export function Gitako() {
  return (
    <ErrorBoundary>
      <ConfigsContextWrapper>
        <StateBarStateContextWrapper>
          <StateBarErrorContextWrapper>
            <RepoContextWrapper>
              <IIFC>
                {() => (
                  <SideBar
                    configContext={useConfigs()}
                    stateContext={useLoadedContext(SideBarStateContext)}
                    metaData={React.useContext(RepoContext)}
                  />
                )}
              </IIFC>
            </RepoContextWrapper>
          </StateBarErrorContextWrapper>
        </StateBarStateContextWrapper>
      </ConfigsContextWrapper>
    </ErrorBoundary>
  )
}
