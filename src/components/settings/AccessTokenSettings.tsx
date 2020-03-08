import { wikiLinks } from 'components/SettingsBar'
import { useConfigs } from 'containers/ConfigsContext'
import { oauth } from 'env'
import * as React from 'react'
import { useStates } from 'utils/hooks/useStates'

const ACCESS_TOKEN_REGEXP = /^[0-9a-f]{40}$/

type Props = {}

export function AccessTokenSettings(props: React.PropsWithChildren<Props>) {
  const configContext = useConfigs()
  const hasAccessToken = Boolean(configContext.val.access_token)
  const useAccessToken = useStates('')
  const useAccessTokenHint = useStates<React.ReactNode>('')

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

  return (
    <div className={'gitako-settings-bar-content-section access-token'}>
      <h4>
        Access Token{' '}
        <a href={wikiLinks.createAccessToken} target="_blank">
          (?)
        </a>
      </h4>
      {!hasAccessToken && (
        <a
          className={'link-button'}
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
  )
}
