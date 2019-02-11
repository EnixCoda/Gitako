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

export type TreeData = any
export type MetaData = any
export type VisibleNodes = VisibleNodesGenerator['visibleNodes']

type Props = {
  // initial width of side bar
  baseSize?: number
  // error message
  error?: string
  // whether Gitako side bar should be shown
  shouldShow?: boolean
  // whether show settings pane
  showSettings?: boolean
  // whether failed loading the repo due to it is private
  errorDueToAuth?: boolean
  // access token for GitHub
  accessToken?: string
  // the shortcut string for toggle sidebar
  toggleShowSideBarShortcut?: string
  // meta data for the repository
  metaData: MetaData
  // file tree data
  treeData: TreeData
  // few settings
  compressSingletonFolder?: boolean
  copyFileButton?: boolean
  copySnippetButton?: boolean
  logoContainerElement: HTMLElement | null

  init: () => void
  onPJAXEnd: () => void
  toggleShowSideBar: () => void
  toggleShowSettings: () => void
  onAccessTokenChange: SettingsBar['props']['onAccessTokenChange']
  onKeyDown: EventListener
  onShortcutChange: SettingsBar['props']['onShortcutChange']
  setCopyFile: SettingsBar['props']['setCopyFile']
  setCopySnippet: SettingsBar['props']['setCopySnippet']
  setCompressSingleton: SettingsBar['props']['setCompressSingleton']
}

@(connect(SideBarCore) as any)
export default class Gitako extends React.PureComponent<Props> {
  static defaultProps: Partial<Props> = {
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
    const { errorDueToAuth, metaData, treeData, showSettings, toggleShowSettings } = this.props
    return (
      <div className={'gitako-side-bar-content'}>
        {metaData && <MetaBar metaData={metaData} />}
        {errorDueToAuth
          ? this.renderAccessDeniedError()
          : metaData && (
              <FileExplorer
                toggleShowSettings={toggleShowSettings}
                metaData={metaData}
                treeData={treeData}
                freeze={showSettings}
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
