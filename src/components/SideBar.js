import React from 'react'
import PropTypes from 'prop-types'

import { SideBar as SideBarCore } from '../driver/core'
import connect from '../driver/connect'

import FileExplorer from './FileExplorer'
import ToggleShowButton from './ToggleShowButton'
import MetaBar from './MetaBar'
import SettingsBar from './SettingsBar'
import Portal from './Portal'
import Resizable from './Resizable'

import cx from '../utils/cx'

@connect(SideBarCore)
export default class Gitako extends React.PureComponent {
  static propTypes = {
    // initial width of side bar
    baseSize: PropTypes.number,
    // whether Gitako side bar should be shown
    shouldShow: PropTypes.bool,
    // whether show settings pane
    showSettings: PropTypes.bool,
    // whether failed loading the repo due to it is private
    errorDueToAuth: PropTypes.bool,
    // access token for GitHub
    accessToken: PropTypes.string,
    // the shortcut string for toggle sidebar
    toggleShowSideBarShortcut: PropTypes.string,
    // meta data for the repository
    metaData: PropTypes.object,
    // file tree data
    treeData: PropTypes.object,
    // compress singleton folder
    compressSingletonFolder: PropTypes.bool,

    init: PropTypes.func.isRequired,
    onPJAXEnd: PropTypes.func.isRequired,
    setShouldShow: PropTypes.func.isRequired,
    toggleShowSideBar: PropTypes.func.isRequired,
    toggleShowSettings: PropTypes.func.isRequired,
    onAccessTokenChange: PropTypes.func.isRequired,
    onKeyDown: PropTypes.func.isRequired,
    onShortcutChange: PropTypes.func.isRequired,
    setMetaData: PropTypes.func.isRequired,
  }

  static defaultProps = {
    baseSize: 260,
    shouldShow: false,
    showSettings: false,
    errorDueToAuth: false,
    accessToken: '',
    toggleShowSideBarShortcut: '',
    metaData: null,
    treeData: null,
    compressSingletonFolder: false,
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
          Gitako needs access token with proper scopes (recommended: repo) to access this
          repository. Please save it in the settings below.
        </p>
      </div>
    )
  }

  renderContent() {
    const { errorDueToAuth, metaData, treeData, showSettings, accessToken, compressSingletonFolder } = this.props
    return (
      <div className={'gitako-side-bar-content'}>
        {metaData && <MetaBar metaData={metaData} />}
        {errorDueToAuth && this.renderAccessDeniedError()}
        {metaData &&
          treeData && (
            <FileExplorer metaData={metaData} treeData={treeData} freeze={showSettings} accessToken={accessToken} compressSingletonFolder={compressSingletonFolder} />
          )}
      </div>
    )
  }

  render() {
    const {
      baseSize,
      shouldShow,
      showSettings,
      accessToken,
      compressSingletonFolder,
      toggleShowSideBarShortcut,
      logoContainerElement,
      toggleShowSideBar,
      toggleShowSettings,
      onShortcutChange,
      onAccessTokenChange,
      setCompressSingleton,
    } = this.props
    return (
      <div className={'gitako-side-bar'}>
        <Portal into={logoContainerElement}>
          <ToggleShowButton shouldShow={shouldShow} toggleShowSideBar={toggleShowSideBar} />
        </Portal>
        <Resizable className={cx({ hidden: !shouldShow })} baseSize={baseSize}>
          <div className={'gitako-side-bar-body'}>
            {this.renderContent()}
            <SettingsBar
              toggleShowSettings={toggleShowSettings}
              onShortcutChange={onShortcutChange}
              onAccessTokenChange={onAccessTokenChange}
              activated={showSettings}
              accessToken={accessToken}
              compressSingletonFolder={compressSingletonFolder}
              toggleShowSideBarShortcut={toggleShowSideBarShortcut}
              setCompressSingleton={setCompressSingleton}
              />
          </div>
        </Resizable>
      </div>
    )
  }
}
