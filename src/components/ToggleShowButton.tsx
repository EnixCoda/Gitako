import { Icon } from 'components/Icon'
import * as React from 'react'
import { cx } from 'utils/cx'

type Props = {
  error?: string
  shouldShow: boolean
  toggleShowSideBar: React.MouseEventHandler
}

export function ToggleShowButton({ error, shouldShow, toggleShowSideBar }: Props) {
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
