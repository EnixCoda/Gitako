import { HourglassIcon } from '@primer/octicons-react'
import * as React from 'react'

type Props = {
  text: React.ReactNode
}
export function LoadingIndicator({ text }: Props) {
  return (
    <div className={'loading-indicator-container'}>
      <div className={'loading-indicator'}>
        <HourglassIcon className={'loading-indicator-icon'} />
        {text}
      </div>
    </div>
  )
}
