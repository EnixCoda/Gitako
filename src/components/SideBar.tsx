import { AccessDeniedDescription } from 'components/AccessDeniedDescription'
import { FileExplorer } from 'components/FileExplorer'
import { MetaBar } from 'components/MetaBar'
import { Portal } from 'components/Portal'
import { Resizable } from 'components/Resizable'
import { SettingsBar } from 'components/settings/SettingsBar'
import { ToggleShowButton } from 'components/ToggleShowButton'
import { connect } from 'driver/connect'
import { SideBarCore } from 'driver/core'
import { ConnectorState, Props } from 'driver/core/SideBar'
import { platform } from 'platforms'
import { useGitHubAttachCopyFileButton, useGitHubAttachCopySnippetButton } from 'platforms/GitHub'
import * as React from 'react'
import { cx } from 'utils/cx'
import { parseURLSearch, run } from 'utils/general'
import { loadWithPJAX, useOnPJAXDone, usePJAX } from 'utils/hooks/usePJAX'
import { useProgressBar } from 'utils/hooks/useProgressBar'
import * as keyHelper from 'utils/keyHelper'
import { Icon } from './Icon'
import { LoadingIndicator } from './LoadingIndicator'
import { Theme } from './Theme'

const RawGitako: React.FC<Props & ConnectorState> = function RawGitako(props) {
  const {
    errorDueToAuth,
    metaData,
    treeData,
    defer,
    error,
    shouldShow,
    showSettings,
    logoContainerElement,
    toggleShowSideBar,
    toggleShowSettings,
    configContext,
  } = props

  const accessToken = configContext.value.accessToken || ''
  const [baseSize] = React.useState(() => configContext.value.sideBarWidth)

  React.useEffect(() => {
    run(async function () {
      if (!accessToken) {
        const accessToken = await trySetUpAccessTokenWithCode()
        if (accessToken) configContext.onChange({ accessToken })
      }
    })
  }, [])

  React.useEffect(() => {
    props.init()
  }, [accessToken])

  React.useEffect(
    function attachKeyDown() {
      if (props.disabled || !configContext.value.shortcut) return

      function onKeyDown(e: KeyboardEvent) {
        const keys = keyHelper.parseEvent(e)
        if (keys === configContext.value.shortcut) {
          toggleShowSideBar()
        }
      }
      window.addEventListener('keydown', onKeyDown)
      return () => window.removeEventListener('keydown', onKeyDown)
    },
    [toggleShowSideBar, props.disabled, configContext.value.shortcut],
  )

  const intelligentToggle = configContext.value.intelligentToggle
  // Hide sidebar when error due to auth but token is set  #128
  const hideSidebarOnInvalidToken: boolean =
    intelligentToggle === null && Boolean(errorDueToAuth && accessToken)
  React.useEffect(() => {
    if (hideSidebarOnInvalidToken) {
      props.setShouldShow(false)
    } else {
      const shouldShow = intelligentToggle === null ? platform.shouldShow() : intelligentToggle
      props.setShouldShow(shouldShow)
    }
  }, [intelligentToggle, hideSidebarOnInvalidToken, props.metaData])

  const updateSideBarVisibility = React.useCallback(
    function updateSideBarVisibility() {
      if (hideSidebarOnInvalidToken) {
        props.setShouldShow(false)
      } else if (intelligentToggle === null) {
        props.setShouldShow(platform.shouldShow())
      }
    },
    [props.metaData?.branchName, intelligentToggle, hideSidebarOnInvalidToken],
  )
  useOnPJAXDone(updateSideBarVisibility)

  useGitHubAttachCopyFileButton(configContext.value.copyFileButton)
  useGitHubAttachCopySnippetButton(configContext.value.copySnippetButton)

  usePJAX()
  useProgressBar()

  return (
    <Theme>
      <div className={'gitako-side-bar'}>
        <Portal into={logoContainerElement}>
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
            <div className={'gitako-side-bar-content'}>
              {metaData ? (
                <div className={'header'}>
                  <MetaBar metaData={metaData} />
                </div>
              ) : (
                <LoadingIndicator text={'Fetching repo meta...'} />
              )}
              {errorDueToAuth ? (
                <AccessDeniedDescription hasToken={Boolean(accessToken)} />
              ) : (
                metaData && (
                  <FileExplorer
                    toggleShowSettings={toggleShowSettings}
                    metaData={metaData}
                    treeRoot={treeData}
                    freeze={showSettings}
                    accessToken={accessToken}
                    loadWithPJAX={loadWithPJAX}
                    config={configContext.value}
                    defer={defer}
                  />
                )
              )}
            </div>
            <SettingsBar
              defer={defer}
              toggleShowSettings={toggleShowSettings}
              activated={showSettings}
            />
          </div>
        </Resizable>
      </div>
    </Theme>
  )
}

RawGitako.defaultProps = {
  shouldShow: false,
  showSettings: false,
  errorDueToAuth: false,
  disabled: false,
}

export const SideBar = connect(SideBarCore)(RawGitako)

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
