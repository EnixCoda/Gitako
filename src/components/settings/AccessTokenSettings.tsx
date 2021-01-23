import { Button, Text, TextInput } from '@primer/components'
import { wikiLinks } from 'components/settings/SettingsBar'
import { useConfigs } from 'containers/ConfigsContext'
import { platform } from 'platforms'
import { Gitea } from 'platforms/Gitea'
import { Gitee } from 'platforms/Gitee'
import * as React from 'react'
import { useStates } from 'utils/hooks/useStates'
import { SettingsSection } from './SettingsSection'

const ACCESS_TOKEN_REGEXP = /^[0-9a-f]+$/

type Props = {}

export function AccessTokenSettings(props: React.PropsWithChildren<Props>) {
  const configContext = useConfigs()
  const hasAccessToken = Boolean(configContext.val.accessToken)
  const useAccessToken = useStates('')
  const useAccessTokenHint = useStates<React.ReactNode>('')
  const focusInput = useStates(false)

  const { val: accessTokenHint } = useAccessTokenHint
  const { val: accessToken } = useAccessToken

  React.useEffect(() => {
    // clear input when access token updates
    useAccessToken.set('')
  }, [configContext.val.accessToken])

  const onInputAccessToken = React.useCallback(
    ({ currentTarget: { value } }: React.FormEvent<HTMLInputElement>) => {
      useAccessToken.set(value)
      useAccessTokenHint.set(
        ACCESS_TOKEN_REGEXP.test(value) ? '' : 'Gitako does not recognize the token.',
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
        configContext.set({ accessToken })
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

  return (
    <SettingsSection
      title={
        <>
          Access Token{' '}
          <a
            href={wikiLinks.createAccessToken}
            title="A token is required to access private repositories or bypass API rate limits"
            target="_blank"
          >
            (?)
          </a>
        </>
      }
    >
      {hasAccessToken ? (
        <div>
          <Text as="p">Your token has been saved.</Text>
          <Button onClick={() => configContext.set({ accessToken: '' })}>Clear</Button>
        </div>
      ) : (
        <div>
          {platform === Gitea ? (
            // TODO
            <Text>Note: OAuth for Gitea is unavailable</Text>
          ) : platform === Gitee ? (
            // disabled for Gitee as it does not support dynamic redirect_uri
            <Text>Note: OAuth for Gitee is unavailable</Text>
          ) : (
            <a
              className={'link-button'}
              onClick={() => {
                if (platform.isEnterprise()) {
                  alert(`OAuth for enterprise is not available.`)
                  return
                }
                // use js here to make sure redirect_uri is latest url
                window.location.href = platform.getOAuthLink()
              }}
            >
              Create with OAuth (recommended)
            </a>
          )}
          <div className={'access-token-input-control'}>
            <TextInput
              marginRight={1}
              className={'access-token-input'}
              value={accessToken}
              placeholder="Or input here manually"
              onFocus={() => focusInput.set(true)}
              onBlur={() => focusInput.set(false)}
              onChange={onInputAccessToken}
              onKeyPress={onPressAccessToken}
            />
            <Button onClick={() => saveToken()} disabled={!accessToken}>
              Save
            </Button>
          </div>
        </div>
      )}
      {accessTokenHint && !focusInput.val && <span className={'hint'}>{accessTokenHint}</span>}
    </SettingsSection>
  )
}
