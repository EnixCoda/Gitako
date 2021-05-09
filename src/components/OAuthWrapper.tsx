import { useConfigs } from 'containers/ConfigsContext'
import { platform } from 'platforms'
import * as React from 'react'
import { parseURLSearch, run } from 'utils/general'
import { useStateIO } from 'utils/hooks/useStateIO'

/**
 * Setup access token before sending other requests
 */
export function OAuthWrapper({ children }: React.PropsWithChildren<{}>) {
  const running = useSetAccessToken()
  return running ? null : <>{children}</>
}

function useSetAccessToken() {
  const $block = useStateIO(() => Boolean(getCodeSearchParam()))
  const configContext = useConfigs()
  const { accessToken } = configContext.value
  React.useEffect(() => {
    run(async function () {
      const code = getCodeSearchParam()
      if (code && !accessToken) {
        const accessToken = await getAccessTokenWithCode(code)
        if (accessToken) configContext.onChange({ accessToken })
      }
      $block.onChange(false)
    })
  }, [])

  return $block.value
}

function getCodeSearchParam() {
  return parseURLSearch().get('code')
}

async function getAccessTokenWithCode(code: string) {
  const accessToken = await platform.setOAuth(code)
  if (!accessToken) alert(`Gitako: The OAuth token may have expired, please try again.`)
  const search = parseURLSearch()
  search.delete('code')
  window.history.replaceState(
    {},
    'removed search param',
    window.location.pathname.replace(window.location.search, search.toString()),
  )
  return accessToken
}
