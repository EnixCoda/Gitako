import { AccessDeniedDescription } from 'components/AccessDeniedDescription'
import { FileExplorer } from 'components/FileExplorer'
import { MetaBar } from 'components/MetaBar'
import { Portal } from 'components/Portal'
import { SettingsBar } from 'components/settings/SettingsBar'
import { SideBarBodyWrapper } from 'components/SideBarBodyWrapper'
import { ToggleShowButton } from 'components/ToggleShowButton'
import { useConfigs } from 'containers/ConfigsContext'
import { platform } from 'platforms'
import { useGitHubAttachCopyFileButton, useGitHubAttachCopySnippetButton } from 'platforms/GitHub'
import * as React from 'react'
import { cx } from 'utils/cx'
import * as DOMHelper from 'utils/DOMHelper'
import { run } from 'utils/general'
import { useCatchNetworkError } from 'utils/hooks/useCatchNetworkError'
import { useLoadedContext } from 'utils/hooks/useLoadedContext'
import { loadWithPJAX, useOnPJAXDone, usePJAX } from 'utils/hooks/usePJAX'
import { useProgressBar } from 'utils/hooks/useProgressBar'
import { useStateIO } from 'utils/hooks/useStateIO'
import { SideBarErrorContext } from '../containers/ErrorContext'
import { RepoContext } from '../containers/RepoContext'
import { SideBarStateContext } from '../containers/SideBarState'
import { Theme } from '../containers/Theme'
import { useToggleSideBarWithKeyboard } from '../utils/hooks/useToggleSideBarWithKeyboard'
import { Icon } from './Icon'
import { IIFC } from './IIFC'
import { LoadingIndicator } from './LoadingIndicator'

export function SideBar() {
  const metaData = React.useContext(RepoContext)
  const state = useLoadedContext(SideBarStateContext).value
  const configContext = useConfigs()

  const accessToken = configContext.value.accessToken || ''
  const [baseSize] = React.useState(() => configContext.value.sideBarWidth)

  const $showSettings = useStateIO(false)
  const showSettings = $showSettings.value
  const toggleShowSettings = React.useCallback(() => $showSettings.onChange(show => !show), [])

  const $logoContainerElement = useStateIO<HTMLElement | null>(null)

  const hasMetaData = state !== 'disabled' // will be true since retrieving data, cannot use Boolean(metaData)
  React.useEffect(() => {
    if (hasMetaData) {
      DOMHelper.markGitakoReadyState(true)
      $showSettings.onChange(false)
      $logoContainerElement.onChange(DOMHelper.insertLogoMountPoint())
    } else {
      DOMHelper.markGitakoReadyState(false)
    }
  }, [hasMetaData])

  const sidebarToggleMode = configContext.value.sidebarToggleMode
  const $shouldShow = useStateIO(false)
  const shouldShow = $shouldShow.value
  React.useEffect(() => {
    DOMHelper.setBodyIndent(shouldShow && sidebarToggleMode === 'persistent')
    if (shouldShow) {
      DOMHelper.focusFileExplorer() // TODO: verify if it works
    }
  }, [shouldShow, sidebarToggleMode])

  const intelligentToggle = configContext.value.intelligentToggle

  // Save expand state on toggle if auto expand if not on
  React.useEffect(() => {
    if (intelligentToggle !== null) {
      configContext.onChange({ intelligentToggle: shouldShow })
    }
  }, [shouldShow, intelligentToggle])

  const error = useLoadedContext(SideBarErrorContext).value
  // Lock shouldShow on error
  React.useEffect(() => {
    if (error && shouldShow) {
      $shouldShow.onChange(false)
    }
  }, [error, shouldShow])

  const toggleShowSideBar = React.useCallback(() => {
    if (!error) $shouldShow.onChange(show => !show)
  }, [error])
  useToggleSideBarWithKeyboard(state, configContext, toggleShowSideBar)

  useSetShouldShowOnPJAXDone(intelligentToggle, $shouldShow.onChange)

  useGitHubAttachCopyFileButton(configContext.value.copyFileButton)
  useGitHubAttachCopySnippetButton(configContext.value.copySnippetButton)

  usePJAX()
  useProgressBar()

  // Hide sidebar when error due to auth but token is set  #128
  const hideSidebarOnInvalidToken: boolean =
    intelligentToggle === null && Boolean(state === 'error-due-to-auth' && accessToken)
  React.useEffect(() => {
    if (hideSidebarOnInvalidToken) {
      $shouldShow.onChange(false)
    }
  }, [hideSidebarOnInvalidToken])

  return (
    <Theme>
      <div className={'gitako-side-bar'}>
        <Portal into={$logoContainerElement.value}>
          {!shouldShow && <ToggleShowButton error={error} onClick={toggleShowSideBar} />}
        </Portal>
        <SideBarBodyWrapper
          className={cx(`toggle-mode-${sidebarToggleMode}`, {
            collapsed: error || !shouldShow,
          })}
          baseSize={baseSize}
        >
          <div className={'gitako-side-bar-body'}>
            <div className={'close-side-bar-button-position'}>
              <button className={'close-side-bar-button'} onClick={toggleShowSideBar}>
                <Icon className={'action-icon'} type={'x'} />
              </button>
            </div>
            <div
              className={'gitako-side-bar-content'}
              onClick={showSettings ? toggleShowSettings : undefined}
            >
              {run(() => {
                switch (state) {
                  case 'disabled':
                    return null
                  case 'getting-access-token':
                    return <LoadingIndicator text={'Getting access token...'} />
                  case 'meta-loading':
                    return <LoadingIndicator text={'Fetching repo meta...'} />
                  case 'error-due-to-auth':
                    return <AccessDeniedDescription />
                  default:
                    return metaData ? (
                      <>
                        <div className={'header'}>
                          <MetaBar metaData={metaData} />
                        </div>
                        <IIFC>
                          {() => (
                            <FileExplorer
                              metaData={metaData}
                              freeze={showSettings}
                              accessToken={accessToken}
                              loadWithPJAX={loadWithPJAX}
                              config={configContext.value}
                              catchNetworkErrors={useCatchNetworkError()}
                            />
                          )}
                        </IIFC>
                      </>
                    ) : null
                }
              })}
            </div>
            <SettingsBar toggleShowSettings={toggleShowSettings} activated={showSettings} />
          </div>
        </SideBarBodyWrapper>
      </div>
    </Theme>
  )
}

function useSetShouldShowOnPJAXDone(
  intelligentToggle: boolean | null,
  set: (value: boolean) => void,
) {
  useOnPJAXDone(
    React.useCallback(
      function updateSideBarVisibility() {
        if (intelligentToggle === null) {
          set(platform.shouldShow())
        }
      },
      [intelligentToggle],
    ),
  )
}
