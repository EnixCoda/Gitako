import preact from 'preact'
/** @jsx preact.h */

import FileExplorer from './FileExplorer'
import Logo from './Logo'
import MetaBar from './MetaBar'
import SettingsBar from './SettingsBar'

import cx from '../utils/cx'
import DOMHelper, { REPO_TYPE_PRIVATE } from '../utils/DOMHelper'
import GitHubHelper, { NOT_FOUND } from '../utils/GitHubHelper'
import storageHelper from '../utils/storageHelper'
import URLHelper from '../utils/URLHelper'

export default class SideBar extends preact.Component {
  state = {
    // whether Gitako side bar should be shown
    shouldShow: false,
    // whether show settings pane
    showSettings: false,
    // whether pending for network request
    loading: true,
    // whether failed loading the repo due to it is private
    errorDueToPrivateRepo: false,
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
      this.setState({ hasAccessToken: !!accessToken })
      const metaDataFromAPI = await GitHubHelper.getRepoMeta({ ...metaDataFromUrl, accessToken })
      const branchName = metaDataFromUrl.branchName || metaDataFromAPI['default_branch']
      const metaData = { ...metaDataFromUrl, branchName, api: metaDataFromAPI }
      this.setState({ metaData })
      this.setShouldShow(URLHelper.isInCodePage(metaData))
      const treeData = await GitHubHelper.getTreeData({ ...metaData, accessToken })
      this.setState({ treeData, loading: false })

      window.addEventListener('pjax:send', this.onPJAXStart)
      window.addEventListener('pjax:complete', this.onPJAXEnd)
    } catch (err) {
      // TODO: detect request time exceeds limit
      if (err.message === NOT_FOUND) {
        const repoPageType = await DOMHelper.getRepoPageType()
        const errorDueToPrivateRepo = repoPageType === REPO_TYPE_PRIVATE
        this.setState({
          showSettings: repoPageType !== null,
          errorDueToPrivateRepo,
        })
        this.setShouldShow(errorDueToPrivateRepo)
      } else {
        console.error(err)
        this.setShouldShow(false)
      }
    }
  }

  onPJAXStart = () => {
    this.setState({ loading: true })
  }

  onPJAXEnd = (() => {
    let lastLocation
    return () => {
      if (location.href !== lastLocation) {
        lastLocation = location.href
        const { metaData } = this.state
        this.setState({ loading: false })
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

  toggleShowSettings = () => {
    const { showSettings } = this.state
    this.setState({ showSettings: !showSettings })
  }

  renderPrivateRepoError() {
    return (
      <div className={'description'}>
        <h5>Access Denied</h5>
        <p>
          Gitako need access token with proper scopes (recommended: repo) to read this repository's
          data.
        </p>
      </div>
    )
  }

  renderContent() {
    const {
      errorDueToPrivateRepo,
      metaData,
      treeData,
    } = this.state
    return (
      <div className={'gitako-side-bar-content'}>
        {metaData && <MetaBar metaData={metaData} />}
        {errorDueToPrivateRepo && this.renderPrivateRepoError()}
        {metaData && treeData && <FileExplorer metaData={metaData} treeData={treeData} />}
      </div>
    )
  }

  render() {
    const {
      shouldShow,
      loading,
      showSettings,
      hasAccessToken,
    } = this.state
    return (
      <div className={cx('gitako', { hidden: !shouldShow })}>
        <div className={'gitako-side-bar'}>
          <Logo loading={loading} />
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
