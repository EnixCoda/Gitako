import { FileExplorer } from 'components/FileExplorer'
import { MetaBar } from 'components/MetaBar'
import { Portal } from 'components/Portal'
import { Resizable } from 'components/Resizable'
import { SettingsBar } from 'components/SettingsBar'
import { ToggleShowButton } from 'components/ToggleShowButton'
import { connect } from 'driver/connect'
import { SideBarCore } from 'driver/core'
import { ConnectorState, Props } from 'driver/core/SideBar'
import * as React from 'react'
import { cx } from 'utils/cx'

const RawGitako: React.FC<Props & ConnectorState> = function RawGitako(props) {
  React.useEffect(() => {
    const { init, useListeners } = props
    init()
    useListeners(true)
    return () => useListeners(false)
  }, [])

  const accessToken = props.configContext.val.access_token
  React.useEffect(() => {
    if (accessToken) {
      // reload when setting new accessToken
      if (accessToken) props.init()
    }
  }, [accessToken, props.init])

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
