import { Icon } from 'components/Icon'
import { useConfigs } from 'containers/ConfigsContext'
import { oauth, VERSION } from 'env'
import * as React from 'react'
import { friendlyFormatShortcut } from 'utils/general'
import { useStates } from 'utils/hooks'
import * as keyHelper from 'utils/keyHelper'
import { SimpleField, SimpleFieldInput } from './MoreOption'

const WIKI_HOME_LINK = 'https://github.com/EnixCoda/Gitako/wiki'
const wikiLinks = {
  compressSingletonFolder: `${WIKI_HOME_LINK}/Compress-Singleton-Folder`,
  changeLog: `${WIKI_HOME_LINK}/Change-Log`,
  copyFileButton: `${WIKI_HOME_LINK}/Copy-file-and-snippet`,
  copySnippet: `${WIKI_HOME_LINK}/Copy-file-and-snippet`,
  createAccessToken: `${WIKI_HOME_LINK}/How-to-create-access-token-for-Gitako%3F`,
}

const ACCESS_TOKEN_REGEXP = /^[0-9a-f]{40}$/

type Props = {
  activated: boolean
  toggleShowSettings: () => void
}

const moreFields: SimpleField[] = [
  {
    key: 'compressSingletonFolder',
    label: 'Compress singleton folder',
    wikiLink: wikiLinks.compressSingletonFolder,
  },
  {
    key: 'copyFileButton',
    label: 'Copy File Shortcut',
    wikiLink: wikiLinks.copyFileButton,
  },
  {
    key: 'copySnippetButton',
    label: 'Copy Snippet Shortcut',
    wikiLink: wikiLinks.copySnippet,
  },
  {
    key: 'intelligentToggle',
    label: 'Intelligent Toggle',
    description: `Gitako will open/close automatically according to page content when this is enabled.`,
    overwrite: {
      value: enabled => enabled === null,
      onChange: checked => (checked ? null : true),
    },
  },
]

function SettingsBarContent() {
  const configContext = useConfigs()
  const hasAccessToken = Boolean(configContext.val.access_token)
  const useAccessToken = useStates('')
  const useAccessTokenHint = useStates<React.ReactNode>('')
  const useShortcutHint = useStates('')
  const useToggleShowSideBarShortcut = useStates(configContext.val.shortcut)
  const useReloadHint = useStates<React.ReactNode>('')

  const { val: accessTokenHint } = useAccessTokenHint
  const { val: toggleShowSideBarShortcut } = useToggleShowSideBarShortcut
  const { val: shortcutHint } = useShortcutHint
  const { val: accessToken } = useAccessToken
  const { val: reloadHint } = useReloadHint

  React.useEffect(() => {
    useToggleShowSideBarShortcut.set(configContext.val.shortcut)
  }, [configContext.val.shortcut])

  React.useEffect(() => {
    // clear input when access token updates
    useAccessToken.set('')
  }, [configContext.val.access_token])

  const onInputAccessToken = React.useCallback(
    ({ currentTarget: { value } }: React.FormEvent<HTMLInputElement>) => {
      useAccessToken.set(value)
      useAccessTokenHint.set(
        ACCESS_TOKEN_REGEXP.test(value) ? '' : 'This token is in unknown format.',
      )
    },
    [],
  )

  const onPressAccessToken = React.useCallback(({ key }: React.KeyboardEvent) => {
    if (key === 'Enter') saveToken()
  }, [])

  const saveToken = React.useCallback(
    async (hint?: typeof useAccessTokenHint.val) => {
      if (accessToken) {
        configContext.set({ access_token: accessToken })
        useAccessToken.set('')
        useAccessTokenHint.set(
          hint || (
            <span>
              <a href="#" onClick={() => window.location.reload()}>
                Reload
              </a>{' '}
              to activate!
            </span>
          ),
        )
      }
    },
    [accessToken],
  )

  const saveShortcut = React.useCallback(async () => {
    const { val: toggleShowSideBarShortcut } = useToggleShowSideBarShortcut
    configContext.set({ shortcut: toggleShowSideBarShortcut })
    if (typeof toggleShowSideBarShortcut === 'string') {
      useShortcutHint.set('Shortcut is saved!')
    }
  }, [useToggleShowSideBarShortcut.val])

  const onShortCutInputKeyDown = React.useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    e.preventDefault()
    e.stopPropagation()
    // Clear shortcut with backspace
    const shortcut = e.key === 'Backspace' ? '' : keyHelper.parseEvent(e)
    useToggleShowSideBarShortcut.set(shortcut)
  }, [])

  const showReloadHint = React.useCallback(
    () =>
      useReloadHint.set(
        <span>
          Saved,{' '}
          <a href="#" onClick={() => window.location.reload()}>
            reload
          </a>{' '}
          to apply.
        </span>,
      ),
    [],
  )

  return (
    <>
      <h3 className={'gitako-settings-bar-title'}>Settings</h3>
      <div className={'gitako-settings-bar-content'}>
        <div className={'shadow-shelter'} />
        <div className={'gitako-settings-bar-content-section access-token'}>
          <h4>
            Access Token{' '}
            <a href={wikiLinks.createAccessToken} target="_blank">
              (?)
            </a>
          </h4>
          {!hasAccessToken && (
            <a
              href="#"
              onClick={() => {
                // use js here to make sure redirect_uri is latest url
                const url = `https://github.com/login/oauth/authorize?client_id=${
                  oauth.clientId
                }&scope=repo&redirect_uri=${encodeURIComponent(window.location.href)}`
                window.location.href = url
              }}
            >
              Create with OAuth (recommended)
            </a>
          )}
          <div className={'access-token-input-control'}>
            <input
              className={'access-token-input form-control'}
              disabled={hasAccessToken}
              placeholder={hasAccessToken ? 'Your token is saved' : 'Or input here manually'}
              value={accessToken}
              onChange={onInputAccessToken}
              onKeyPress={onPressAccessToken}
            />
            {hasAccessToken && !accessToken ? (
              <button className={'btn'} onClick={() => configContext.set({ access_token: '' })}>
                Clear
              </button>
            ) : (
              <button className={'btn'} onClick={() => saveToken()} disabled={!accessToken}>
                Save
              </button>
            )}
          </div>
          {accessTokenHint && <span className={'hint'}>{accessTokenHint}</span>}
        </div>
        <div className={'gitako-settings-bar-content-section toggle-shortcut'}>
          <h4>Toggle Shortcut</h4>
          <span>Set a combination of keys for toggling Gitako sidebar.</span>
          <br />
          <div className={'toggle-shortcut-input-control'}>
            <input
              className={'toggle-shortcut-input form-control'}
              placeholder={'focus here and press the shortcut keys'}
              value={friendlyFormatShortcut(toggleShowSideBarShortcut)}
              onKeyDown={onShortCutInputKeyDown}
              readOnly
            />
            <button className={'btn'} onClick={saveShortcut}>
              Save
            </button>
          </div>
          {shortcutHint && <span className={'hint'}>{shortcutHint}</span>}
        </div>
        <div className={'gitako-settings-bar-content-section others'}>
          <h4>More Options</h4>
          {moreFields.map(field => (
            <React.Fragment key={field.key}>
              <SimpleFieldInput
                field={field}
                overwrite={field.overwrite}
                onChange={showReloadHint}
              />
              <br />
            </React.Fragment>
          ))}

          {reloadHint && <div className={'hint'}>{reloadHint}</div>}
        </div>
        <div className={'gitako-settings-bar-content-section issue'}>
          <h4>Contact</h4>
          <a href="https://github.com/EnixCoda/Gitako/issues" target="_blank">
            Bug report / feature request.
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
