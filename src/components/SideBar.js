import React from 'react'
import PropTypes from 'prop-types'

import FileExplorer from './FileExplorer'
import ToggleShowButton from './ToggleShowButton'
import MetaBar from './MetaBar'
import SettingsBar from './SettingsBar'
import ResizeHandler from './ResizeHandler'
import Portal from './Portal'

import cx from '../utils/cx'

const baseSize = 260

export default class Gitako extends React.PureComponent {
  static propTypes = {
    // initial width of side bar
    baseSize: PropTypes.number,
    // current width of side bar
    size: PropTypes.number,
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

    init: PropTypes.func.isRequired,
    onPJAXEnd: PropTypes.func.isRequired,
    setShouldShow: PropTypes.func.isRequired,
    toggleShowSideBar: PropTypes.func.isRequired,
    toggleShowSettings: PropTypes.func.isRequired,
    onAccessTokenChange: PropTypes.func.isRequired,
    onKeyDown: PropTypes.func.isRequired,
    onShortcutChange: PropTypes.func.isRequired,
    onResize: PropTypes.func.isRequired,
    setMetaData: PropTypes.func.isRequired,
  }

  static defaultProps = {
    baseSize,
    size: baseSize,
    shouldShow: false,
    showSettings: false,
    errorDueToAuth: false,
    accessToken: '',
    toggleShowSideBarShortcut: '',
    metaData: null,
    treeData: null,
  }

  constructor(props) {
    super(props)
    const { init } = props
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
    const { errorDueToAuth, metaData, treeData, showSettings, accessToken } = this.props
    return (
      <div className={'gitako-side-bar-content'}>
        {metaData && <MetaBar metaData={metaData} />}
        {errorDueToAuth && this.renderAccessDeniedError()}
        {metaData &&
          treeData && (
            <FileExplorer metaData={metaData} treeData={treeData} freeze={showSettings} accessToken={accessToken} />
          )}
      </div>
    )
  }

  render() {
    const {
      size,
      shouldShow,
      showSettings,
      accessToken,
      toggleShowSideBarShortcut,
      logoContainerElement,
      toggleShowSideBar,
      onResize,
      toggleShowSettings,
      onShortcutChange,
      onAccessTokenChange,
    } = this.props
    return (
      <div className={cx('gitako', { hidden: !shouldShow })}>
        <Portal into={logoContainerElement}>
          <ToggleShowButton shouldShow={shouldShow} toggleShowSideBar={toggleShowSideBar} />
        </Portal>
        <div className={'gitako-position-wrapper'}>
          <ResizeHandler onResize={onResize} baseSize={baseSize} style={{ right: size }} />
          <div className={'gitako-side-bar'} style={{ width: size }}>
            {this.renderContent()}
            <SettingsBar
              toggleShowSettings={toggleShowSettings}
              onShortcutChange={onShortcutChange}
              onAccessTokenChange={onAccessTokenChange}
              activated={showSettings}
              accessToken={accessToken}
              toggleShowSideBarShortcut={toggleShowSideBarShortcut}
            />
          </div>
        </div>
      </div>
    )
  }
}
