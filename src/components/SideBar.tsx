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
import {
  GitHub,
  useGitHubAttachCopyFileButton,
  useGitHubAttachCopySnippetButton,
} from 'platforms/GitHub'
import * as React from 'react'
import { cx } from 'utils/cx'
import { parseURLSearch, run } from 'utils/general'
import { loadWithPJAX, useOnPJAXDone, usePJAX } from 'utils/hooks/usePJAX'
import { useProgressBar } from 'utils/hooks/useProgressBar'
import * as keyHelper from 'utils/keyHelper'
import { Icon } from './Icon'
import { Theme } from './Theme'

const RawGitako: React.FC<Props & ConnectorState> = function RawGitako(props) {
  const configContext = useConfigs()
  const accessToken = props.configContext.val.accessToken || ''
  const [baseSize] = React.useState(() => configContext.val.sideBarWidth)

  useShrinkGitHubHeader(configContext.val.shrinkGitHubHeader)

  const intelligentToggle = configContext.val.intelligentToggle
  React.useEffect(() => {
    const shouldShow = intelligentToggle === null ? platform.shouldShow() : intelligentToggle
    props.setShouldShow(shouldShow)
  }, [intelligentToggle, props.metaData])

  React.useEffect(() => {
    run(async function () {
      if (!accessToken) {
        const accessToken = await trySetUpAccessTokenWithCode()
        if (accessToken) configContext.set({ accessToken })
      }
    })
  }, [])

  React.useEffect(() => {
    props.init()
  }, [accessToken])

  React.useEffect(
    function attachKeyDown() {
      if (props.disabled || !configContext.val.shortcut) return

      function onKeyDown(e: KeyboardEvent) {
        const keys = keyHelper.parseEvent(e)
        if (keys === configContext.val.shortcut) {
          props.toggleShowSideBar()
        }
      }
      window.addEventListener('keydown', onKeyDown)
      return () => window.removeEventListener('keydown', onKeyDown)
    },
    [props.disabled, configContext.val.shortcut],
  )

  const updateSideBarVisibility = React.useCallback(
    function updateSideBarVisibility() {
      if (configContext.val.intelligentToggle === null) {
        props.setShouldShow(platform.shouldShow())
      }
    },
    [props.metaData?.branchName, configContext.val.intelligentToggle],
  )
  useOnPJAXDone(updateSideBarVisibility)

  const copyFileButton = configContext.val.copyFileButton
  useGitHubAttachCopyFileButton(copyFileButton)

  const copySnippetButton = configContext.val.copySnippetButton
  useGitHubAttachCopySnippetButton(copySnippetButton)

  usePJAX()
  useProgressBar()

  const {
    errorDueToAuth,
    metaData,
    treeData: treeRoot,
    defer,
    error,
    shouldShow,
    showSettings,
    logoContainerElement,
    toggleShowSideBar,
    toggleShowSettings,
  } = props
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
              <div className={'header'}>{metaData ? <MetaBar metaData={metaData} /> : <div />}</div>
              {errorDueToAuth ? (
                <AccessDeniedError hasToken={Boolean(accessToken)} />
              ) : (
                metaData && (
                  <FileExplorer
                    toggleShowSettings={toggleShowSettings}
                    metaData={metaData}
                    treeRoot={treeRoot}
                    freeze={showSettings}
                    accessToken={accessToken}
                    loadWithPJAX={loadWithPJAX}
                    config={configContext.val}
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

function useShrinkGitHubHeader(shrinkGitHubHeader: boolean) {
  React.useEffect(() => {
    if (platform === GitHub) {
      const target = document.body
      if (shrinkGitHubHeader) {
        target.classList.add('shrink-github-header')
      } else {
        target.classList.remove('shrink-github-header')
      }
    }
  }, [shrinkGitHubHeader])
}

function AccessDeniedError({ hasToken }: { hasToken: boolean }) {
  return <AccessDeniedDescription hasToken={hasToken} />
}

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
