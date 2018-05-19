import preact from 'preact'
/** @jsx preact.h */
import Icon from './Icon'

import cx from '../utils/cx'

export default function Logo({ shouldShow, toggleShowSideBar }) {
  return (
    <div className={cx('gitako-toggle-show-button-wrapper', { collapsed: !shouldShow })} onClick={toggleShowSideBar}>
      <Icon className={'action-icon'} type={shouldShow ? 'x' : 'octoface'} />
    </div>
  )
}
