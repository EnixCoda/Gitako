import { Link } from '@primer/components'
import { Icon } from 'components/Icon'
import { VERSION } from 'env'
import { platform } from 'platforms'
import { GitHub } from 'platforms/GitHub'
import * as React from 'react'
import { useStates } from 'utils/hooks/useStates'
import { SimpleField, SimpleToggleField } from '../SimpleToggleField'
import { AccessTokenSettings } from './AccessTokenSettings'
import { FileTreeSettings } from './FileTreeSettings'
import { SettingsSection } from './SettingsSection'
import { SidebarSettings } from './SidebarSettings'

const WIKI_HOME_LINK = 'https://github.com/EnixCoda/Gitako/wiki'
export const wikiLinks = {
  compressSingletonFolder: `${WIKI_HOME_LINK}/Compress-Singleton-Folder`,
  changeLog: `${WIKI_HOME_LINK}/Change-Log`,
  copyFileButton: `${WIKI_HOME_LINK}/Copy-file-and-snippet`,
  copySnippet: `${WIKI_HOME_LINK}/Copy-file-and-snippet`,
  createAccessToken: `${WIKI_HOME_LINK}/Access-token-for-Gitako`,
}

type Props = {
  activated: boolean
  toggleShowSettings: () => void
}

function SettingsBarContent() {
  const useReloadHint = useStates<React.ReactNode>('')
  const { val: reloadHint } = useReloadHint

  const moreFields: SimpleField[] =
    platform === GitHub
      ? [
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
          {
            key: 'shrinkGitHubHeader',
            label: 'Shrink GitHub header(experimental)',
          },
        ]
      : []

  return (
    <>
      <h2 className={'gitako-settings-bar-title'}>Settings</h2>
      <div className={'gitako-settings-bar-content'}>
        <div className={'shadow-shelter'} />
        <AccessTokenSettings />
        <SidebarSettings />
        <FileTreeSettings />
        {moreFields.length > 0 && (
          <SettingsSection title={'More'}>
            {moreFields.map(field => (
              <React.Fragment key={field.key}>
                <SimpleToggleField field={field} />
              </React.Fragment>
            ))}

            {reloadHint && <div className={'hint'}>{reloadHint}</div>}
          </SettingsSection>
        )}
        <SettingsSection title={'Feedback'}>
          <a href="https://github.com/EnixCoda/Gitako/issues" target="_blank">
            Report bug / Request feature.
          </a>
        </SettingsSection>
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
        <Link
          color="gray.4"
          fontSize={14}
          href={wikiLinks.changeLog}
          target={'_blank'}
          title={'Check out new features!'}
        >
          {VERSION}
        </Link>
        <button className={'settings-button'} onClick={toggleShowSettings}>
          {activated ? (
            <Icon type={'chevron-down'} className={'hide-settings-icon'} />
          ) : (
            <Icon type={'gear'} className={'show-settings-icon'} />
          )}
        </button>
      </div>
    </div>
  )
}
