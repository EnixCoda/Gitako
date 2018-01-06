import preact from 'preact'
/** @jsx preact.h */

import storageHelper from '../utils/storageHelper'

const ACCESS_TOKEN_REGEXP = /^[0-9a-f]{40}$/

export default class SettingsBar extends preact.Component {
  state = {
    hint: null,
    tokenCleared: false,
  }

  handleAccessTokenChange = event => {
    const value = event.target.value
    const { hasAccessToken } = this.props
    if (value === '') {
      if (hasAccessToken) {
        storageHelper.setAccessToken('')
        this.setState({ tokenCleared: true })
      } else {
        this.setState({ hint: '' })
      }
    } else if (ACCESS_TOKEN_REGEXP.test(value)) {
      storageHelper.setAccessToken(value)
      this.setState({ hint: 'Your token is saved, refresh the page to make it work!' })
    } else {
      this.setState({ hint: 'Invalid token' })
    }
  }

  render() {
    const { hint, tokenCleared } = this.state
    const { toggleShowSettings, activated, hasAccessToken } = this.props
    return (
      <div className={'gitako-settings-bar'}>
        <div className={'placeholder-row'}>
          <h3>{activated ? 'Settings' : ''}</h3>
          <span
            className={`settings-icon octicon octicon-${activated ? 'x' : 'gear'} octicon-color`}
            onClick={toggleShowSettings}
          />
        </div>
        {activated && (
          <div className={'gitako-settings-bar-content'}>
            <div className={'gitako-settings-bar-content-section access-token'}>
              <h4>Access Token</h4>
              <span>
                With access token, Gitako will be able to browse your private repositories with no
                API request time limit.
              </span>
              <br />
              <a href="https://github.com/blog/1509-personal-api-tokens" target="_blank">
                How to create access token?
              </a>
              <br />
              <span>
                Gitako stores the token in{' '}
                <a href="https://developer.chrome.com/apps/storage" target="_blank">
                  chrome local storage
                </a>{' '}
                locally and safely.
              </span>
              <br />
              <input
                className={'access-token-input form-control'}
                placeholder={
                  hasAccessToken
                    ? tokenCleared ? 'Your token is cleared' : 'Your token is saved'
                    : 'Input your token here'
                }
                onInput={this.handleAccessTokenChange}
              />
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
              <a href="https://github.com/EnixCoda/Gitako/issues" target="_blank">
                Draft a issue on Github.
              </a>
              <br />
              <span>Report BUG or request feature.</span>
            </div>
          </div>
        )}
      </div>
    )
  }
}
