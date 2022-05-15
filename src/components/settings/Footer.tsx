import { Link } from '@primer/react'
import { Icon } from 'components/Icon'
import { VERSION } from 'env'
import * as React from 'react'
import { wikiLinks } from './SettingsBar'

type Props = {
  toggleShowSettings: () => void
}

export function Footer(props: Props) {
  const { toggleShowSettings } = props
  return (
    <div className={'gitako-footer'}>
      <Link
        className={'version'}
        href={wikiLinks.changeLog}
        title={'Check out new features!'}
        target="_blank"
        rel="noopener noreferrer"
      >
        {VERSION}
      </Link>
      <button className={'settings-button'} onClick={toggleShowSettings}>
        <Icon type={'gear'} className={'show-settings-icon'} />
      </button>
    </div>
  )
}
