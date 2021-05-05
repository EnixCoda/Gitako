import { AccessDeniedDescription } from 'components/AccessDeniedDescription'
import { FileExplorer } from 'components/FileExplorer'
import { MetaBar } from 'components/MetaBar'
import { Portal } from 'components/Portal'
import { Resizable } from 'components/Resizable'
import { SettingsBar } from 'components/settings/SettingsBar'
import { ToggleShowButton } from 'components/ToggleShowButton'
import { useConfigs } from 'containers/ConfigsContext'
import { connect } from 'driver/connect'
import { SideBarCore } from 'driver/core'
import { ConnectorState, Props } from 'driver/core/SideBar'
import { platform } from 'platforms'
import { useGitHubAttachCopyFileButton, useGitHubAttachCopySnippetButton } from 'platforms/GitHub'
import * as React from 'react'
import { cx } from 'utils/cx'
import * as DOMHelper from 'utils/DOMHelper'
import { parseURLSearch, run } from 'utils/general'
import { useLoadedContext } from 'utils/hooks/useLoadedContext'
import { loadWithPJAX, useOnPJAXDone, usePJAX } from 'utils/hooks/usePJAX'
import { useProgressBar } from 'utils/hooks/useProgressBar'
import { useStateIO } from 'utils/hooks/useStateIO'
import * as keyHelper from 'utils/keyHelper'
import { Icon } from './Icon'
import { LoadingIndicator } from './LoadingIndicator'
import { SideBarStateContext } from './SideBarState'
import { Theme } from './Theme'

const RawSideBar: React.FC<Props & ConnectorState> = function RawGitako(props) {
  const { metaData, error, shouldShow, toggleShowSideBar } = props

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

  React.useEffect(() => {
    run(async function () {
      if (!accessToken) {
        const accessToken = await trySetUpAccessTokenWithCode()
        if (accessToken) configContext.onChange({ accessToken })
      }
    })
  }, [])

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

  const intelligentToggle = configContext.value.intelligentToggle
  // Hide sidebar when error due to auth but token is set  #128
  const hideSidebarOnInvalidToken: boolean =
    intelligentToggle === null && Boolean(state === 'error-due-to-auth' && accessToken)
  React.useEffect(() => {
    if (hideSidebarOnInvalidToken) {
      props.setShouldShow(false)
    } else {
      const shouldShow = intelligentToggle === null ? platform.shouldShow() : intelligentToggle
      props.setShouldShow(shouldShow)
    }
  }, [intelligentToggle, hideSidebarOnInvalidToken, metaData])

  const updateSideBarVisibility = React.useCallback(
    function updateSideBarVisibility() {
      if (hideSidebarOnInvalidToken) {
        props.setShouldShow(false)
      } else if (intelligentToggle === null) {
        props.setShouldShow(platform.shouldShow())
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
                    return <AccessDeniedDescription hasToken={Boolean(accessToken)} />
                  default:
                    return metaData ? (
                      <>
                        <div className={'header'}>
                          <MetaBar metaData={metaData} />
                        </div>
                        <FileExplorer
                          metaData={metaData}
                          freeze={showSettings}
                          accessToken={accessToken}
                          loadWithPJAX={loadWithPJAX}
                          config={configContext.value}
                        />
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

RawSideBar.defaultProps = {
  shouldShow: false,
}

export const SideBar = connect(SideBarCore)(RawSideBar)

async function trySetUpAccessTokenWithCode() {
  const search = parseURLSearch()
  if ('code' in search) {
    const accessToken = await platform.setOAuth(search.code)
    if (!accessToken) alert(`Gitako: The OAuth token has expired, please try again.`)
    window.history.replaceState(
      {},
      'removed search param',
      window.location.pathname.replace(window.location.search, ''),
    )
    return accessToken
  }
}
