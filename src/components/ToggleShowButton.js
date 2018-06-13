import React from 'react'
import Icon from './Icon'

import cx from '../utils/cx'

export default function Logo({ shouldShow, toggleShowSideBar }) {
  return (
    <div className={cx('gitako-toggle-show-button-wrapper', { collapsed: !shouldShow })} onClick={toggleShowSideBar}>
      <Icon className={'action-icon'} type={shouldShow ? 'x' : 'octoface'} />
    </div>
  )
}
