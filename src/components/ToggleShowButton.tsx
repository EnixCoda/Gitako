import * as React from 'react'
import Icon from 'components/Icon'
import cx from 'utils/cx'

type Props = {
  error: boolean
  shouldShow: boolean
  toggleShowSideBar: React.MouseEventHandler
}
export default function Logo({ error, shouldShow, toggleShowSideBar }: Props) {
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
