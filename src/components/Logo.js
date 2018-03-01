import preact from 'preact'
/** @jsx preact.h */

import cx from '../utils/cx'

export default function Logo({ loading }) {
  return (
    <div className={'gitako-logo-wrapper Header'}>
      <h3>&nbsp;</h3>
      <h3 className={cx('gitako-logo', { invisible: loading })}>Gitako</h3>
      <h3 className={cx('gitako-logo breath', { invisible: !loading })}>Gitako</h3>
    </div>
  )
}
