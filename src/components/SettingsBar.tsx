import { Icon } from 'components/Icon'
import { VERSION } from 'env'
import * as React from 'react'
import { Config } from 'utils/configHelper'
import { useStates } from 'utils/hooks/useStates'
import { AccessTokenSettings } from './settings/AccessTokenSettings'
import { FileTreeSettings } from './settings/FileTreeSettings'
import { SidebarSettings } from './settings/SidebarSettings'
import { SimpleToggleField } from './SimpleToggleField'

const WIKI_HOME_LINK = 'https://github.com/EnixCoda/Gitako/wiki'
export const wikiLinks = {
  compressSingletonFolder: `${WIKI_HOME_LINK}/Compress-Singleton-Folder`,
  changeLog: `${WIKI_HOME_LINK}/Change-Log`,
  copyFileButton: `${WIKI_HOME_LINK}/Copy-file-and-snippet`,
  copySnippet: `${WIKI_HOME_LINK}/Copy-file-and-snippet`,
  createAccessToken: `${WIKI_HOME_LINK}/How-to-create-access-token-for-Gitako%3F`,
}

type Props = {
  activated: boolean
  toggleShowSettings: () => void
}

export type SimpleField = {
  key: keyof Config
  label: string
  wikiLink?: string
  description?: string
  overwrite?: {
    value: <T>(value: T) => boolean
    onChange: (checked: boolean) => any
  }
}

const moreFields: SimpleField[] = [
  {
    key: 'copyFileButton',
    label: 'Copy file shortcut',
    wikiLink: wikiLinks.copyFileButton,
  },
  {
    key: 'copySnippetButton',
    label: 'Copy snippet shortcut',
    wikiLink: wikiLinks.copySnippet,
  },
]

function SettingsBarContent() {
  const useReloadHint = useStates<React.ReactNode>('')
  const { val: reloadHint } = useReloadHint

  return (
    <>
      <h3 className={'gitako-settings-bar-title'}>Settings</h3>
      <div className={'gitako-settings-bar-content'}>
        <div className={'shadow-shelter'} />
        <AccessTokenSettings />
        <SidebarSettings />
        <FileTreeSettings />
        <div className={'gitako-settings-bar-content-section others'}>
          <h4>More</h4>
          {moreFields.map(field => (
            <React.Fragment key={field.key}>
              <SimpleToggleField field={field} />
            </React.Fragment>
          ))}

          {reloadHint && <div className={'hint'}>{reloadHint}</div>}
        </div>
        <div className={'gitako-settings-bar-content-section issue'}>
          <h4>Contact</h4>
          <a href="https://github.com/EnixCoda/Gitako/issues" target="_blank">
            Report bug / Request feature.
          </a>
        </div>
      </div>
    </>
  )
}

export function SettingsBar(props: Props) {
  const { toggleShowSettings, activated } = props
  return (
    <div className={'gitako-settings-bar'}>
      {activated && <SettingsBarContent />}
      <div className={'header-row'}>
        <a
          className={'version'}
          href={wikiLinks.changeLog}
          target={'_blank'}
          title={'Check out new features!'}
        >
          {VERSION}
        </a>
        {activated ? (
          <Icon
            type={'chevron-down'}
            className={'hide-settings-icon'}
            onClick={toggleShowSettings}
          />
        ) : (
          <Icon type={'gear'} className={'show-settings-icon'} onClick={toggleShowSettings} />
        )}
      </div>
    </div>
  )
}
