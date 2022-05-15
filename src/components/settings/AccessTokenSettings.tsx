import { Button, Text, TextInput } from '@primer/react'
import { wikiLinks } from 'components/settings/SettingsBar'
import { useConfigs } from 'containers/ConfigsContext'
import { platform } from 'platforms'
import { Gitea } from 'platforms/Gitea'
import { Gitee } from 'platforms/Gitee'
import * as React from 'react'
import { useStateIO } from 'utils/hooks/useStateIO'
import { SettingsSection } from './SettingsSection'

const ACCESS_TOKEN_REGEXP = /^([0-9a-fA-F]+|gh[pousr]_[A-Za-z0-9_]+)$/

export function AccessTokenSettings() {
  const configContext = useConfigs()
  const hasAccessToken = Boolean(configContext.value.accessToken)
  const [accessToken, setAccessToken] = React.useState('')
  const useAccessTokenHint = useStateIO<React.ReactNode>('')
  const focusInput = useStateIO(false)

  const { value: accessTokenHint } = useAccessTokenHint

  React.useEffect(() => {
    // clear input when access token updates
    setAccessToken('')
  }, [configContext.value.accessToken])

  const onInputAccessToken = React.useCallback(
    ({ currentTarget: { value } }: React.FormEvent<HTMLInputElement>) => {
      setAccessToken(value)
      useAccessTokenHint.onChange(
        ACCESS_TOKEN_REGEXP.test(value) ? '' : 'Gitako does not recognize the token.',
      )
    },
    [], // eslint-disable-line react-hooks/exhaustive-deps
  )

  const saveToken = React.useCallback(
    async (
      hint: typeof useAccessTokenHint.value = (
        <span>
          <a href="#" onClick={() => window.location.reload()}>
            Reload
          </a>{' '}
          to activate!
        </span>
      ),
    ) => {
      if (accessToken) {
        configContext.onChange({ accessToken })
        setAccessToken('')
        useAccessTokenHint.onChange(hint)
      }
    },
    [accessToken], // eslint-disable-line react-hooks/exhaustive-deps
  )

  const onPressAccessToken = React.useCallback(
    ({ key }: React.KeyboardEvent) => {
      if (key === 'Enter') saveToken()
    },
    [saveToken],
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
            rel="noopener noreferrer"
          >
            (?)
          </a>
        </>
      }
    >
      {hasAccessToken ? (
        <div>
          <Text as="p">Your token has been saved.</Text>
          <Button onClick={() => configContext.onChange({ accessToken: '' })}>Clear</Button>
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
              sx={{ marginRight: 1 }}
              className={'access-token-input'}
              value={accessToken}
              placeholder="Or input here manually"
              onFocus={() => focusInput.onChange(true)}
              onBlur={() => focusInput.onChange(false)}
              onChange={onInputAccessToken}
              onKeyPress={onPressAccessToken}
            />
            <Button onClick={() => saveToken()} disabled={!accessToken}>
              Save
            </Button>
          </div>
        </div>
      )}
      {accessTokenHint && <span className={'hint'}>{accessTokenHint}</span>}
    </SettingsSection>
  )
}
