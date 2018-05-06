import preact from 'preact'
/** @jsx preact.h */
import Icon from './Icon'

import cx from '../utils/cx'

export default function Logo({ loading, shouldShow, toggleShowSideBar }) {
  return (
    <div className={'gitako-logo-wrapper'} onClick={toggleShowSideBar}>
      <Icon className={'action-icon'} type={shouldShow ? 'chevron-left' : 'chevron-right'} />
      <label className={cx('gitako-logo', { breath: loading })}>
        {shouldShow ? 'hide' : 'show'}
        <br />
        Gitako
      </label>
    </div>
  )
}
