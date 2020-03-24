import { Button, TextInput } from '@primer/components'
import { wikiLinks } from 'components/SettingsBar'
import { useConfigs } from 'containers/ConfigsContext'
import { GITHUB_OAUTH } from 'env'
import * as React from 'react'
import { useStates } from 'utils/hooks/useStates'
import { SettingsSection } from './SettingsSection'

const ACCESS_TOKEN_REGEXP = /^[0-9a-f]{40}$/

type Props = {}

export function AccessTokenSettings(props: React.PropsWithChildren<Props>) {
  const configContext = useConfigs()
  const hasAccessToken = Boolean(configContext.val.access_token)
  const useAccessToken = useStates('')
  const useAccessTokenHint = useStates<React.ReactNode>('')
  const focusInput = useStates(false)

  const { val: accessTokenHint } = useAccessTokenHint
  const { val: accessToken } = useAccessToken

  React.useEffect(() => {
    // clear input when access token updates
    useAccessToken.set('')
  }, [configContext.val.access_token])

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

  return (
    <SettingsSection
      title={
        <>
          Access Token{' '}
          <a href={wikiLinks.createAccessToken} target="_blank">
            (?)
          </a>
        </>
      }
    >
      {hasAccessToken ? (
        <Button onClick={() => configContext.set({ access_token: '' })}>Clear</Button>
      ) : (
        <div>
          <a
            className={'link-button'}
            onClick={() => {
              // use js here to make sure redirect_uri is latest url
              const url = `https://github.com/login/oauth/authorize?client_id=${
                GITHUB_OAUTH.clientId
              }&scope=repo&redirect_uri=${encodeURIComponent(window.location.href)}`
              window.location.href = url
            }}
          >
            Create with OAuth (recommended)
          </a>
          <div className={'access-token-input-control'}>
            <TextInput
              backgroundColor="#fff"
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
