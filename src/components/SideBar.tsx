import FileExplorer from 'components/FileExplorer'
import MetaBar from 'components/MetaBar'
import Portal from 'components/Portal'
import Resizable from 'components/Resizable'
import SettingsBar from 'components/SettingsBar'
import ToggleShowButton from 'components/ToggleShowButton'
import connect from 'driver/connect'
import { SideBar as SideBarCore } from 'driver/core'
import { ConnectorState } from 'driver/core/SideBar'
import * as React from 'react'
import cx from 'utils/cx'

export type Props = {}

class Gitako extends React.PureComponent<Props & ConnectorState> {
  static defaultProps: Partial<Props & ConnectorState> = {
    baseSize: 260,
    shouldShow: false,
    showSettings: false,
    errorDueToAuth: false,
    accessToken: '',
    toggleShowSideBarShortcut: '',
    compressSingletonFolder: true,
    copyFileButton: true,
    copySnippetButton: true,
    disabled: false,
  }

  componentWillMount() {
    const { init } = this.props
    init()
  }

  componentDidMount() {
    const { useListeners } = this.props
    useListeners(true)
  }

  componentWillUnmount() {
    const { useListeners } = this.props
    useListeners(false)
  }

  renderAccessDeniedError(hasToken: boolean) {
    return (
      <div className={'description'}>
        <h5>Access Denied</h5>
        {hasToken ? (
          <p>Current access token is not granted with permissions to access this project.</p>
        ) : (
          <p>
            Gitako needs access token to read this project due to{' '}
            <a target="_blank" href="https://developer.github.com/v3/#rate-limiting">
              GitHub rate limiting
            </a>{' '}
            and{' '}
            <a target="_blank" href="https://developer.github.com/v3/#authentication">
              auth needs
            </a>
            . Please setup access token in the settings panel below.
          </p>
        )}
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
          ? this.renderAccessDeniedError(Boolean(accessToken))
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
      intelligentToggle,
      toggleShowSideBarShortcut,
      logoContainerElement,
      toggleShowSideBar,
      toggleShowSettings,
      onShortcutChange,
      onAccessTokenChange,
      setCompressSingleton,
      setCopyFile,
      setCopySnippet,
      setIntelligentToggle,
    } = this.props
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
              intelligentToggle={intelligentToggle}
              setCompressSingleton={setCompressSingleton}
              setCopyFile={setCopyFile}
              setCopySnippet={setCopySnippet}
              setIntelligentToggle={setIntelligentToggle}
            />
          </div>
        </Resizable>
      </div>
    )
  }
}

export default connect<Props, ConnectorState>(SideBarCore)(Gitako)
