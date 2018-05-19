import preact from 'preact'
import Portal from 'preact-portal'
import NProgress from 'nprogress'
/** @jsx preact.h */

import FileExplorer from './FileExplorer'
import ToggleShowButton from './ToggleShowButton'
import MetaBar from './MetaBar'
import SettingsBar from './SettingsBar'

import cx from '../utils/cx'
import DOMHelper, { REPO_TYPE_PRIVATE } from '../utils/DOMHelper'
import GitHubHelper, { NOT_FOUND, BAD_CREDENTIALS } from '../utils/GitHubHelper'
import storageHelper from '../utils/storageHelper'
import URLHelper from '../utils/URLHelper'

export default class SideBar extends preact.Component {
  state = {
    // whether Gitako side bar should be shown
    shouldShow: false,
    // whether show settings pane
    showSettings: false,
    // whether failed loading the repo due to it is private
    errorDueToAuth: false,
    // got access token for GitHub
    hasAccessToken: null,
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
      const accessToken = await storageHelper.getAccessToken()
      this.setState({ hasAccessToken: Boolean(accessToken) })
      const metaDataFromAPI = await GitHubHelper.getRepoMeta({ ...metaDataFromUrl, accessToken })
      const branchName = metaDataFromUrl.branchName || metaDataFromAPI['default_branch']
      const metaData = { ...metaDataFromUrl, branchName, api: metaDataFromAPI }
      this.setState({ metaData })
      this.setShouldShow(URLHelper.isInCodePage(metaData))
      const treeData = await GitHubHelper.getTreeData({ ...metaData, accessToken })
      this.setState({ treeData })
      this.logoContainerElement = DOMHelper.insertLogo()

      window.addEventListener('pjax:send', this.onPJAXStart)
      window.addEventListener('pjax:complete', this.onPJAXEnd)
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

  onPJAXStart = () => {
    NProgress.start()
  }

  onPJAXEnd = (() => {
    let lastLocation
    return () => {
      if (location.href !== lastLocation) {
        lastLocation = location.href
        const { metaData } = this.state
        NProgress.done()
        this.setShouldShow(URLHelper.isInCodePage(metaData))
        DOMHelper.decorateGitHubPageContent()
        DOMHelper.scrollToRepoContent()
        DOMHelper.focusSearchInput()
      }
    }
  })()

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

  renderAccessDeniedError() {
    return (
      <div className={'description'}>
        <h5>Access Denied</h5>
        <p>
          Gitako needs access token with proper scopes (recommended: repo) to access this repository.
          Please save it in the settings below.
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
        {metaData && treeData && <FileExplorer metaData={metaData} treeData={treeData} freeze={showSettings} />}
      </div>
    )
  }

  render() {
    const { shouldShow, showSettings, hasAccessToken, loading } = this.state
    return (
      <div className={cx('gitako', { hidden: !shouldShow })}>
        <Portal into={this.logoContainerElement}>
          <ToggleShowButton shouldShow={shouldShow} toggleShowSideBar={this.toggleShowSideBar} />
        </Portal>
        <div className={'gitako-side-bar'}>
          {this.renderContent()}
          <SettingsBar
            toggleShowSettings={this.toggleShowSettings}
            activated={showSettings}
            hasAccessToken={hasAccessToken}
          />
        </div>
      </div>
    )
  }
}
