import { useConfigs } from 'containers/ConfigsContext'
import { GITHUB_OAUTH } from 'env'
import { platform } from 'platforms'
import { GitHub } from 'platforms/GitHub'
import * as React from 'react'

export function AccessDeniedDescription() {
  const configContext = useConfigs()
  const hasToken = Boolean(configContext.value.accessToken)

  return (
    <div className={'description-area'}>
      <h2>Access Denied</h2>
      {hasToken ? (
        <>
          <p>
            Current access token is either invalid or not granted with permissions to access this
            project.
          </p>
          {platform === GitHub && (
            <p>
              You can grant or request access{' '}
              <a
                href={`https://github.com/settings/connections/applications/${GITHUB_OAUTH.clientId}`}
              >
                here
              </a>{' '}
              if you setup Gitako with OAuth. Or try clear and set token again.
            </p>
          )}
        </>
      ) : (
        <p>
          Gitako needs access token to read this project. Please setup access token in the settings
          panel below.
        </p>
      )}
    </div>
  )
}
