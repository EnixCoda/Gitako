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
import { useEvent, useUpdateEffect } from 'react-use'
import { cx } from 'utils/cx'
import { parseURLSearch } from 'utils/general'
import { usePJAX } from 'utils/hooks/usePJAX'
import * as keyHelper from 'utils/keyHelper'
import { Icon } from './Icon'

const RawGitako: React.FC<Props & ConnectorState> = function RawGitako(props) {
  const configContext = useConfigs()
  const accessToken = props.configContext.val.access_token
  const [baseSize] = React.useState(() => configContext.val.sideBarWidth)

  const { shrinkGitHubHeader } = configContext.val
  React.useEffect(() => {
    if (platform === GitHub) {
      const ele = document.body
      if (shrinkGitHubHeader) {
        ele.classList.add('shrink-github-header')
      } else {
        ele.classList.remove('shrink-github-header')
      }
    }
  }, [shrinkGitHubHeader])

  const intelligentToggle = configContext.val.intelligentToggle
  React.useEffect(() => {
    const shouldShow = intelligentToggle === null ? platform.shouldShow() : intelligentToggle
    props.setShouldShow(shouldShow)
  }, [intelligentToggle, props.metaData])

  React.useEffect(() => {
    const { init } = props
    ;(async function () {
      if (!accessToken) {
        const accessToken = await trySetUpAccessTokenWithCode()
        configContext.set({ access_token: accessToken || undefined })
      }
      init()
    })()
  }, [])

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
  useEvent('pjax:ready', updateSideBarVisibility, document)

  const copyFileButton = configContext.val.copyFileButton
  useGitHubAttachCopyFileButton(copyFileButton)

  const copySnippetButton = configContext.val.copySnippetButton
  useGitHubAttachCopySnippetButton(copySnippetButton)

  // init again when setting new accessToken
  useUpdateEffect(() => {
    props.init()
  }, [accessToken || '']) // '' prevents duplicated requests

  const loadWithPJAX = usePJAX()

  const {
    errorDueToAuth,
    metaData,
    treeData: treeRoot,
    error,
    shouldShow,
    showSettings,
    logoContainerElement,
    toggleShowSideBar,
    toggleShowSettings,
  } = props
  return (
    <div className={'gitako-side-bar'}>
      <Portal into={logoContainerElement}>
        {!shouldShow && (
          <ToggleShowButton error={error} onClick={error ? undefined : toggleShowSideBar} />
        )}
      </Portal>
      <Resizable className={cx({ hidden: error || !shouldShow })} baseSize={baseSize}>
        <div className={'gitako-side-bar-body'}>
          <div className={'gitako-side-bar-content'}>
            <div className={'header'}>
              {metaData ? <MetaBar metaData={metaData} /> : <div />}

              <div className={'close-side-bar-button-position'}>
                <button className={'close-side-bar-button'} onClick={toggleShowSideBar}>
                  <Icon className={'action-icon'} type={'x'} />
                </button>
              </div>
            </div>
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
                />
              )
            )}
          </div>
          <SettingsBar toggleShowSettings={toggleShowSettings} activated={showSettings} />
        </div>
      </Resizable>
    </div>
  )
}

RawGitako.defaultProps = {
  shouldShow: false,
  showSettings: false,
  errorDueToAuth: false,
  disabled: false,
}

export const SideBar = connect(SideBarCore)(RawGitako)

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
