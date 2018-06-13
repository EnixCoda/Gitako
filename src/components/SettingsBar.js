import React from 'react'
import Icon from './Icon'
import storageHelper from '../utils/storageHelper'
import keyHelper from '../utils/keyHelper'

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

function friendlyFormatShortcut(shortcut) {
  if (typeof shortcut !== 'string') return ''
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

export default class SettingsBar extends React.Component {
  state = {
    accessTokenHint: null,
    accessToken: '',
    shortcutHint: null,
    toggleShowSideBarShortcut: '',
  }

  componentWillMount() {
    const { toggleShowSideBarShortcut } = this.props
    this.setState({ toggleShowSideBarShortcut })
  }

  componentWillReceiveProps({ toggleShowSideBarShortcut }) {
    this.setState({ toggleShowSideBarShortcut })
  }

  onInputAccessToken = event => {
    const value = event.target.value
    this.setState({ accessToken: value })
    this.setState({
      accessTokenHint: ACCESS_TOKEN_REGEXP.test(value) ? '' : 'This token is in unknown format.',
    })
  }

  saveToken = async () => {
    const { onHasAccessTokenChange } = this.props
    const { accessToken } = this.state
    if (accessToken) {
      await storageHelper.setAccessToken(accessToken)
      onHasAccessTokenChange(true)
      this.setState({
        accessTokenHint: 'Your token is saved, will work after reloading the page!',
      })
    }
  }

  clearToken = async () => {
    const { onHasAccessTokenChange } = this.props
    await storageHelper.setAccessToken('')
    onHasAccessTokenChange(false)
    this.setState({ accessToken: '' })
  }

  saveShortcut = async () => {
    const { onShortcutChange } = this.props
    const { toggleShowSideBarShortcut } = this.state
    await storageHelper.setShortcut(toggleShowSideBarShortcut)
    onShortcutChange(toggleShowSideBarShortcut)
    this.setState({
      shortcutHint: 'Shortcut is saved!',
    })
  }

  /**
   * @param {KeyboardEvent} e
   */
  onShortCutInputKeyDown = e => {
    e.preventDefault()
    const shortcut = keyHelper.parseEvent(e)
    this.setState({ toggleShowSideBarShortcut: shortcut })
  }

  render() {
    const { accessTokenHint, accessToken, toggleShowSideBarShortcut, shortcutHint } = this.state
    const { hasAccessToken } = this.props
    const { toggleShowSettings, activated } = this.props
    return (
      <div className={'gitako-settings-bar'}>
        {activated && (
          <h3 className={'gitako-settings-bar-title'}>
            Settings
          </h3>
        )}
        {activated && (
          <div className={'gitako-settings-bar-content'}>
            <div className={'shadow-shelter'} />
            <div className={'gitako-settings-bar-content-section access-token'}>
              <h4>Access Token</h4>
              <span>With access token provided, Gitako can access more repositories.</span>
              <br />
              <a href="https://github.com/blog/1509-personal-api-tokens" target="_blank">
                Help: how to create access token?
              </a>
              <br />
              <span>
                Gitako stores the token in&nbsp;
                <a href="https://developer.chrome.com/apps/storage" target="_blank">
                  chrome local storage
                </a>
                &nbsp;locally and safely.
              </span>
              <br />
              <div className={'access-token-input-control'}>
                <input
                  className={'access-token-input form-control'}
                  disabled={hasAccessToken}
                  placeholder={hasAccessToken ? 'Your token is saved' : 'Input your token here'}
                  value={accessToken}
                  onInput={this.onInputAccessToken}
                />
                {hasAccessToken ? (
                  <button className={'btn'} onClick={this.clearToken}>
                    Clear
                  </button>
                ) : (
                  <button className={'btn'} onClick={this.saveToken}>
                    Save
                  </button>
                )}
              </div>
              {accessTokenHint && <span className={'hint'}>{accessTokenHint}</span>}
            </div>
            <div className={'gitako-settings-bar-content-section toggle-shortcut'}>
              <h4>Toggle shortcut</h4>
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
            <div className={'gitako-settings-bar-content-section position'}>
              <h5>Position of Gitako (WIP)</h5>
              <select value={'next to'} disabled>
                <option value="next to">next to main content</option>
              </select>
            </div>
            <div className={'gitako-settings-bar-content-section TOC'}>
              <h5>Table of Markdown Content (WIP)</h5>
              <label htmlFor={'toc'}>
                <input name={'toc'} type={'checkbox'} disabled />
                &nbsp;enable
              </label>
            </div>
            <div className={'gitako-settings-bar-content-section issue'}>
              <h4>Issue</h4>
              <span>
                <a href="https://github.com/EnixCoda/Gitako/issues" target="_blank">
                  Draft a issue on Github
                </a>
                &nbsp;for bug report or feature request.
              </span>
            </div>
          </div>
        )}
        <div className={'placeholder-row'}>
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
