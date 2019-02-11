import * as React from 'react'
import Icon from 'components/Icon'
import configHelper, { config } from 'utils/configHelper'
import keyHelper from 'utils/keyHelper'
import { version } from '../../package.json'

const wikiLinks = {
  compressSingletonFolder: 'https://github.com/EnixCoda/Gitako/wiki/Compress-Singleton-Folder',
  changeLog: 'https://github.com/EnixCoda/Gitako/wiki/Change-Log',
  copyFileButton: 'https://github.com/EnixCoda/Gitako/wiki/Copy-file-and-snippet',
  copySnippet: 'https://github.com/EnixCoda/Gitako/wiki/Copy-file-and-snippet',
}

const ACCESS_TOKEN_REGEXP = /^[0-9a-f]{40}$/

const OperatingSystems = {
  Windows: 'Windows',
  macOS: 'Macintosh',
  others: 'unknown',
}

function detectOS() {
  const {
    navigator: { userAgent },
  } = window
  if (userAgent.indexOf(OperatingSystems.Windows) !== -1) return OperatingSystems.Windows
  else if (userAgent.indexOf(OperatingSystems.macOS) !== -1) return OperatingSystems.macOS
  return OperatingSystems.others
}

function friendlyFormatShortcut(shortcut: string) {
  const OS = detectOS()
  if (OS === OperatingSystems.Windows) {
    return shortcut.replace(/meta/, 'win')
  } else if (OS === OperatingSystems.macOS) {
    return shortcut
      .replace(/meta/, '⌘')
      .replace(/ctrl/, '⌃')
      .replace(/shift/, '⇧')
      .replace(/alt/, '⌥')
      .toUpperCase()
  } else {
    return shortcut
  }
}

type Props = {
  accessToken: string
  activated: boolean
  onAccessTokenChange: (accessToken: string) => void
  onShortcutChange: (shortcut: string) => void
  compressSingletonFolder: boolean
  copyFileButton: boolean
  copySnippetButton: boolean
  setCopyFile: (copyFileButton: Props['copyFileButton']) => void
  setCopySnippet: (copySnippetButton: Props['copySnippetButton']) => void
  setCompressSingleton: (compressSingletonFolder: Props['compressSingletonFolder']) => void
  toggleShowSettings: () => void
  toggleShowSideBarShortcut: string
}

type State = {
  accessToken: string
  accessTokenHint: React.ReactNode
  shortcutHint: string
  toggleShowSideBarShortcut: string
  reloadHint: React.ReactNode
  varyOptions: {
    key: string
    label: string
    onChange: (e: React.FormEvent<HTMLInputElement>) => Promise<void>
    getValue: () => any
    wikiLink: string
  }[]
}

export default class SettingsBar extends React.PureComponent<Props, State> {
  state = {
    accessToken: '',
    accessTokenHint: '',
    shortcutHint: '',
    toggleShowSideBarShortcut: this.props.toggleShowSideBarShortcut,
    reloadHint: '',
    varyOptions: [
      {
        key: 'compress-singleton',
        label: 'Compress singleton folder',
        onChange: this.createOnChange(
          config.compressSingletonFolder,
          this.props.setCompressSingleton
        ),
        getValue: () => this.props.compressSingletonFolder,
        wikiLink: wikiLinks.compressSingletonFolder,
      },
      {
        key: 'copy-file',
        label: 'Copy File',
        onChange: this.createOnChange(config.copyFileButton, this.props.setCopyFile),
        getValue: () => this.props.copyFileButton,
        wikiLink: wikiLinks.copyFileButton,
      },
      {
        key: 'copy-snippet',
        label: 'Copy Snippet',
        onChange: this.createOnChange(config.copySnippetButton, this.props.setCopySnippet),
        getValue: () => this.props.copySnippetButton,
        wikiLink: wikiLinks.copySnippet,
      },
    ],
  }

  static getDerivedStateFromProps({ toggleShowSideBarShortcut }: Props) {
    return {
      toggleShowSideBarShortcut,
    }
  }

  onInputAccessToken = (event: React.FormEvent<HTMLInputElement>) => {
    const { value } = event.currentTarget
    this.setState({
      accessToken: value,
      accessTokenHint: ACCESS_TOKEN_REGEXP.test(value) ? '' : 'This token is in unknown format.',
    })
  }

  saveToken = async () => {
    const { onAccessTokenChange } = this.props
    const { accessToken } = this.state
    if (accessToken) {
      await configHelper.setOne(config.accessToken, accessToken)
      onAccessTokenChange(accessToken)
      this.setState({
        accessToken: '',
        accessTokenHint: (
          <span>
            <a href="#" onClick={() => window.location.reload()}>
              Reload
            </a>{' '}
            to activate!
          </span>
        ),
      })
    }
  }

  clearToken = async () => {
    const { onAccessTokenChange } = this.props
    await configHelper.setOne(config.accessToken, '')
    onAccessTokenChange('')
    this.setState({ accessToken: '' })
  }

  saveShortcut = async () => {
    const { onShortcutChange } = this.props
    const { toggleShowSideBarShortcut } = this.state
    await configHelper.setOne(config.shortcut, toggleShowSideBarShortcut)
    onShortcutChange(toggleShowSideBarShortcut)
    this.setState({
      shortcutHint: 'Shortcut is saved!',
    })
  }

  onShortCutInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    e.preventDefault()
    const shortcut = keyHelper.parseEvent(e)
    this.setState({ toggleShowSideBarShortcut: shortcut })
  }

  showReloadHint = () => {
    this.setState({
      reloadHint: (
        <span>
          Saved,{' '}
          <a href="#" onClick={() => window.location.reload()}>
            reload
          </a>{' '}
          to apply.
        </span>
      ),
    })
  }

  createOnChange(
    configKey: config,
    set: (value: any) => void
  ): (e: React.FormEvent<HTMLInputElement>) => Promise<void> {
    return async e => {
      const enabled = e.currentTarget.checked
      await configHelper.setOne(configKey, enabled)
      set(enabled)
      this.showReloadHint()
    }
  }

  render() {
    const {
      accessTokenHint,
      toggleShowSideBarShortcut,
      shortcutHint,
      accessToken,
      reloadHint,
      varyOptions,
    } = this.state
    const { toggleShowSettings, activated } = this.props
    const hasAccessToken = Boolean(this.props.accessToken)
    return (
      <div className={'gitako-settings-bar'}>
        {activated && (
          <React.Fragment>
            <h3 className={'gitako-settings-bar-title'}>Settings</h3>
            <div className={'gitako-settings-bar-content'}>
              <div className={'shadow-shelter'} />
              <div className={'gitako-settings-bar-content-section access-token'}>
                <h4>Access Token</h4>
                <a
                  href="https://github.com/EnixCoda/Gitako/wiki/How-to-create-access-token-for-Gitako%3F"
                  target="_blank"
                >
                  Why & how to create it?
                </a>
                <br />
                <div className={'access-token-input-control'}>
                  <input
                    className={'access-token-input form-control'}
                    disabled={hasAccessToken}
                    placeholder={hasAccessToken ? 'Your token is saved' : 'Input your token here'}
                    value={accessToken}
                    onInput={this.onInputAccessToken}
                  />
                  {hasAccessToken && !accessToken ? (
                    <button className={'btn'} onClick={this.clearToken}>
                      Clear
                    </button>
                  ) : (
                    <button className={'btn'} onClick={this.saveToken} disabled={!accessToken}>
                      Save
                    </button>
                  )}
                </div>
                {accessTokenHint && <span className={'hint'}>{accessTokenHint}</span>}
              </div>
              <div className={'gitako-settings-bar-content-section toggle-shortcut'}>
                <h4>Toggle Shortcut</h4>
                <span>Set a combination of keys for toggling Gitako sidebar.</span>
                <br />
                <div className={'toggle-shortcut-input-control'}>
                  <input
                    className={'toggle-shortcut-input form-control'}
                    placeholder={'focus here and press the shortcut keys'}
                    value={friendlyFormatShortcut(toggleShowSideBarShortcut)}
                    onKeyDown={this.onShortCutInputKeyDown}
                    readOnly
                  />
                  <button className={'btn'} onClick={this.saveShortcut}>
                    Save
                  </button>
                </div>
                {shortcutHint && <span className={'hint'}>{shortcutHint}</span>}
              </div>
              <div className={'gitako-settings-bar-content-section others'}>
                <h4>More Options</h4>
                {varyOptions.map(option => (
                  <React.Fragment key={option.key}>
                    <label htmlFor={option.key}>
                      <input
                        id={option.key}
                        name={option.key}
                        type={'checkbox'}
                        onChange={option.onChange}
                        checked={option.getValue()}
                      />
                      &nbsp;{option.label}&nbsp;
                      <a href={option.wikiLink} target={'_blank'}>
                        (?)
                      </a>
                    </label>
                    <br />
                  </React.Fragment>
                ))}
                {reloadHint && <div className={'hint'}>{reloadHint}</div>}
              </div>
              <div className={'gitako-settings-bar-content-section issue'}>
                <h4>Contact</h4>
                <a href="https://github.com/EnixCoda/Gitako/issues" target="_blank">
                  Bug report / feature request.
                </a>
              </div>
            </div>
          </React.Fragment>
        )}
        <div className={'placeholder-row'}>
          <a
            className={'version'}
            href={wikiLinks.changeLog}
            target={'_blank'}
            title={'Check out new features!'}
          >
            v{version}
          </a>
          {activated ? (
            <Icon
              type={'chevron-down'}
              className={'hide-settings-icon'}
              onClick={toggleShowSettings}
            />
          ) : (
            <Icon type={'gear'} className={'show-settings-icon'} onClick={toggleShowSettings} />
          )}
        </div>
      </div>
    )
  }
}
