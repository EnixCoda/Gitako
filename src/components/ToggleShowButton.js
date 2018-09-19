import React from 'react'
import Icon from './Icon'

import cx from '../utils/cx'

export default function Logo({ error, shouldShow, toggleShowSideBar }) {
  return (
    <div
      className={cx('gitako-toggle-show-button-wrapper', {
        collapsed: !shouldShow || error,
        error,
      })}
      onClick={error ? undefined : toggleShowSideBar}
    >
      <Icon className={'action-icon'} type={shouldShow ? 'x' : 'octoface'} />
      {error && <span className={'error-message'}>{error}</span>}
    </div>
  )
}
