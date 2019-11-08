import { Icon } from 'components/Icon'
import * as React from 'react'

type Props = {
  text: React.ReactNode
}
export function LoadingIndicator({ text }: Props) {
  return (
    <div className={'loading-indicator-container'}>
      <div className={'loading-indicator'}>
        <Icon className={'loading-indicator-icon'} type={'gear'} />
        {text}
      </div>
    </div>
  )
}
