import React from 'react'
import NProgress from 'nprogress'

import FileExplorer from './FileExplorer'
import ToggleShowButton from './ToggleShowButton'
import MetaBar from './MetaBar'
import SettingsBar from './SettingsBar'
import ResizeHandler from './ResizeHandler'
import Portal from './Portal'

import cx from '../utils/cx'
import DOMHelper, { REPO_TYPE_PRIVATE } from '../utils/DOMHelper'
import GitHubHelper, { NOT_FOUND, BAD_CREDENTIALS } from '../utils/GitHubHelper'
import storageHelper from '../utils/storageHelper'
import URLHelper from '../utils/URLHelper'
import keyHelper from '../utils/keyHelper'

// initial width of side bar
const baseSize = 260
export default class SideBar extends React.Component {
  state = {
    // current width of side bar
    size: 260,
    // whether Gitako side bar should be shown
    shouldShow: false,
    // whether show settings pane
    showSettings: false,
    // whether failed loading the repo due to it is private
    errorDueToAuth: false,
    // got access token for GitHub
    hasAccessToken: false,
    // the shortcut string for toggle sidebar
    toggleShowSideBarShortcut: '',
    // meta data for the repository
    metaData: null,
    // file tree data
    treeData: null,
  }

  async componentWillMount() {
    try {
      const metaDataFromUrl = URLHelper.parse()
      this.setState({ metaData: metaDataFromUrl })
      DOMHelper.decorateGitHubPageContent()
      const [accessToken, shortcut] = await Promise.all([
        storageHelper.getAccessToken(),
        storageHelper.getShortcut(),
      ])
      this.setState({ hasAccessToken: Boolean(accessToken), toggleShowSideBarShortcut: shortcut })
      const metaDataFromAPI = await GitHubHelper.getRepoMeta({ ...metaDataFromUrl, accessToken })
      const branchName = metaDataFromUrl.branchName || metaDataFromAPI['default_branch']
      const metaData = { ...metaDataFromUrl, branchName, api: metaDataFromAPI }
      this.setState({ metaData })
      const shouldShow = URLHelper.isInCodePage(metaData)
      this.setShouldShow(shouldShow)
      if (shouldShow) {
        NProgress.start()
      }
      const treeData = await GitHubHelper.getTreeData({ ...metaData, accessToken })
      this.logoContainerElement = DOMHelper.insertLogo()
      this.setState({ treeData })
      if (shouldShow) {
        NProgress.done()
      }

      window.addEventListener('pjax:complete', this.onPJAXEnd)
      window.addEventListener('keydown', this.onKeyDown)
    } catch (err) {
      // TODO: detect request time exceeds limit
      if (err.message === NOT_FOUND || err.message === BAD_CREDENTIALS) {
        const repoPageType = await DOMHelper.getRepoPageType()
        const errorDueToAuth = repoPageType === REPO_TYPE_PRIVATE || err.message === BAD_CREDENTIALS
        this.setState({
          showSettings: repoPageType !== null,
          errorDueToAuth,
        })
        this.setShouldShow(errorDueToAuth)
      } else {
        console.error(err)
        this.setShouldShow(false)
      }
    }
  }

  componentWillUnmount() {
    window.removeEventListener('pjax:complete', this.onPJAXEnd)
    window.removeEventListener('keydown', this.onKeyDown)
  }

  onPJAXEnd = () => {
    NProgress.done()
    const { metaData } = this.state
    const mergedMetaData = { ...metaData, ...URLHelper.parse() }
    this.setState({
      metaData: mergedMetaData,
    })
    this.setShouldShow(URLHelper.isInCodePage(mergedMetaData))
    DOMHelper.decorateGitHubPageContent()
    DOMHelper.focusSearchInput()
  }

  setShouldShow = shouldShow => {
    this.setState({ shouldShow })
    DOMHelper.setBodyIndent(shouldShow)
  }

  toggleShowSideBar = () => {
    const { shouldShow } = this.state
    this.setShouldShow(!shouldShow)
  }

  toggleShowSettings = () => {
    const { showSettings } = this.state
    this.setState({ showSettings: !showSettings })
  }

  onHasAccessTokenChange = hasAccessToken => {
    this.setState({ hasAccessToken })
  }

  onKeyDown = e => {
    const { toggleShowSideBarShortcut } = this.state
    if (toggleShowSideBarShortcut) {
      const keys = keyHelper.parseEvent(e)
      if (keys === toggleShowSideBarShortcut) {
        this.toggleShowSideBar()
      }
    }
  }

  onShortcutChange = shortcut => {
    this.setState({ toggleShowSideBarShortcut: shortcut })
  }

  onResize = size => {
    this.setState({
      size,
    })
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
    const { errorDueToAuth, metaData, treeData, showSettings } = this.state
    return (
      <div className={'gitako-side-bar-content'}>
        {metaData && <MetaBar metaData={metaData} />}
        {errorDueToAuth && this.renderAccessDeniedError()}
        {metaData &&
          treeData && (
            <FileExplorer metaData={metaData} treeData={treeData} freeze={showSettings} />
          )}
      </div>
    )
  }

  render() {
    const {
      size,
      shouldShow,
      showSettings,
      hasAccessToken,
      toggleShowSideBarShortcut,
      loading,
    } = this.state
    return (
      <div className={cx('gitako', { hidden: !shouldShow })}>
        <Portal into={this.logoContainerElement}>
          <ToggleShowButton shouldShow={shouldShow} toggleShowSideBar={this.toggleShowSideBar} />
        </Portal>
        <div className={'gitako-position-wrapper'}>
          <ResizeHandler onResize={this.onResize} baseSize={baseSize} style={{ right: size }} />
          <div className={'gitako-side-bar'} style={{ width: size }}>
            {this.renderContent()}
            <SettingsBar
              toggleShowSettings={this.toggleShowSettings}
              onShortcutChange={this.onShortcutChange}
              onHasAccessTokenChange={this.onHasAccessTokenChange}
              activated={showSettings}
              hasAccessToken={hasAccessToken}
              toggleShowSideBarShortcut={toggleShowSideBarShortcut}
            />
          </div>
        </div>
      </div>
    )
  }
}
