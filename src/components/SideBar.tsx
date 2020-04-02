import { raiseError } from 'analytics'
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
import { useEvent, useUpdateEffect } from 'react-use'
import { cx } from 'utils/cx'
import { parseURLSearch } from 'utils/general'
import { usePJAX } from 'utils/hooks/usePJAX'
import * as keyHelper from 'utils/keyHelper'

const RawGitako: React.FC<Props & ConnectorState> = function RawGitako(props) {
  const configContext = useConfigs()
  const accessToken = props.configContext.val.access_token
  const [baseSize] = React.useState(() => configContext.val.sideBarWidth)

  const intelligentToggle = configContext.val.intelligentToggle
  React.useEffect(() => {
    const shouldShow =
      intelligentToggle === null ? platform.shouldShow(props.metaData) : intelligentToggle
    props.setShouldShow(shouldShow)
  }, [intelligentToggle, props.metaData])

  React.useEffect(() => {
    const { init } = props
    ;(async function() {
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
        props.setShouldShow(
          platform.shouldShow({
            branchName: props.metaData?.branchName,
          }),
        )
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
        <ToggleShowButton
          error={error}
          shouldShow={shouldShow}
          toggleShowSideBar={toggleShowSideBar}
        />
      </Portal>
      <Resizable className={cx({ hidden: error || !shouldShow })} baseSize={baseSize}>
        <div className={'gitako-side-bar-body'}>
          <div className={'gitako-side-bar-content'}>
            {metaData && <MetaBar metaData={metaData} />}
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
  try {
    const search = parseURLSearch()
    if ('code' in search) {
      const accessToken = await platform.setOAuth(search.code)
      window.history.pushState(
        {},
        'removed search param',
        window.location.pathname.replace(window.location.search, ''),
      )
      return accessToken
    }
  } catch (err) {
    raiseError(err)
  }
}
