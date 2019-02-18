import * as React from 'react'
import { SideBar as SideBarCore } from 'driver/core'
import connect from 'driver/connect'
import FileExplorer from 'components/FileExplorer'
import ToggleShowButton from 'components/ToggleShowButton'
import MetaBar from 'components/MetaBar'
import SettingsBar from 'components/SettingsBar'
import Portal from 'components/Portal'
import Resizable from 'components/Resizable'
import cx from 'utils/cx'
import VisibleNodesGenerator from 'utils/VisibleNodesGenerator'
import { ConnectorState } from 'driver/core/SideBar'

export type VisibleNodes = VisibleNodesGenerator['visibleNodes']

export type Props = {}

class Gitako extends React.PureComponent<Props & ConnectorState> {
  static defaultProps: Partial<Props & ConnectorState> = {
    baseSize: 260,
    shouldShow: false,
    showSettings: false,
    errorDueToAuth: false,
    accessToken: '',
    toggleShowSideBarShortcut: '',
    metaData: null,
    treeData: null,
    compressSingletonFolder: true,
    copyFileButton: true,
    copySnippetButton: true,
  }

  componentWillMount() {
    const { init } = this.props
    init()
  }

  componentDidMount() {
    const { onPJAXEnd, onKeyDown } = this.props
    window.addEventListener('pjax:complete', onPJAXEnd)
    window.addEventListener('keydown', onKeyDown)
  }

  componentWillUnmount() {
    const { onPJAXEnd, onKeyDown } = this.props
    window.removeEventListener('pjax:complete', onPJAXEnd)
    window.removeEventListener('keydown', onKeyDown)
  }

  renderAccessDeniedError() {
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

  renderContent() {
    const {
      errorDueToAuth,
      metaData,
      treeData,
      showSettings,
      toggleShowSettings,
      compressSingletonFolder,
      accessToken,
    } = this.props
    return (
      <div className={'gitako-side-bar-content'}>
        {metaData && <MetaBar metaData={metaData} />}
        {errorDueToAuth
          ? this.renderAccessDeniedError()
          : metaData && (
              <FileExplorer
                compressSingletonFolder={compressSingletonFolder}
                toggleShowSettings={toggleShowSettings}
                metaData={metaData}
                treeData={treeData}
                freeze={showSettings}
                accessToken={accessToken}
              />
            )}
      </div>
    )
  }

  render() {
    const {
      baseSize,
      error,
      shouldShow,
      showSettings,
      accessToken,
      compressSingletonFolder,
      copyFileButton,
      copySnippetButton,
      toggleShowSideBarShortcut,
      logoContainerElement,
      toggleShowSideBar,
      toggleShowSettings,
      onShortcutChange,
      onAccessTokenChange,
      setCompressSingleton,
      setCopyFile,
      setCopySnippet,
    } = this.props
    return (
      <div className={'gitako-side-bar'}>
        <Portal into={logoContainerElement}>
          <ToggleShowButton
            hasError={Boolean(error)}
            shouldShow={shouldShow}
            toggleShowSideBar={toggleShowSideBar}
          />
        </Portal>
        <Resizable className={cx({ hidden: error || !shouldShow })} baseSize={baseSize}>
          <div className={'gitako-side-bar-body'}>
            {this.renderContent()}
            <SettingsBar
              toggleShowSettings={toggleShowSettings}
              onShortcutChange={onShortcutChange}
              onAccessTokenChange={onAccessTokenChange}
              activated={showSettings}
              accessToken={accessToken}
              toggleShowSideBarShortcut={toggleShowSideBarShortcut}
              compressSingletonFolder={compressSingletonFolder}
              copyFileButton={copyFileButton}
              copySnippetButton={copySnippetButton}
              setCompressSingleton={setCompressSingleton}
              setCopyFile={setCopyFile}
              setCopySnippet={setCopySnippet}
            />
          </div>
        </Resizable>
      </div>
    )
  }
}

export default connect<Props, ConnectorState>(SideBarCore)(Gitako)
