import * as React from 'react'
import Icon from 'components/Icon'

type Props = {
  text: React.ReactNode
}
export default function LoadingIndicator({ text }: Props) {
  return (
    <div className={'loading-indicator-container'}>
      <div className={'loading-indicator'}>
        <Icon className={'loading-indicator-icon'} type={'gear'} />
        {text}
      </div>
    </div>
  )
}
