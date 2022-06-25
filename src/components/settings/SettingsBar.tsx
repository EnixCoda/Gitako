import { Link } from '@primer/components'
import { Icon } from 'components/Icon'
import { useConfigs } from 'containers/ConfigsContext'
import { VERSION } from 'env'
import { platform } from 'platforms'
import { GitHub } from 'platforms/GitHub'
import * as React from 'react'
import { useUpdateEffect } from 'react-use'
import { useStateIO } from 'utils/hooks/useStateIO'
import { SimpleField, SimpleToggleField } from '../SimpleToggleField'
import { AccessTokenSettings } from './AccessTokenSettings'
import { FileTreeSettings } from './FileTreeSettings'
import { SettingsSection } from './SettingsSection'
import { SidebarSettings } from './SidebarSettings'

const WIKI_HOME_LINK = 'https://github.com/EnixCoda/Gitako/wiki'
export const wikiLinks = {
  compressSingletonFolder: `${WIKI_HOME_LINK}/Compress-Singleton-Folder`,
  changeLog: `${WIKI_HOME_LINK}/Change-Log`,
  codeFolding: `${WIKI_HOME_LINK}/Code-folding`,
  copyFileButton: `${WIKI_HOME_LINK}/Copy-file-and-snippet`,
  copySnippet: `${WIKI_HOME_LINK}/Copy-file-and-snippet`,
  createAccessToken: `${WIKI_HOME_LINK}/Access-token-for-Gitako`,
  pjaxMode: `${WIKI_HOME_LINK}/Pjax-Mode`,
}

type Props = {
  activated: boolean
  toggleShowSettings: () => void
}

function SettingsBarContent() {
  const useReloadHint = useStateIO<React.ReactNode>('')
  const { value: reloadHint } = useReloadHint

  const moreFields: SimpleField<
    'copyFileButton' | 'copySnippetButton' | 'codeFolding' | 'pjaxMode'
  >[] =
    platform === GitHub
      ? [
          {
            key: 'codeFolding',
            label: 'Fold source code button',
            wikiLink: wikiLinks.codeFolding,
            tooltip: `Read more in Gitako's Wiki`,
          },
          {
            key: 'pjaxMode',
            label: 'Native PJAX mode',
            wikiLink: wikiLinks.pjaxMode,
            tooltip: 'Please keep it enabled unless Gitako crashes after redirecting',
            overwrite: {
              value: pjaxMode => pjaxMode === 'native',
              onChange: checked => (checked ? 'native' : 'pjax-api'),
            },
          },
          {
            key: 'copyFileButton',
            label: 'Copy file button',
            wikiLink: wikiLinks.copyFileButton,
            tooltip: `Read more in Gitako's Wiki`,
          },
          {
            key: 'copySnippetButton',
            label: 'Copy snippet button',
            wikiLink: wikiLinks.copySnippet,
            tooltip: `Read more in Gitako's Wiki`,
          },
        ]
      : []

  useUpdateEffect(() => {
    window.location.reload()
  }, [useConfigs().value.pjaxMode])

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
        <SettingsSection title={'Talk to the author'}>
          <a href="https://github.com/EnixCoda/Gitako/issues" target="_blank">
            Report bug
          </a>
          {' / '}
          <a href="https://github.com/EnixCoda/Gitako/discussions" target="_blank">
            Discuss feature
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
          className={'version'}
          fontSize={14}
          href={wikiLinks.changeLog}
          target={'_blank'}
          title={'Check out new features!'}
        >
          {VERSION}
        </Link>
        <div className={'header-right'}>
          <button className={'settings-button'} onClick={toggleShowSettings}>
            {activated ? (
              <Icon type={'chevron-down'} className={'hide-settings-icon'} />
            ) : (
              <Icon type={'gear'} className={'show-settings-icon'} />
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
