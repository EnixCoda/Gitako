import { Box, Button, Spinner, Text, TextInput } from '@primer/react'
import { wikiLinks } from 'components/settings/SettingsBar'
import { useConfigs } from 'containers/ConfigsContext'
import { SideBarStateContext } from 'containers/SideBarState'
import { platform } from 'platforms'
import { Gitea } from 'platforms/Gitea'
import { Gitee } from 'platforms/Gitee'
import * as React from 'react'
import { IIFC } from 'react-iifc'
import { useLoadedContext } from 'utils/hooks/useLoadedContext'
import { useStateIO } from 'utils/hooks/useStateIO'
import { SettingsSection } from './SettingsSection'

const ACCESS_TOKEN_REGEXP = /^([0-9a-fA-F]+|gh[pousr]_[A-Za-z0-9_]+)$/

export function AccessTokenSettings() {
  const configContext = useConfigs()
  const { accessToken } = configContext.value
  const hasAccessToken = Boolean(accessToken)
  const [accessTokenInputValue, setAccessTokenInputValue] = React.useState('')
  const useAccessTokenHint = useStateIO<React.ReactNode>('')
  const focusInput = useStateIO(false)
  const sidebarState = useLoadedContext(SideBarStateContext).value

  const { value: accessTokenHint } = useAccessTokenHint

  React.useEffect(() => {
    // clear input when access token updates
    setAccessTokenInputValue('')
  }, [accessToken])

  const onInputAccessToken = React.useCallback(
    ({ currentTarget: { value } }: React.FormEvent<HTMLInputElement>) => {
      setAccessTokenInputValue(value)
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
      if (accessTokenInputValue) {
        configContext.onChange({ accessToken: accessTokenInputValue })
        setAccessTokenInputValue('')
        useAccessTokenHint.onChange(hint)
      }
    },
    [accessTokenInputValue], // eslint-disable-line react-hooks/exhaustive-deps
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
      {sidebarState === 'getting-access-token' ? (
        <Box display="inline-flex" alignItems="center" sx={{ gap: 2 }}>
          <Spinner size="small" />
          <Text>Getting access token</Text>
        </Box>
      ) : hasAccessToken ? (
        <IIFC>
          {() => {
            const [showConfirmButton, setShowConfirmButton] = React.useState(false)
            return (
              <Box>
                {showConfirmButton ? (
                  <IIFC>
                    {() => {
                      const [allowClear, setAllowClear] = React.useState(false)
                      const waitForSeconds = 3
                      const timePast = useTimePast(1000, waitForSeconds * 1000)
                      React.useEffect(() => {
                        const timeout = setTimeout(() => setAllowClear(true), waitForSeconds * 1000)
                        return () => clearTimeout(timeout)
                      }, [])
                      const countDown = waitForSeconds - timePast

                      return (
                        <Box>
                          <Text as="p">Are you sure to clear the token?</Text>
                          <Box display="inline-flex" sx={{ gap: 2 }}>
                            <Button
                              variant="danger"
                              disabled={!allowClear}
                              onClick={() => configContext.onChange({ accessToken: '' })}
                            >
                              {countDown ? `Confirm (${countDown}s)` : `Confirm`}
                            </Button>
                            <Button onClick={() => setShowConfirmButton(false)}>Cancel</Button>
                          </Box>
                        </Box>
                      )
                    }}
                  </IIFC>
                ) : (
                  <Box>
                    <Text as="p">Your token has been saved.</Text>
                    <Button onClick={() => setShowConfirmButton(true)}>Clear</Button>
                  </Box>
                )}
              </Box>
            )
          }}
        </IIFC>
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
              value={accessTokenInputValue}
              placeholder="Or input here manually"
              onFocus={() => focusInput.onChange(true)}
              onBlur={() => focusInput.onChange(false)}
              onChange={onInputAccessToken}
              onKeyPress={onPressAccessToken}
            />
            <Button onClick={() => saveToken()} disabled={!accessTokenInputValue}>
              Save
            </Button>
          </div>
        </div>
      )}
      {accessTokenHint && <span className={'hint'}>{accessTokenHint}</span>}
    </SettingsSection>
  )
}

function useTimePast(unit = 1000, max?: number) {
  const [timePast, setTimePast] = React.useState(0)
  React.useEffect(() => {
    const checkInterval = (unit / 10) >> 0 // 10x check times for better accuracy
    const start = Date.now()
    let memoLastValue = 0
    const interval = setInterval(() => {
      const now = Date.now()
      const pastInMilliseconds = now - start
      const pastInSeconds = (pastInMilliseconds / 1000) >> 0
      if (pastInSeconds !== memoLastValue) {
        setTimePast(pastInSeconds)
        memoLastValue = pastInSeconds

        if (max && pastInMilliseconds >= max) clearInterval(interval)
      }
    }, checkInterval)

    return () => clearInterval(interval)
  }, [unit, max])

  return timePast
}
