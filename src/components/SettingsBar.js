import preact from 'preact'
/** @jsx preact.h */

import Icon from './Icon'
import storageHelper from '../utils/storageHelper'

const ACCESS_TOKEN_REGEXP = /^[0-9a-f]{40}$/

export default class SettingsBar extends preact.Component {
  state = {
    hint: null,
    hasAccessToken: false,
    accessToken: '',
  }

  componentWillMount() {
    const { hasAccessToken } = this.props
    this.setState({ hasAccessToken })
  }
  
  componentWillReceiveProps({ hasAccessToken }) {
    this.setState({ hasAccessToken })
  }

  onInputAccessToken = event => {
    const value = event.target.value
    this.setState({ accessToken: value })
    this.setState({
      hint: ACCESS_TOKEN_REGEXP.test(value)
        ? ''
        : 'This token is in unknown format.'
    })
  }

  saveToken = () => {
    const { accessToken } = this.state
    if (accessToken) {
      storageHelper.setAccessToken(accessToken)
      this.setState({
        hasAccessToken: true,
        hint: 'Your token is saved, will work after reloading the page!',
      })
    }
  }

  clearToken = () => {
    storageHelper.setAccessToken('')
    this.setState({ accessToken: '', hasAccessToken: false })
  }

  render() {
    const { hint, accessToken, hasAccessToken } = this.state
    const { toggleShowSettings, activated} = this.props
    return (
      <div className={'gitako-settings-bar'}>
        <div className={'placeholder-row'}>
          <h3>{activated ? 'Settings' : ''}</h3>
          {activated
            ? <Icon type={'chevron-down'} className={'hide-settings-icon'} onClick={toggleShowSettings} />
            : <Icon type={'gear'} className={'show-settings-icon'} onClick={toggleShowSettings} />
          }
        </div>
        {activated && (
          <div className={'gitako-settings-bar-content'}>
            <div className={'gitako-settings-bar-content-section access-token'}>
              <h4>Access Token</h4>
              <span>
                With access token provided, Gitako can access more repositories.
              </span>
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
                  placeholder={
                    hasAccessToken
                      ? 'Your token is saved'
                      : 'Input your token here'
                  }
                  value={accessToken}
                  onInput={this.onInputAccessToken}
                />
                {
                  hasAccessToken
                    ? <button className={'btn'} onClick={this.clearToken}>Clear</button>
                    : <button className={'btn'} onClick={this.saveToken}>Save</button>
                }
              </div>
              {hint && <span className={'hint'}>{hint}</span>}
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
      </div>
    )
  }
}
