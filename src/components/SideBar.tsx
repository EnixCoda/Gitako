import { AccessDeniedDescription } from 'components/AccessDeniedDescription'
import { FileExplorer } from 'components/FileExplorer'
import { MetaBar } from 'components/MetaBar'
import { Portal } from 'components/Portal'
import { Resizable } from 'components/Resizable'
import { SettingsBar } from 'components/settings/SettingsBar'
import { ToggleShowButton } from 'components/ToggleShowButton'
import { ConfigsContextShape, useConfigs } from 'containers/ConfigsContext'
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
import * as keyHelper from 'utils/keyHelper'
import { SideBarErrorContext } from './ErrorContext'
import { Icon } from './Icon'
import { IIFC } from './IIFC'
import { LoadingIndicator } from './LoadingIndicator'
import { SideBarState, SideBarStateContext, SideBarStateContextShape } from './SideBarState'
import { Theme } from './Theme'

export function SideBar(props: {
  metaData: MetaData | null
  configContext: ConfigsContextShape
  stateContext: SideBarStateContextShape
}) {
  const { metaData } = props

  const state = useLoadedContext(SideBarStateContext).value
  const configContext = useConfigs()

  const accessToken = configContext.value.accessToken || ''
  const [baseSize] = React.useState(() => configContext.value.sideBarWidth)

  const $showSettings = useStateIO(false)
  const showSettings = $showSettings.value
  const toggleShowSettings = React.useCallback(function toggleShowSettings() {
    $showSettings.onChange(show => !show)
  }, [])

  const $logoContainerElement = useStateIO<HTMLElement | null>(null)

  const hasMetaData = state !== 'disabled'
  React.useEffect(() => {
    if (hasMetaData) {
      DOMHelper.markGitakoReadyState(true)
      $showSettings.onChange(false)
      $logoContainerElement.onChange(DOMHelper.insertLogoMountPoint())
    } else {
      DOMHelper.markGitakoReadyState(false)
    }
  }, [hasMetaData])

  const $shouldShow = useStateIO(false)
  const shouldShow = $shouldShow.value
  React.useEffect(() => {
    DOMHelper.setBodyIndent(shouldShow)
  }, [shouldShow])

  React.useEffect(() => {
    if (shouldShow) {
      DOMHelper.focusFileExplorer() // TODO: verify if it works
    }
  }, [shouldShow])
  const toggleShowSideBar = React.useCallback(() => {
    $shouldShow.onChange(shouldShow => {
      const {
        value: { intelligentToggle },
      } = configContext
      if (intelligentToggle !== null) {
        configContext.onChange({ intelligentToggle: !shouldShow })
      }

      return !shouldShow
    })
  }, [])
  useToggleSideBarWithKeyboard(state, configContext, toggleShowSideBar)

  const intelligentToggle = configContext.value.intelligentToggle
  // Hide sidebar when error due to auth but token is set  #128
  const hideSidebarOnInvalidToken: boolean =
    intelligentToggle === null && Boolean(state === 'error-due-to-auth' && accessToken)
  React.useEffect(() => {
    if (hideSidebarOnInvalidToken) {
      $shouldShow.onChange(false)
    } else {
      const shouldShow = intelligentToggle === null ? platform.shouldShow() : intelligentToggle
      $shouldShow.onChange(shouldShow)
    }
  }, [intelligentToggle, hideSidebarOnInvalidToken, metaData])

  const error = useLoadedContext(SideBarErrorContext).value
  React.useEffect(() => {
    if (error) {
      $shouldShow.onChange(false)
    }
  }, [error])

  const updateSideBarVisibility = React.useCallback(
    function updateSideBarVisibility() {
      if (hideSidebarOnInvalidToken) {
        $shouldShow.onChange(false)
      } else if (intelligentToggle === null) {
        $shouldShow.onChange(platform.shouldShow())
      }
    },
    [metaData?.branchName, intelligentToggle, hideSidebarOnInvalidToken],
  )
  useOnPJAXDone(updateSideBarVisibility)

  useGitHubAttachCopyFileButton(configContext.value.copyFileButton)
  useGitHubAttachCopySnippetButton(configContext.value.copySnippetButton)

  usePJAX()
  useProgressBar()

  return (
    <Theme>
      <div className={'gitako-side-bar'}>
        <Portal into={$logoContainerElement.value}>
          {!shouldShow && (
            <ToggleShowButton error={error} onClick={error ? undefined : toggleShowSideBar} />
          )}
        </Portal>
        <Resizable className={cx({ hidden: error || !shouldShow })} baseSize={baseSize}>
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
        </Resizable>
      </div>
    </Theme>
  )
}

function useToggleSideBarWithKeyboard(
  state: SideBarState,
  configContext: ConfigsContextShape,
  toggleShowSideBar: () => void,
) {
  React.useEffect(
    function attachKeyDown() {
      if (state === 'disabled' || !configContext.value.shortcut) return

      function onKeyDown(e: KeyboardEvent) {
        const keys = keyHelper.parseEvent(e)
        if (keys === configContext.value.shortcut) {
          toggleShowSideBar()
        }
      }
      window.addEventListener('keydown', onKeyDown)
      return () => window.removeEventListener('keydown', onKeyDown)
    },
    [toggleShowSideBar, state === 'disabled', configContext.value.shortcut],
  )
}
