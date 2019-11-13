import { raiseError } from 'analytics'
import { FileExplorer } from 'components/FileExplorer'
import { MetaBar } from 'components/MetaBar'
import { Portal } from 'components/Portal'
import { Resizable } from 'components/Resizable'
import { SettingsBar } from 'components/SettingsBar'
import { ToggleShowButton } from 'components/ToggleShowButton'
import { useConfigs } from 'containers/ConfigsContext'
import { connect } from 'driver/connect'
import { SideBarCore } from 'driver/core'
import { ConnectorState, Props } from 'driver/core/SideBar'
import { oauth } from 'env'
import * as React from 'react'
import { cx } from 'utils/cx'
import * as DOMHelper from 'utils/DOMHelper'
import { JSONRequest, parseURLSearch } from 'utils/general'
import { useDidUpdate } from 'utils/hooks'
import * as keyHelper from 'utils/keyHelper'

const RawGitako: React.FC<Props & ConnectorState> = function RawGitako(props) {
  const configContext = useConfigs()
  const accessToken = props.configContext.val.access_token

  React.useEffect(() => {
    const { init } = props
    ;(async function() {
      if (!accessToken) {
        const accessToken = await trySetUpAccessTokenWithCode()
        configContext.set({ access_token: accessToken })
      }
      init()
    })()
  }, [])

  const onKeyDown = React.useCallback(
    configContext.val.shortcut
      ? (e: KeyboardEvent) => {
          const keys = keyHelper.parseEvent(e)
          if (keys === configContext.val.shortcut) {
            props.toggleShowSideBar()
          }
        }
      : () => {},
    [configContext.val.shortcut],
  )

  React.useEffect(() => {
    if (props.disabled) return
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [props.disabled, onKeyDown])

  React.useEffect(() => {
    if (props.disabled) return
    window.addEventListener('pjax:complete', props.onPJAXEnd)
    return () => window.removeEventListener('pjax:complete', props.onPJAXEnd)
  }, [props.disabled])

  React.useEffect(() => {
    const { copyFileButton, copySnippetButton } = configContext.val
    DOMHelper.decorateGitHubPageContent({ copyFileButton, copySnippetButton })
  }, [])

  // init again when setting new accessToken
  useDidUpdate(() => props.init(), [accessToken])

  const {
    errorDueToAuth,
    metaData,
    treeData,
    baseSize,
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
            {errorDueToAuth
              ? renderAccessDeniedError()
              : metaData && (
                  <FileExplorer
                    toggleShowSettings={toggleShowSettings}
                    metaData={metaData}
                    treeData={treeData}
                    freeze={showSettings}
                    accessToken={accessToken}
                  />
                )}
          </div>
          <SettingsBar toggleShowSettings={toggleShowSettings} activated={showSettings} />
        </div>
      </Resizable>
    </div>
  )
}

RawGitako.defaultProps = {
  baseSize: 260,
  shouldShow: false,
  showSettings: false,
  errorDueToAuth: false,
  disabled: false,
}

export const SideBar = connect(SideBarCore)(RawGitako)

function renderAccessDeniedError() {
  return (
    <div className={'description'}>
      <h5>Access Denied</h5>
      <p>
        Due to{' '}
        <a target="_blank" href="https://developer.github.com/v3/#rate-limiting">
          limitation of GitHub
        </a>{' '}
        or{' '}
        <a target="_blank" href="https://developer.github.com/v3/#authentication">
          auth needs
        </a>
        , Gitako needs access token to continue. Please follow the instructions in the settings
        panel below.
      </p>
    </div>
  )
}

async function trySetUpAccessTokenWithCode() {
  try {
    const search = parseURLSearch()
    if ('code' in search) {
      const res = await JSONRequest('https://github.com/login/oauth/access_token', {
        code: search.code,
        client_id: oauth.clientId,
        client_secret: oauth.clientSecret,
      })
      const { access_token: accessToken, scope } = res
      if (scope !== 'repo' || !accessToken) {
        throw new Error(`Cannot resolve token response: '${JSON.stringify(res)}'`)
      }
      window.history.pushState({}, 'removed code', window.location.pathname.replace(/#.*$/, ''))
      return accessToken
    }
  } catch (err) {
    raiseError(err)
  }
}
