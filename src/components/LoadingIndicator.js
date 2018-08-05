import React from 'react'
import Icon from './Icon';

export default function LoadingIndicator({ text }) {
  return (
    <div className={'loading-indicator-container'}>
      <div className={'loading-indicator'}>
        <Icon className={'loading-indicator-icon'} type={'gear'} />
        {text}
      </div>
    </div>
  )
}
