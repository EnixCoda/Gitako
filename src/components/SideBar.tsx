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
import * as URLHelper from 'utils/URLHelper'

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

  const updateMeta = React.useCallback(() => {
    if (props.disabled) return
    DOMHelper.unmountTopProgressBar()
    props.setMetaData({ ...props.metaData, ...URLHelper.parse() })
  }, [props.disabled, props.metaData, configContext.val])
  useOnPJAXComplete(updateMeta)

  const attachCopyFileButton = React.useCallback(() => {
    if (props.disabled) return
    if (configContext.val.copyFileButton) return DOMHelper.attachCopyFileBtn()
  }, [props.disabled, configContext.val.copyFileButton])
  useOnPJAXComplete(attachCopyFileButton)

  const attachCopySnippetButton = React.useCallback(() => {
    if (props.disabled) return
    if (configContext.val.copySnippetButton) return DOMHelper.attachCopySnippet()
  }, [props.disabled, configContext.val.copySnippetButton])
  useOnPJAXComplete(attachCopySnippetButton)

  React.useEffect(() => {
    if (configContext.val.intelligentToggle === null) {
      props.setShouldShow(URLHelper.isInCodePage(props.metaData))
    }
  }, [props.metaData, configContext.val.intelligentToggle])

  React.useEffect(() => {
    if (configContext.val.copyFileButton) return DOMHelper.attachCopyFileBtn() || undefined // undefined is friendlier to React
  }, [configContext.val.copyFileButton])

  React.useEffect(() => {
    if (configContext.val.copySnippetButton) return DOMHelper.attachCopySnippet() || undefined // undefined is friendlier to React
  }, [configContext.val.copySnippetButton])

  // init again when setting new accessToken
  useDidUpdate(() => {
    props.init()
  }, [accessToken])

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

function useEvent<
  T extends {
    addEventListener: Function
    removeEventListener: Function
  }
>(target: T, event: string, callback: () => void, deps: React.DependencyList = []) {
  React.useEffect(() => {
    target.addEventListener(event, callback)
    return () => target.removeEventListener(event, callback)
  }, [callback, ...deps])
}

const useOnPJAXComplete = useEvent.bind(null, window, 'pjax:complete')

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
      const { access_token: accessToken, scope, error_description: errorDescription } = res
      if (errorDescription) {
        const TOKEN_EXPIRED_DESCRIPTION = `The code passed is incorrect or expired.`
        if (errorDescription === TOKEN_EXPIRED_DESCRIPTION) {
          alert(`Gitako: The OAuth token has expired, please try again.`)
        } else {
          throw new Error(errorDescription)
        }
      } else if (scope !== 'repo' || !accessToken) {
        throw new Error(`Cannot resolve token response: '${JSON.stringify(res)}'`)
      }
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
