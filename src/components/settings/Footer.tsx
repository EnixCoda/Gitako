import { Link } from '@primer/components'
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
        fontSize={14}
        href={wikiLinks.changeLog}
        target={'_blank'}
        title={'Check out new features!'}
      >
        {VERSION}
      </Link>
      <button className={'settings-button'} onClick={toggleShowSettings}>
        <Icon type={'gear'} className={'show-settings-icon'} />
      </button>
    </div>
  )
}
